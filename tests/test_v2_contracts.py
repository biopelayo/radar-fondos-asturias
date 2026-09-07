from __future__ import annotations

import copy
import json
import re
import unittest
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_ROOT = ROOT / "schemas" / "v2"
FIXTURE_ROOT = SCHEMA_ROOT / "fixtures"
SCHEMA_VERSION = "2.0.0"
CONTRACTS = {
    "opportunity": "opportunity.schema.json",
    "source-record": "source-record.schema.json",
    "document": "document.schema.json",
    "claim": "claim.schema.json",
    "opportunity-version": "opportunity-version.schema.json",
    "change-event": "change-event.schema.json",
    "source-health": "source-health.schema.json",
}


class ContractValidator:
    """Small dependency-free validator for the JSON Schema features used by V2."""

    def __init__(self) -> None:
        self.cache: dict[Path, dict] = {}

    def load(self, path: Path) -> dict:
        path = path.resolve()
        if path not in self.cache:
            self.cache[path] = json.loads(path.read_text(encoding="utf-8"))
        return self.cache[path]

    def resolve(self, schema_path: Path, reference: str) -> tuple[dict, Path]:
        file_name, _, fragment = reference.partition("#")
        target_path = (schema_path.parent / file_name).resolve() if file_name else schema_path.resolve()
        target = self.load(target_path)
        if fragment:
            for token in fragment.lstrip("/").split("/"):
                token = token.replace("~1", "/").replace("~0", "~")
                target = target[token]
        return target, target_path

    def validate(self, instance, schema: dict, schema_path: Path, path: str = "$") -> list[str]:
        errors: list[str] = []
        if "$ref" in schema:
            resolved, resolved_path = self.resolve(schema_path, schema["$ref"])
            errors.extend(self.validate(instance, resolved, resolved_path, path))

        if "const" in schema and instance != schema["const"]:
            errors.append(f"{path}: expected constant {schema['const']!r}")
        if "enum" in schema and instance not in schema["enum"]:
            errors.append(f"{path}: value {instance!r} is not in enum")

        expected_type = schema.get("type")
        type_matches = {
            "object": isinstance(instance, dict),
            "array": isinstance(instance, list),
            "string": isinstance(instance, str),
            "number": isinstance(instance, (int, float)) and not isinstance(instance, bool),
            "integer": isinstance(instance, int) and not isinstance(instance, bool),
            "boolean": isinstance(instance, bool),
            "null": instance is None,
        }
        if expected_type and not type_matches[expected_type]:
            errors.append(f"{path}: expected {expected_type}")
            return errors

        if isinstance(instance, str):
            if len(instance) < schema.get("minLength", 0):
                errors.append(f"{path}: string is too short")
            if "pattern" in schema and re.search(schema["pattern"], instance) is None:
                errors.append(f"{path}: does not match {schema['pattern']}")
            if schema.get("format") == "date-time":
                try:
                    datetime.fromisoformat(instance.replace("Z", "+00:00"))
                except ValueError:
                    errors.append(f"{path}: invalid date-time")
            if schema.get("format") == "uri":
                parsed = urlparse(instance)
                if not parsed.scheme or not parsed.netloc:
                    errors.append(f"{path}: invalid URI")

        if isinstance(instance, (int, float)) and not isinstance(instance, bool):
            if "minimum" in schema and instance < schema["minimum"]:
                errors.append(f"{path}: below minimum")
            if "maximum" in schema and instance > schema["maximum"]:
                errors.append(f"{path}: above maximum")

        if isinstance(instance, list):
            if len(instance) < schema.get("minItems", 0):
                errors.append(f"{path}: too few items")
            if schema.get("uniqueItems"):
                normalized = [json.dumps(item, sort_keys=True) for item in instance]
                if len(normalized) != len(set(normalized)):
                    errors.append(f"{path}: items are not unique")
            if "items" in schema:
                for index, item in enumerate(instance):
                    errors.extend(self.validate(item, schema["items"], schema_path, f"{path}[{index}]"))

        if isinstance(instance, dict):
            required = schema.get("required", [])
            for key in required:
                if key not in instance:
                    errors.append(f"{path}.{key}: required property is missing")
            properties = schema.get("properties", {})
            for key, value in instance.items():
                if key in properties:
                    errors.extend(self.validate(value, properties[key], schema_path, f"{path}.{key}"))
                elif schema.get("additionalProperties") is False:
                    errors.append(f"{path}.{key}: additional property is forbidden")

        for subschema in schema.get("allOf", []):
            errors.extend(self.validate(instance, subschema, schema_path, path))
        if "if" in schema and not self.validate(instance, schema["if"], schema_path, path):
            if "then" in schema:
                errors.extend(self.validate(instance, schema["then"], schema_path, path))
        return errors


def json_pointer(value, pointer: str):
    current = value
    for token in pointer.lstrip("/").split("/"):
        token = token.replace("~1", "/").replace("~0", "~")
        current = current[int(token)] if isinstance(current, list) else current[token]
    return current


class V2ContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.validator = ContractValidator()
        cls.schemas = {
            name: cls.validator.load(SCHEMA_ROOT / schema_name)
            for name, schema_name in CONTRACTS.items()
        }
        cls.fixtures = {
            name: json.loads((FIXTURE_ROOT / f"{name}.json").read_text(encoding="utf-8"))
            for name in CONTRACTS
        }

    def test_every_fixture_satisfies_its_json_schema(self) -> None:
        for name, fixture in self.fixtures.items():
            with self.subTest(contract=name):
                errors = self.validator.validate(fixture, self.schemas[name], SCHEMA_ROOT / CONTRACTS[name])
                self.assertEqual(errors, [], "\n".join(errors))

    def test_schema_ids_are_versioned_unique_and_all_refs_resolve_locally(self) -> None:
        schemas = [self.validator.load(SCHEMA_ROOT / "common.schema.json"), *self.schemas.values()]
        ids = [schema["$id"] for schema in schemas]
        self.assertEqual(len(ids), len(set(ids)))
        for schema in schemas:
            self.assertEqual(schema["$schema"], "https://json-schema.org/draft/2020-12/schema")
            self.assertIn("/schemas/v2/", schema["$id"])

        def walk_refs(node, owner: Path):
            if isinstance(node, dict):
                if "$ref" in node:
                    self.validator.resolve(owner, node["$ref"])
                for child in node.values():
                    walk_refs(child, owner)
            elif isinstance(node, list):
                for child in node:
                    walk_refs(child, owner)

        walk_refs(self.validator.load(SCHEMA_ROOT / "common.schema.json"), SCHEMA_ROOT / "common.schema.json")
        for name, schema in self.schemas.items():
            walk_refs(schema, SCHEMA_ROOT / CONTRACTS[name])

    def test_fixture_graph_has_consistent_ids_versions_and_provenance(self) -> None:
        opportunity = self.fixtures["opportunity"]
        source = self.fixtures["source-record"]
        document = self.fixtures["document"]
        claim = self.fixtures["claim"]
        version = self.fixtures["opportunity-version"]
        event = self.fixtures["change-event"]
        health = self.fixtures["source-health"]

        self.assertTrue(all(value["schemaVersion"] == SCHEMA_VERSION for value in self.fixtures.values()))
        self.assertEqual(source["id"], f"src:{source['sourceKey']}:{source['externalId'].lower()}")
        self.assertIn(source["id"], opportunity["sourceRecordIds"])
        self.assertIn(source["id"], opportunity["provenance"]["sourceRecordIds"])
        self.assertEqual(document["revisionId"], f"docrev:{document['sha256']}")
        self.assertIn(document["revisionId"], opportunity["documentRevisionIds"])
        self.assertIn(claim["id"], document["dependentClaimIds"])
        self.assertEqual(claim["evidence"][0]["documentRevisionId"], document["revisionId"])
        self.assertEqual(json_pointer(opportunity, claim["path"]), claim["value"])
        self.assertEqual(version["snapshot"], opportunity)
        self.assertEqual(version["id"], f"oppver:{version['contentHash']}")
        self.assertEqual(version["opportunityId"], opportunity["id"])
        self.assertEqual(event["toVersionId"], version["id"])
        self.assertEqual(event["opportunityId"], opportunity["id"])
        self.assertEqual(health["id"], f"health:{health['sourceKey']}")

    def test_claim_requires_page_fragment_and_bounded_confidence(self) -> None:
        claim = copy.deepcopy(self.fixtures["claim"])
        claim["confidence"] = 1.2
        claim["evidence"][0]["page"] = 0
        claim["evidence"][0]["fragment"] = ""
        errors = self.validator.validate(claim, self.schemas["claim"], SCHEMA_ROOT / CONTRACTS["claim"])
        self.assertTrue(any("confidence" in error and "above maximum" in error for error in errors))
        self.assertTrue(any("page" in error and "below minimum" in error for error in errors))
        self.assertTrue(any("fragment" in error and "too short" in error for error in errors))

    def test_contracts_reject_unknown_fields_and_wrong_schema_version(self) -> None:
        opportunity = copy.deepcopy(self.fixtures["opportunity"])
        opportunity["schemaVersion"] = "1.0.0"
        opportunity["privateScore"] = 99
        errors = self.validator.validate(
            opportunity,
            self.schemas["opportunity"],
            SCHEMA_ROOT / CONTRACTS["opportunity"],
        )
        self.assertTrue(any("expected constant" in error for error in errors))
        self.assertTrue(any("privateScore" in error and "forbidden" in error for error in errors))

    def test_public_opportunity_contract_excludes_private_workspace_state(self) -> None:
        forbidden = {"score", "saved", "notes", "applicationStage", "profile", "eligibilityDecision"}
        opportunity_properties = set(self.schemas["opportunity"]["properties"])
        self.assertTrue(forbidden.isdisjoint(opportunity_properties))
        self.assertTrue(forbidden.isdisjoint(self.fixtures["opportunity"]))


if __name__ == "__main__":
    unittest.main()
