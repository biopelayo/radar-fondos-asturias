from __future__ import annotations

import importlib.util
import sys
import unittest
from email.message import EmailMessage
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "send_digest.py"
SPEC = importlib.util.spec_from_file_location("send_digest", SCRIPT)
assert SPEC and SPEC.loader
send_digest = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = send_digest
SPEC.loader.exec_module(send_digest)


class FakeSMTP:
    rejected: dict[str, tuple[int, bytes]] = {}
    last_message: EmailMessage | None = None
    last_recipients: list[str] = []

    def __init__(self, *_args, **_kwargs):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def login(self, *_args):
        return None

    def send_message(self, message, *, to_addrs):
        type(self).last_message = message
        type(self).last_recipients = list(to_addrs)
        return type(self).rejected


class DigestTests(unittest.TestCase):
    def tearDown(self):
        FakeSMTP.rejected = {}
        FakeSMTP.last_message = None
        FakeSMTP.last_recipients = []

    def test_recipient_parsing_trims_deduplicates_and_ignores_empty(self):
        self.assertEqual(
            send_digest.parse_recipients(" a@example.com, ,b@example.com,a@example.com "),
            ["a@example.com", "b@example.com"],
        )

    @patch.object(send_digest.smtplib, "SMTP_SSL", FakeSMTP)
    def test_delivery_uses_private_envelope(self):
        message = EmailMessage()
        message["From"] = "sender@example.com"
        message["To"] = "sender@example.com"
        message.set_content("test")
        recipients = ["one@example.com", "two@example.com"]

        send_digest.deliver(message, "sender@example.com", "secret", recipients)

        self.assertEqual(FakeSMTP.last_recipients, recipients)
        self.assertNotIn("one@example.com", str(FakeSMTP.last_message))
        self.assertNotIn("two@example.com", str(FakeSMTP.last_message))

    @patch.object(send_digest.smtplib, "SMTP_SSL", FakeSMTP)
    def test_partial_rejection_is_an_error(self):
        FakeSMTP.rejected = {"two@example.com": (550, b"rejected")}
        message = EmailMessage()
        message.set_content("test")

        with self.assertRaisesRegex(RuntimeError, "two@example.com"):
            send_digest.deliver(
                message,
                "sender@example.com",
                "secret",
                ["one@example.com", "two@example.com"],
            )


if __name__ == "__main__":
    unittest.main()
