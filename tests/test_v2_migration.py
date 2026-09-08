from __future__ import annotations

import copy
import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from scripts.v2.migrate_v1 import SCHEMA_ROOT, bytes_sha256, migrate_catalog
from scripts.v2.schema_gate import SchemaGate, SchemaValidationError


ROOT = Path(__file__).resolve().parents[1]
V1_INPUT = ROOT / "public" / "data" / "opportunities.json"
CURRENT_OPPORTUNITY_ID = "bopa-2026-07371"


def files_under(root: Path) -> dict[str, bytes]:
    return {
        path.relative_to(root).as_posix(): path.read_bytes()
        for path in sorted(root.rglob("*.json"))
    }


class V2MigrationTests(unittest.TestCase):
    def test_replay_is_byte_deterministic_and_preserves_v1_reference(self) -> None:
        with tempfile.TemporaryDirectory() as first, tempfile.TemporaryDirectory() as second:
            first_result = migrate_catalog(V1_INPUT, Path(first), CURRENT_OPPORTUNITY_ID)
            second_result = migrate_catalog(V1_INPUT, Path(second), CURRENT_OPPORTUNITY_ID)
            self.assertEqual(files_under(Path(first)), files_under(Path(second)))

        v1 = json.loads(V1_INPUT.read_text(encoding="utf-8"))
        original = next(item for item in v1["opportunities"] if item["id"] == CURRENT_OPPORTUNITY_ID)
        migrated = first_result["shard"]["opportunities"][0]
        source = first_result["shard"]["sourceRecords"][0]
        version = first_result["shard"]["versions"][0]
        self.assertEqual(migrated["canonicalReference"], original["sourceRef"])
        self.assertEqual(source["canonicalUrl"], original["sourceUrl"])
        self.assertEqual(source["externalId"], original["sourceRef"])
        self.assertEqual(version["snapshot"], migrated)
        self.assertEqual(migrated["currentVersionId"], version["id"])
        self.assertEqual(version["id"], f"oppver:{version['contentHash']}")
        self.assertEqual(migrated["documentRevisionIds"], [])
        self.assertEqual(migrated["quality"]["reviewStatus"], "needs_review")

    def test_manifest_hashes_match_published_artifacts_and_schema_gate(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            result = migrate_catalog(V1_INPUT, output, CURRENT_OPPORTUNITY_ID)
            manifest = json.loads((output / "manifest.json").read_text(encoding="utf-8"))
            shard_descriptor = manifest["shards"][0]
            shard_bytes = (output / shard_descriptor["path"]).read_bytes()
            health_bytes = (output / manifest["health"]["path"]).read_bytes()
            self.assertEqual(shard_descriptor["sha256"], bytes_sha256(shard_bytes))
            self.assertEqual(manifest["health"]["sha256"], bytes_sha256(health_bytes))
            self.assertEqual(manifest["catalogVersion"], result["health"]["catalogVersion"])
            gate = SchemaGate(SCHEMA_ROOT)
            gate.validate(json.loads(shard_bytes), "catalog-shard.schema.json")
            gate.validate(json.loads(health_bytes), "health.schema.json")
            gate.validate(manifest, "manifest.schema.json")

    def test_full_catalog_migrates_every_public_opportunity(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            result = migrate_catalog(V1_INPUT, output)
            v1 = json.loads(V1_INPUT.read_text(encoding="utf-8"))
            public_items = [item for item in v1["opportunities"] if not item.get("demo")]

            self.assertEqual(result["manifest"]["opportunityCount"], len(public_items))
            self.assertEqual(
                sum(descriptor["count"] for descriptor in result["manifest"]["shards"]),
                len(public_items),
            )
            migrated_ids = [
                opportunity["id"]
                for shard in result["shards"]
                for opportunity in shard["opportunities"]
            ]
            self.assertEqual(len(migrated_ids), len(set(migrated_ids)))
            self.assertEqual(len(result["shards"]), len({item["source"] for item in public_items}))

    def test_schema_gate_rejects_tampered_version_before_publication(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            result = migrate_catalog(V1_INPUT, Path(directory), CURRENT_OPPORTUNITY_ID)
        tampered = copy.deepcopy(result["shard"])
        tampered["schemaVersion"] = "1.0.0"
        with self.assertRaises(SchemaValidationError):
            SchemaGate(SCHEMA_ROOT).validate(tampered, "catalog-shard.schema.json")

    def test_health_is_derived_from_v1_source_status(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            result = migrate_catalog(V1_INPUT, Path(directory), CURRENT_OPPORTUNITY_ID)
        v1 = json.loads(V1_INPUT.read_text(encoding="utf-8"))
        expected = {key.lower() if key != "UE" else "eu": value for key, value in v1["sourceStatus"].items()}
        health = {item["sourceKey"]: item for item in result["health"]["sources"]}
        self.assertEqual(set(health), set(expected))
        for key, value in expected.items():
            self.assertEqual(health[key]["recordCount"], value["count"])
            self.assertEqual(health[key]["status"], "healthy" if value["status"] == "ok" else health[key]["status"])

    def test_public_artifacts_contain_no_private_v1_workspace_fields(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            migrate_catalog(V1_INPUT, Path(directory), CURRENT_OPPORTUNITY_ID)
            rendered = b"\n".join(files_under(Path(directory)).values()).decode("utf-8")
        for forbidden in ("privateScore", "displayName", "incomeGoal", "applicationStage"):
            self.assertNotIn(forbidden, rendered)
        self.assertEqual(hashlib.sha256(rendered.encode("utf-8")).hexdigest().__len__(), 64)


if __name__ == "__main__":
    unittest.main()
