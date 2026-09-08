from __future__ import annotations

import json
import tempfile
import unittest
from datetime import date, datetime, timezone
from pathlib import Path
from unittest.mock import patch
from urllib.error import URLError

from scripts import collect


TODAY = date(2026, 9, 7)
PREVIOUS_REFRESH = "2026-09-06T06:35:00+00:00"
CHECKED_AT = datetime(2026, 9, 7, 15, 30, tzinfo=timezone.utc)


def opportunity(source: str, reference: str, published: str, *, score: int = 70) -> dict:
    item = collect.make_opportunity(
        source=source,
        reference=reference,
        title=f"Ayuda de prueba {reference}",
        issuer="Organismo de prueba",
        url=f"https://example.test/{source.lower()}/{reference}",
        territory="Asturias",
        published=published,
        deadline="2026-12-31",
        deadline_verified=True,
    )
    item["score"] = score
    return item


def payload(items: list[dict]) -> dict:
    counts = {source: sum(item["source"] == source for item in items) for source in collect.SOURCE_KINDS}
    return {
        "generatedAt": PREVIOUS_REFRESH,
        "notice": "test",
        "sources": collect.SOURCE_KINDS,
        "sourceStatus": {
            source: {
                "status": "ok",
                "count": count,
                "collectedCount": count,
                "checkedAt": PREVIOUS_REFRESH,
                "lastSuccessAt": PREVIOUS_REFRESH,
            }
            for source, count in counts.items()
        },
        "errors": [],
        "opportunities": items,
    }


class DatasetCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        root = Path(self.temp_directory.name)
        self.public = root / "public" / "data" / "opportunities.json"
        self.bundled = root / "src" / "data" / "opportunities.generated.json"

    def tearDown(self) -> None:
        self.temp_directory.cleanup()

    def write_existing(self, value: dict) -> None:
        serialized = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
        self.public.parent.mkdir(parents=True, exist_ok=True)
        self.bundled.parent.mkdir(parents=True, exist_ok=True)
        self.public.write_text(serialized, encoding="utf-8")
        self.bundled.write_text(serialized, encoding="utf-8")

    def read_pair(self) -> tuple[dict, dict]:
        return (
            json.loads(self.public.read_text(encoding="utf-8")),
            json.loads(self.bundled.read_text(encoding="utf-8")),
        )

    def run_update(self, collectors) -> int:
        return collect.update_dataset(
            today=TODAY,
            days=10,
            keep_days=120,
            collectors=collectors,
            output=self.public,
            bundled_output=self.bundled,
            now=CHECKED_AT,
        )

    def test_partial_failure_preserves_failed_source_and_last_complete_freshness(self) -> None:
        bdns_previous = opportunity("BDNS", "old-bdns", "2026-09-05")
        bopa_previous = opportunity("BOPA", "old-bopa", "2026-09-06")
        eu_previous = opportunity("UE", "old-eu", "2026-08-20")
        self.write_existing(payload([bdns_previous, bopa_previous, eu_previous]))

        def bdns_failure():
            raise URLError("BDNS unavailable")

        code = self.run_update([
            ("BDNS", bdns_failure),
            ("BOE", lambda: [opportunity("BOE", "new-boe", TODAY.isoformat())]),
            ("BOPA", lambda: []),
            ("UE", lambda: [opportunity("UE", "new-eu", "2026-09-01")]),
        ])

        self.assertEqual(code, 0)
        public, bundled = self.read_pair()
        self.assertEqual(public, bundled)
        by_id = {item["id"]: item for item in public["opportunities"]}
        self.assertEqual(by_id[bdns_previous["id"]], bdns_previous)
        self.assertIn("ue-new-eu", by_id)
        self.assertNotIn(eu_previous["id"], by_id)
        self.assertEqual(public["generatedAt"], PREVIOUS_REFRESH)
        self.assertEqual(public["checkedAt"], CHECKED_AT.isoformat())
        self.assertEqual(public["sourceStatus"]["BDNS"]["status"], "error")
        self.assertEqual(public["sourceStatus"]["BDNS"]["count"], 1)
        self.assertEqual(public["sourceStatus"]["BDNS"]["lastSuccessAt"], PREVIOUS_REFRESH)
        self.assertEqual(public["sourceStatus"]["BOE"]["lastSuccessAt"], CHECKED_AT.isoformat())
        self.assertIn("BDNS: URLError", public["errors"][0])

    def test_all_source_failure_leaves_both_files_untouched(self) -> None:
        self.write_existing(payload([opportunity("UE", "existing", "2026-09-01")]))
        public_before = self.public.read_bytes()
        bundled_before = self.bundled.read_bytes()

        def failure():
            raise RuntimeError("offline")

        code = self.run_update([(source, failure) for source in collect.SOURCE_KINDS])

        self.assertEqual(code, 1)
        self.assertEqual(self.public.read_bytes(), public_before)
        self.assertEqual(self.bundled.read_bytes(), bundled_before)

    def test_full_success_advances_freshness_and_replaces_covered_segments(self) -> None:
        bdns_recent = opportunity("BDNS", "recent", "2026-09-05")
        bdns_older = opportunity("BDNS", "older", "2026-08-01")
        eu_previous = opportunity("UE", "closed", "2026-08-20")
        self.write_existing(payload([bdns_recent, bdns_older, eu_previous]))

        code = self.run_update([
            ("BDNS", lambda: [opportunity("BDNS", "fresh", "2026-09-07")]),
            ("BOE", lambda: []),
            ("BOPA", lambda: []),
            ("UE", lambda: [opportunity("UE", "open", "2026-09-02")]),
        ])

        self.assertEqual(code, 0)
        public, bundled = self.read_pair()
        self.assertEqual(public, bundled)
        ids = {item["id"] for item in public["opportunities"]}
        self.assertNotIn(bdns_recent["id"], ids)
        self.assertIn(bdns_older["id"], ids)
        self.assertNotIn(eu_previous["id"], ids)
        self.assertIn("bdns-fresh", ids)
        self.assertIn("ue-open", ids)
        self.assertEqual(public["generatedAt"], CHECKED_AT.isoformat())
        self.assertEqual(public["errors"], [])
        for status in public["sourceStatus"].values():
            self.assertEqual(status["status"], "ok")
            self.assertEqual(status["lastSuccessAt"], CHECKED_AT.isoformat())

    def test_repeated_gazette_entry_is_replaced_by_fresh_copy(self) -> None:
        previous = opportunity("BOPA", "2026-07371", "2026-09-07", score=60)
        fresh = opportunity("BOPA", "2026-07371", "2026-09-07", score=91)
        self.write_existing(payload([previous]))

        code = self.run_update([
            ("BDNS", lambda: []),
            ("BOE", lambda: []),
            ("BOPA", lambda: [fresh]),
            ("UE", lambda: []),
        ])

        self.assertEqual(code, 0)
        public, bundled = self.read_pair()
        self.assertEqual(public, bundled)
        matching = [item for item in public["opportunities"] if item["id"] == fresh["id"]]
        self.assertEqual(len(matching), 1)
        self.assertEqual(matching[0]["score"], 91)

    def test_invalid_cross_source_duplicate_is_rejected_before_writing(self) -> None:
        self.write_existing(payload([opportunity("UE", "existing", "2026-09-01")]))
        public_before = self.public.read_bytes()
        bundled_before = self.bundled.read_bytes()
        bdns = opportunity("BDNS", "first", "2026-09-07")
        boe = opportunity("BOE", "second", "2026-09-07")
        boe["id"] = bdns["id"]

        code = self.run_update([
            ("BDNS", lambda: [bdns]),
            ("BOE", lambda: [boe]),
            ("BOPA", lambda: []),
            ("UE", lambda: []),
        ])

        self.assertEqual(code, 1)
        self.assertEqual(self.public.read_bytes(), public_before)
        self.assertEqual(self.bundled.read_bytes(), bundled_before)

    def test_second_artifact_write_failure_rolls_back_canonical_file(self) -> None:
        self.write_existing(payload([opportunity("UE", "existing", "2026-09-01")]))
        public_before = self.public.read_bytes()
        bundled_before = self.bundled.read_bytes()
        real_replace = collect.os.replace
        replace_calls = 0

        def fail_second_replace(source, target):
            nonlocal replace_calls
            replace_calls += 1
            if replace_calls == 2:
                raise OSError("simulated bundled write failure")
            return real_replace(source, target)

        with patch.object(collect.os, "replace", side_effect=fail_second_replace):
            code = self.run_update([
                ("BDNS", lambda: [opportunity("BDNS", "fresh", "2026-09-07")]),
                ("BOE", lambda: []),
                ("BOPA", lambda: []),
                ("UE", lambda: [opportunity("UE", "open", "2026-09-02")]),
            ])

        self.assertEqual(code, 1)
        self.assertEqual(self.public.read_bytes(), public_before)
        self.assertEqual(self.bundled.read_bytes(), bundled_before)

    def test_invalid_source_result_is_treated_as_failure_and_preserved(self) -> None:
        bdns_previous = opportunity("BDNS", "existing", "2026-09-05")
        self.write_existing(payload([bdns_previous]))
        invalid = opportunity("BOE", "wrong-source", "2026-09-07")

        code = self.run_update([
            ("BDNS", lambda: [invalid]),
            ("BOE", lambda: [opportunity("BOE", "valid", "2026-09-07")]),
            ("BOPA", lambda: []),
            ("UE", lambda: []),
        ])

        self.assertEqual(code, 0)
        public, bundled = self.read_pair()
        self.assertEqual(public, bundled)
        self.assertIn(bdns_previous, public["opportunities"])
        self.assertEqual(public["sourceStatus"]["BDNS"]["status"], "error")
        self.assertEqual(public["generatedAt"], PREVIOUS_REFRESH)


class CollectorFailureCase(unittest.TestCase):
    def test_boe_transport_failure_propagates_to_transaction_layer(self) -> None:
        with patch.object(collect, "get_json", side_effect=URLError("offline")):
            with self.assertRaises(URLError):
                collect.collect_boe(TODAY)

    def test_bopa_transport_failure_propagates_to_transaction_layer(self) -> None:
        with patch.object(collect, "get_text", side_effect=URLError("offline")):
            with self.assertRaises(URLError):
                collect.collect_bopa()


if __name__ == "__main__":
    unittest.main()
