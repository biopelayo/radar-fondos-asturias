from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


class SchemaValidationError(ValueError):
    pass


class SchemaGate:
    """Dependency-free gate for the JSON Schema subset used by the V2 catalog."""

    def __init__(self, schema_root: Path):
        self.schema_root = schema_root.resolve()
        self._cache: dict[Path, dict[str, Any]] = {}

    def load(self, schema_name: str | Path) -> tuple[dict[str, Any], Path]:
        path = Path(schema_name)
        if not path.is_absolute():
            path = self.schema_root / path
        path = path.resolve()
        if path not in self._cache:
            value = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(value, dict):
                raise SchemaValidationError(f"{path.name}: schema root must be an object")
            self._cache[path] = value
        return self._cache[path], path

    def resolve(self, owner: Path, reference: str) -> tuple[dict[str, Any], Path]:
        file_name, _, fragment = reference.partition("#")
        target_path = (owner.parent / file_name).resolve() if file_name else owner.resolve()
        try:
            target, target_path = self.load(target_path)
        except (OSError, json.JSONDecodeError) as exc:
            raise SchemaValidationError(f"Cannot resolve {reference!r} from {owner.name}") from exc
        if fragment:
            try:
                for token in fragment.lstrip("/").split("/"):
                    target = target[token.replace("~1", "/").replace("~0", "~")]
            except (KeyError, TypeError) as exc:
                raise SchemaValidationError(f"Cannot resolve fragment in {reference!r}") from exc
        if not isinstance(target, dict):
            raise SchemaValidationError(f"Referenced schema {reference!r} is not an object")
        return target, target_path

    def validate(self, instance: Any, schema_name: str | Path) -> None:
        schema, schema_path = self.load(schema_name)
        errors = self._validate(instance, schema, schema_path, "$")
        if errors:
            raise SchemaValidationError("\n".join(errors))

    def _validate(self, instance: Any, schema: dict[str, Any], owner: Path, path: str) -> list[str]:
        errors: list[str] = []
        if "$ref" in schema:
            target, target_path = self.resolve(owner, schema["$ref"])
            errors.extend(self._validate(instance, target, target_path, path))
        if "const" in schema and instance != schema["const"]:
            errors.append(f"{path}: expected {schema['const']!r}")
        if "enum" in schema and instance not in schema["enum"]:
            errors.append(f"{path}: unexpected enum value {instance!r}")

        expected = schema.get("type")
        matches = {
            "object": isinstance(instance, dict),
            "array": isinstance(instance, list),
            "string": isinstance(instance, str),
            "number": isinstance(instance, (int, float)) and not isinstance(instance, bool),
            "integer": isinstance(instance, int) and not isinstance(instance, bool),
            "boolean": isinstance(instance, bool),
            "null": instance is None,
        }
        if expected and not matches[expected]:
            return [*errors, f"{path}: expected {expected}"]

        if isinstance(instance, str):
            if len(instance) < schema.get("minLength", 0):
                errors.append(f"{path}: shorter than minLength")
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
                errors.append(f"{path}: fewer than minItems")
            if schema.get("uniqueItems"):
                normalized = [json.dumps(item, sort_keys=True, ensure_ascii=False) for item in instance]
                if len(normalized) != len(set(normalized)):
                    errors.append(f"{path}: duplicate array items")
            item_schema = schema.get("items")
            if isinstance(item_schema, dict):
                for index, item in enumerate(instance):
                    errors.extend(self._validate(item, item_schema, owner, f"{path}[{index}]"))

        if isinstance(instance, dict):
            for key in schema.get("required", []):
                if key not in instance:
                    errors.append(f"{path}.{key}: required")
            properties = schema.get("properties", {})
            for key, value in instance.items():
                child = properties.get(key)
                if isinstance(child, dict):
                    errors.extend(self._validate(value, child, owner, f"{path}.{key}"))
                elif schema.get("additionalProperties") is False:
                    errors.append(f"{path}.{key}: additional property")

        for child in schema.get("allOf", []):
            errors.extend(self._validate(instance, child, owner, path))
        condition = schema.get("if")
        if isinstance(condition, dict) and not self._validate(instance, condition, owner, path):
            consequence = schema.get("then")
            if isinstance(consequence, dict):
                errors.extend(self._validate(instance, consequence, owner, path))
        return errors
