#!/usr/bin/env python3
"""Migrate one public V1 opportunity into a deterministic, schema-gated V2 shard."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import re
import unicodedata
from datetime import date, datetime, time
from pathlib import Path
from typing import Any
from uuid import uuid4
from zoneinfo import ZoneInfo

try:
    from .schema_gate import SchemaGate, SchemaValidationError
except ImportError:  # Direct execution: python scripts/v2/migrate_v1.py
    from schema_gate import SchemaGate, SchemaValidationError


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = ROOT / "public" / "data" / "opportunities.json"
DEFAULT_OUTPUT = ROOT / "public" / "data" / "v2"
SCHEMA_ROOT = ROOT / "schemas" / "v2"
SCHEMA_VERSION = "2.0.0"
MIGRATOR_VERSION = "v1-to-v2.1.0.0"
RESOLVER_VERSION = "resolver-v2.0.0"
MADRID = ZoneInfo("Europe/Madrid")


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def pretty_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8")


def sha256(value: Any) -> str:
    return f"sha256:{hashlib.sha256(canonical_bytes(value)).hexdigest()}"


def bytes_sha256(value: bytes) -> str:
    return f"sha256:{hashlib.sha256(value).hexdigest()}"


def normalized(value: str) -> str:
    folded = unicodedata.normalize("NFKD", value.lower())
    return "".join(character for character in folded if not unicodedata.combining(character))


def slug(value: str) -> str:
    result = re.sub(r"[^a-z0-9._-]+", "-", normalized(value)).strip("-._")
    return result or hashlib.sha256(value.encode("utf-8")).hexdigest()[:24]


def require_datetime(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value:
        raise ValueError(f"{field} must be a non-empty ISO date-time")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"{field} must be an ISO date-time") from exc
    if parsed.tzinfo is None:
        raise ValueError(f"{field} must include a time-zone offset")
    return value


def date_at_start(value: str) -> str:
    return datetime.combine(date.fromisoformat(value), time.min, MADRID).isoformat()


def date_at_end(value: str) -> str:
    return datetime.combine(date.fromisoformat(value), time(23, 59, 59), MADRID).isoformat()


def source_key(value: str) -> str:
    aliases = {"UE": "eu"}
    return aliases.get(value, slug(value))


def family(value: str) -> str:
    families = {
        "subvencion": "grant",
        "autoempleo": "self_employment",
        "licitacion": "procurement",
        "financiacion": "loan",
        "premio": "prize",
    }
    return families.get(normalized(value), "grant")


def geography(territory: str) -> dict[str, Any]:
    text = normalized(territory)
    if "asturias" in text:
        return {"scope": "regional", "countryCodes": ["ES"], "regionCodes": ["ES-AS"], "executionPlaces": [territory]}
    if "union europea" in text or text in {"ue", "eu"}:
        return {"scope": "eu", "countryCodes": [], "regionCodes": [], "executionPlaces": [territory]}
    if "espana" in text:
        return {"scope": "national", "countryCodes": ["ES"], "regionCodes": [], "executionPlaces": [territory]}
    return {"scope": "international", "countryCodes": [], "regionCodes": [], "executionPlaces": [territory]}


def lifecycle(item: dict[str, Any], observed_at: str) -> str:
    if not item.get("deadlineVerified"):
        return "open"
    deadline = date.fromisoformat(item["deadline"])
    observed = datetime.fromisoformat(observed_at.replace("Z", "+00:00")).date()
    return "closed" if deadline < observed else "open"


def migrate_opportunity(item: dict[str, Any], observed_at: str) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    required = ("title", "issuer", "source", "sourceRef", "sourceUrl", "kind", "territory", "publishedAt", "deadline")
    missing = [key for key in required if not isinstance(item.get(key), str) or not item[key].strip()]
    if missing:
        raise ValueError(f"V1 opportunity has invalid fields: {', '.join(missing)}")
    if not item["sourceUrl"].startswith("https://"):
        raise ValueError("V1 sourceUrl must use HTTPS")
    date.fromisoformat(item["publishedAt"])
    date.fromisoformat(item["deadline"])

    key = source_key(item["source"])
    external_slug = slug(item["sourceRef"])
    source_record_id = f"src:{key}:{external_slug}"
    authority_hash = sha256({"name": item["issuer"], "territory": item["territory"]}).split(":", 1)[1]
    opportunity_hash = sha256({"authority": authority_hash, "reference": item["sourceRef"]}).split(":", 1)[1]
    opportunity_id = f"opp:sha256:{opportunity_hash}"
    source_record = {
        "schemaVersion": SCHEMA_VERSION,
        "id": source_record_id,
        "sourceKey": key,
        "externalId": item["sourceRef"],
        "canonicalUrl": item["sourceUrl"],
        "retrievedUrl": item["sourceUrl"],
        "firstObservedAt": observed_at,
        "lastObservedAt": observed_at,
        "publishedAt": date_at_start(item["publishedAt"]),
        "contentHash": sha256(item),
        "http": {"status": 200, "contentType": "application/vnd.radar.v1+json"},
        "adapter": {"name": "v1-public-catalog", "version": MIGRATOR_VERSION, "schemaVersion": "1"},
        "externalReferences": [item["sourceRef"]],
        "retrieval": {"status": "ok", "checkedAt": observed_at},
    }
    application_window: dict[str, Any] = {
        "id": "window:primary",
        "opensAt": date_at_start(item["publishedAt"]),
        "timeZone": "Europe/Madrid",
        "mode": "absolute" if item.get("deadlineVerified") else "unknown",
        "verified": bool(item.get("deadlineVerified")),
    }
    if item.get("deadlineVerified"):
        application_window["closesAt"] = date_at_end(item["deadline"])
    else:
        application_window["relativeRule"] = "Fecha V1 no verificada; requiere contraste documental."

    finance: dict[str, Any] = {"currency": "EUR", "eligibleCostNotes": []}
    amount = item.get("amount")
    if isinstance(amount, (int, float)) and not isinstance(amount, bool) and amount > 0:
        finance["programmeBudget"] = amount
    intensity = item.get("aidIntensity")
    if isinstance(intensity, str) and intensity.strip():
        finance["eligibleCostNotes"].append(intensity.strip())

    opportunity: dict[str, Any] = {
        "schemaVersion": SCHEMA_VERSION,
        "id": opportunity_id,
        "canonicalReference": item["sourceRef"],
        "family": family(item["kind"]),
        "titles": [{"language": "es", "value": item["title"]}],
        "authority": {
            "id": f"authority:sha256:{authority_hash}",
            "name": item["issuer"],
            "level": geography(item["territory"])["scope"],
            "countryCode": "ES" if "ES" in geography(item["territory"])["countryCodes"] else None,
        },
        "geography": geography(item["territory"]),
        "lifecycleStatus": lifecycle(item, observed_at),
        "applicationWindows": [application_window],
        "finance": finance,
        "beneficiaryClasses": [],
        "eligibleActivities": list(dict.fromkeys(str(tag) for tag in item.get("tags", []) if str(tag).strip())),
        "excludedActivities": [],
        "incompatibilities": list(dict.fromkeys(str(value) for value in item.get("blockers", []) if str(value).strip())),
        "submission": {"officialUrl": item["sourceUrl"], "channel": "unknown"},
        "sourceRecordIds": [source_record_id],
        "documentRevisionIds": [],
        "relatedOpportunityIds": [],
        "quality": {
            "completeness": 0.5,
            "evidenceCoverage": 0,
            "conflictCount": 0,
            "reviewStatus": "needs_review",
        },
        "provenance": {
            "sourceRecordIds": [source_record_id],
            "documentRevisionIds": [],
            "claimIds": [],
            "resolverVersion": RESOLVER_VERSION,
            "derivedAt": observed_at,
        },
    }
    if opportunity["authority"]["countryCode"] is None:
        del opportunity["authority"]["countryCode"]

    semantic_snapshot = copy.deepcopy(opportunity)
    semantic_snapshot["provenance"].pop("derivedAt", None)
    content_hash = sha256(semantic_snapshot)
    version_id = f"oppver:{content_hash}"
    opportunity["currentVersionId"] = version_id
    version = {
        "schemaVersion": SCHEMA_VERSION,
        "id": version_id,
        "opportunityId": opportunity_id,
        "sequence": 1,
        "contentHash": content_hash,
        "observedAt": observed_at,
        "effectiveAt": date_at_start(item["publishedAt"]),
        "snapshot": copy.deepcopy(opportunity),
        "sourceRecordIds": [source_record_id],
        "documentRevisionIds": [],
        "claimIds": [],
        "semanticDiff": [],
        "precedenceRuleVersion": "precedence-v2.0.0",
    }
    return opportunity, source_record, version


def migrate_health(payload: dict[str, Any], generated_at: str) -> list[dict[str, Any]]:
    statuses = payload.get("sourceStatus")
    counts: dict[str, int] = {}
    for item in payload.get("opportunities", []):
        if isinstance(item, dict) and isinstance(item.get("source"), str):
            key = source_key(item["source"])
            counts[key] = counts.get(key, 0) + 1
    if not isinstance(statuses, dict) or not statuses:
        return [
            {
                "schemaVersion": SCHEMA_VERSION,
                "id": f"health:{key}",
                "sourceKey": key,
                "status": "healthy",
                "checkedAt": generated_at,
                "lastSuccessAt": generated_at,
                "recordCount": count,
                "consecutiveFailures": 0,
            }
            for key, count in sorted(counts.items())
        ]

    health: list[dict[str, Any]] = []
    for name, status in sorted(statuses.items(), key=lambda pair: source_key(pair[0])):
        if not isinstance(status, dict):
            raise ValueError(f"sourceStatus.{name} must be an object")
        key = source_key(name)
        raw_status = status.get("status")
        count = status.get("count", counts.get(key, 0))
        if not isinstance(count, int) or isinstance(count, bool) or count < 0:
            raise ValueError(f"sourceStatus.{name}.count must be a non-negative integer")
        failed = raw_status != "ok"
        mapped = "healthy" if not failed else ("degraded" if count else "down")
        entry: dict[str, Any] = {
            "schemaVersion": SCHEMA_VERSION,
            "id": f"health:{key}",
            "sourceKey": key,
            "status": mapped,
            "checkedAt": require_datetime(status.get("checkedAt", generated_at), f"sourceStatus.{name}.checkedAt"),
            "recordCount": count,
            "consecutiveFailures": 1 if failed else 0,
        }
        last_success = status.get("lastSuccessAt")
        if last_success:
            entry["lastSuccessAt"] = require_datetime(last_success, f"sourceStatus.{name}.lastSuccessAt")
        if failed:
            entry["error"] = {
                "code": "v1-source-error",
                "message": str(status.get("error") or "La fuente V1 informó de un fallo."),
                "retryable": True,
            }
        health.append(entry)
    return health


def validate_graph(shard: dict[str, Any]) -> None:
    opportunity = shard["opportunities"][0]
    version = shard["versions"][0]
    source_record = shard["sourceRecords"][0]
    if version["snapshot"] != opportunity:
        raise ValueError("version snapshot must equal the published opportunity")
    if opportunity["currentVersionId"] != version["id"]:
        raise ValueError("opportunity currentVersionId must reference its version")
    if opportunity["sourceRecordIds"] != [source_record["id"]]:
        raise ValueError("opportunity provenance must reference its source record")
    if version["id"] != f"oppver:{version['contentHash']}":
        raise ValueError("version ID must be derived from its content hash")


def write_outputs(output: Path, files: dict[Path, bytes]) -> None:
    staged: list[tuple[Path, Path]] = []
    try:
        for relative_path, content in files.items():
            target = output / relative_path
            target.parent.mkdir(parents=True, exist_ok=True)
            temporary = target.with_name(f".{target.name}.{uuid4().hex}.tmp")
            temporary.write_bytes(content)
            staged.append((temporary, target))
        for temporary, target in staged:
            os.replace(temporary, target)
    finally:
        for temporary, _ in staged:
            temporary.unlink(missing_ok=True)


def migrate_catalog(
    input_path: Path = DEFAULT_INPUT,
    output: Path = DEFAULT_OUTPUT,
    opportunity_id: str | None = None,
) -> dict[str, Any]:
    payload = json.loads(input_path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict) or not isinstance(payload.get("opportunities"), list) or not payload["opportunities"]:
        raise ValueError("V1 input must contain at least one public opportunity")
    generated_at = require_datetime(payload.get("generatedAt"), "generatedAt")
    candidates = [item for item in payload["opportunities"] if not item.get("demo")]
    if opportunity_id is not None:
        candidates = [item for item in candidates if item.get("id") == opportunity_id]
    if not candidates:
        raise ValueError("Requested public opportunity was not found")
    selected = candidates[0]
    opportunity, source_record, version = migrate_opportunity(selected, generated_at)
    prefix = hashlib.sha256(opportunity["id"].encode("utf-8")).hexdigest()[:2]
    shard = {
        "schemaVersion": SCHEMA_VERSION,
        "id": f"shard:opportunities:{prefix}",
        "generatedAt": generated_at,
        "opportunities": [opportunity],
        "versions": [version],
        "sourceRecords": [source_record],
        "documents": [],
        "claims": [],
        "changeEvents": [],
    }
    source_health = migrate_health(payload, generated_at)
    catalog_version = sha256({"schemaVersion": SCHEMA_VERSION, "shard": shard, "sourceHealth": source_health})
    health = {
        "schemaVersion": SCHEMA_VERSION,
        "catalogVersion": catalog_version,
        "generatedAt": generated_at,
        "sources": source_health,
    }
    shard_path = Path("shards") / "opportunities" / f"{prefix}.json"
    shard_bytes = pretty_bytes(shard)
    health_bytes = pretty_bytes(health)
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "catalogVersion": catalog_version,
        "generatedAt": generated_at,
        "inputHash": sha256(payload),
        "opportunityCount": 1,
        "shards": [{
            "id": shard["id"],
            "path": shard_path.as_posix(),
            "sha256": bytes_sha256(shard_bytes),
            "count": 1,
        }],
        "health": {"path": "health.json", "sha256": bytes_sha256(health_bytes)},
    }

    gate = SchemaGate(SCHEMA_ROOT)
    gate.validate(shard, "catalog-shard.schema.json")
    gate.validate(health, "health.schema.json")
    gate.validate(manifest, "manifest.schema.json")
    validate_graph(shard)
    manifest_bytes = pretty_bytes(manifest)
    files = {shard_path: shard_bytes, Path("health.json"): health_bytes, Path("manifest.json"): manifest_bytes}
    write_outputs(output, files)
    return {"manifest": manifest, "health": health, "shard": shard, "files": files}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--opportunity-id")
    args = parser.parse_args()
    try:
        result = migrate_catalog(args.input, args.output, args.opportunity_id)
    except (OSError, json.JSONDecodeError, SchemaValidationError, ValueError) as exc:
        print(f"ERROR V2 migration rejected: {exc}")
        return 1
    descriptor = result["manifest"]["shards"][0]
    print(f"Wrote V2 catalog {result['manifest']['catalogVersion']} ({descriptor['path']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
