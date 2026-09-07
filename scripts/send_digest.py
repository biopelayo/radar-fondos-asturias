#!/usr/bin/env python3
"""Send a concise Gmail digest when credentials are configured."""

from __future__ import annotations

import html
import json
import os
import smtplib
import sys
from datetime import date, datetime
from email.message import EmailMessage
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public" / "data" / "opportunities.json"


def parse_recipients(value: str) -> list[str]:
    """Normalize the private SMTP envelope without publishing recipients in headers."""
    return list(dict.fromkeys(item.strip() for item in value.split(",") if item.strip()))


def deliver(message: EmailMessage, address: str, password: str, recipients: list[str]) -> None:
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as server:
        server.login(address, password)
        rejected = server.send_message(message, to_addrs=recipients)
    if rejected:
        failed = ", ".join(sorted(rejected))
        raise RuntimeError(f"SMTP rejected recipient(s): {failed}")


def main() -> int:
    address = os.getenv("GMAIL_ADDRESS", "").strip()
    password = os.getenv("GMAIL_APP_PASSWORD", "").strip()
    recipient_value = os.getenv("ALERT_EMAIL", address).strip()
    recipients = parse_recipients(recipient_value)
    if not address or not password or not recipients:
        if os.getenv("RADAR_EMAIL_OPTIONAL") == "1":
            print("Gmail secrets are not configured; optional digest skipped.")
            return 0
        print("Gmail credentials or recipients are missing; digest not sent.", file=sys.stderr)
        return 2
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    source_errors = payload.get("errors", [])
    partial_prefix = "[ACTUALIZACIÓN PARCIAL] " if source_errors else ""
    slot = os.getenv("RADAR_RUN_SLOT", "")
    afternoon = slot.lower() == "afternoon" or slot.startswith("30 15")
    all_opportunities = payload.get("opportunities", [])
    if afternoon:
        today = date.today().isoformat()
        urgent = []
        for item in all_opportunities:
            deadline = item.get("deadline") if item.get("deadlineVerified") else None
            days = (datetime.fromisoformat(deadline).date() - date.today()).days if deadline else 999
            if item.get("publishedAt") == today and (item.get("score", 0) >= 80 or days <= 10):
                urgent.append(item)
        if not urgent:
            print("No new urgent opportunities; afternoon alert skipped.")
            return 0
        opportunities = urgent[:12]
        subject = f"{partial_prefix}Alerta Radar Fondos Asturias · {len(urgent)} señales urgentes nuevas"
    else:
        opportunities = all_opportunities[:12]
        subject = f"{partial_prefix}Radar Fondos Asturias · {len(all_opportunities)} oportunidades monitorizadas"
    rows = "".join(
        f"<tr><td>{item.get('score', 0)}</td><td><a href=\"{html.escape(item.get('sourceUrl', ''))}\">{html.escape(item.get('title', ''))}</a><br><small>{html.escape(item.get('source', ''))} · {html.escape(item.get('territory', ''))}</small></td><td>{item.get('amount', 0):,.0f} €</td><td>{html.escape(item.get('deadline', '') if item.get('deadlineVerified') else 'Por verificar')}</td></tr>"
        for item in opportunities
    )
    message = EmailMessage()
    message["From"] = address
    # Recipients belong only to the SMTP envelope so they cannot see each other.
    message["To"] = address
    message["Subject"] = subject
    status_note = (
        "Una o más fuentes fallaron; se conserva su última copia válida. "
        if source_errors
        else ""
    )
    message.set_content(
        f"{status_note}Radar Fondos Asturias ha actualizado el panel. "
        "Abre la aplicación para revisar las fuentes oficiales."
    )
    message.add_alternative(
        "<h2>Radar Fondos Asturias</h2>"
        f"<p>{html.escape(status_note)}Resumen automático. Verifica siempre las bases oficiales.</p>"
        f"<table cellpadding='8' cellspacing='0' border='1'><tr><th>Encaje</th><th>Oportunidad</th><th>Capital</th><th>Plazo</th></tr>{rows}</table>",
        subtype="html",
    )
    deliver(message, address, password, recipients)
    print(f"Digest sent to {', '.join(recipients)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
