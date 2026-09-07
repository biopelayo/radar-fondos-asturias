#!/usr/bin/env python3
"""Collect and rank public funding signals from official Spanish sources.

Only public metadata is written. Personal eligibility data stays in the browser.
Unknown deadlines and conditions are labelled for manual verification.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import time
import unicodedata
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin
from urllib.request import Request, urlopen
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "data" / "opportunities.json"
BUNDLED_OUTPUT = ROOT / "src" / "data" / "opportunities.generated.json"
USER_AGENT = "RadarFondosAsturias/0.1 (+https://github.com/biopelayo/radar-fondos-asturias; public-interest grant monitor)"
SOURCE_KINDS = {
    "BDNS": "official-api",
    "BOE": "official-open-data",
    "BOPA": "official-summary",
    "UE": "official-api",
}

FUNDING_TERMS = (
    "subvencion", "ayuda", "beca", "financiacion", "prestamo", "incentivo",
    "convocatoria", "concurrencia", "premio", "bono", "fondo", "licitacion",
    "contrato", "emprendimiento", "autoempleo",
)

DOMAIN_TERMS = (
    "asturias", "asturiano", "autonomo", "autoempleo", "emprend", "empresa",
    "pyme", "comercio", "turismo", "alojamiento", "hosteleria", "rural",
    "vivienda", "alquiler", "rehabilitacion", "eficiencia energetica", "energia",
    "digital", "inteligencia artificial", "datos", "software", "informatica",
    "bioinformatica", "biologia", "biomed", "salud", "investigacion", "i+d",
    "innovacion", "ciencia", "doctor", "docencia", "formacion", "universidad",
    "exportacion", "internacionalizacion", "reto demografico", "bioinformatics",
    "artificial intelligence", "biomedicine", "biology", "health", "research",
    "education", "training", "data science", "tourism", "sme", "digitalisation",
)

NON_ACTIONABLE_PHRASES = (
    "se conceden y se deniegan", "se concede y se deniega", "se procede a la",
    "concesion de subvenciones", "concesion de las subvenciones", "concesion de ayudas",
    "concesion de las ayudas", "resolucion definitiva", "resolucion provisional",
    "lista de beneficiarios", "rectifican los errores", "correccion de errores",
    "concesion y denegacion", "formalizacion de contratos", "adjudicacion del contrato",
)


def normalized(value: str) -> str:
    folded = unicodedata.normalize("NFKD", value.lower())
    return "".join(char for char in folded if not unicodedata.combining(char))


def contains_any(value: str, terms: Iterable[str]) -> bool:
    text = normalized(value)
    return any(term in text for term in terms)


def is_actionable_title(value: str) -> bool:
    text = normalized(value)
    return not any(phrase in text for phrase in NON_ACTIONABLE_PHRASES)


def get_json(url: str, *, attempts: int = 3) -> Any:
    request = Request(url, headers={"Accept": "application/json", "User-Agent": USER_AGENT})
    for attempt in range(attempts):
        try:
            with urlopen(request, timeout=35) as response:
                return json.load(response)
        except (HTTPError, URLError, TimeoutError):
            if attempt + 1 == attempts:
                raise
            time.sleep(1.5 * (attempt + 1))


def get_text(url: str, *, attempts: int = 3) -> str:
    request = Request(url, headers={"Accept": "text/html", "User-Agent": USER_AGENT})
    for attempt in range(attempts):
        try:
            with urlopen(request, timeout=35) as response:
                return response.read().decode(response.headers.get_content_charset() or "utf-8", "replace")
        except (HTTPError, URLError, TimeoutError):
            if attempt + 1 == attempts:
                raise
            time.sleep(1.5 * (attempt + 1))


def post_multipart_json(url: str, fields: dict[str, Any]) -> Any:
    boundary = f"----FundingRadar{uuid4().hex}"
    chunks: list[bytes] = []
    for name, value in fields.items():
        chunks.extend([
            f"--{boundary}\r\n".encode(),
            f'Content-Disposition: form-data; name="{name}"; filename="blob"\r\n'.encode(),
            b"Content-Type: application/json\r\n\r\n",
            json.dumps(value, separators=(",", ":")).encode("utf-8"),
            b"\r\n",
        ])
    chunks.append(f"--{boundary}--\r\n".encode())
    request = Request(url, data=b"".join(chunks), headers={
        "Accept": "application/json",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "User-Agent": USER_AGENT,
    }, method="POST")
    with urlopen(request, timeout=50) as response:
        return json.load(response)


def unwrap_metadata(value: Any, default: Any = "") -> Any:
    if isinstance(value, list):
        return value[0] if value else default
    return default if value is None else value


def parse_iso_date(value: Any) -> str | None:
    value = unwrap_metadata(value)
    if isinstance(value, (int, float)):
        seconds = value / 1000 if value > 10_000_000_000 else value
        return datetime.fromtimestamp(seconds, tz=timezone.utc).date().isoformat()
    if not isinstance(value, str) or not value.strip():
        return None
    text = value.strip()
    iso_match = re.search(r"(20\d{2})-(\d{2})-(\d{2})", text)
    if iso_match:
        return f"{iso_match.group(1)}-{iso_match.group(2)}-{iso_match.group(3)}"
    local_match = re.search(r"(\d{2})/(\d{2})/(20\d{2})", text)
    if local_match:
        return f"{local_match.group(3)}-{local_match.group(2)}-{local_match.group(1)}"
    return None


def clean_html(fragment: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def classify_kind(title: str, instrument: str = "") -> str:
    text = normalized(f"{title} {instrument}")
    if any(term in text for term in ("contrato", "licitacion")):
        return "licitación"
    if any(term in text for term in ("autoempleo", "autonomo", "emprendimiento")):
        return "autoempleo"
    if any(term in text for term in ("subvencion", "ayuda", "grant")):
        return "subvención"
    if any(term in text for term in ("prestamo", "financiacion", "garantia", "aval")):
        return "financiación"
    if "premio" in text:
        return "premio"
    return "subvención"


def domain_tags(text: str) -> list[str]:
    tag_groups = {
        "Asturias": ("asturias", "asturiano"),
        "autónomos": ("autonomo", "autoempleo", "emprend"),
        "turismo": ("turismo", "tourism", "alojamiento", "hosteleria"),
        "vivienda": ("vivienda", "alquiler", "rehabilitacion"),
        "comercio": ("comercio", "exportacion", "internacionalizacion"),
        "IA y datos": ("inteligencia artificial", "artificial intelligence", "data science", "datos", "software", "informatica"),
        "ciencia y salud": ("bio", "health", "salud", "research", "investigacion", "science", "ciencia", "i+d"),
        "docencia": ("docencia", "education", "training", "formacion", "universidad"),
        "energía": ("energia", "eficiencia energetica"),
        "rural": ("rural", "reto demografico"),
    }
    folded = normalized(text)
    return [tag for tag, needles in tag_groups.items() if any(needle in folded for needle in needles)] or ["por clasificar"]


def score_signal(title: str, territory: str, amount: float, verified_deadline: bool) -> int:
    text = normalized(f"{title} {territory}")
    score = 42 + min(28, sum(5 for term in DOMAIN_TERMS if term in text))
    if "asturias" in text or "principado" in text:
        score += 15
    if any(term in text for term in ("autonomo", "autoempleo", "turismo", "bioinformatica", "inteligencia artificial")):
        score += 8
    if amount and amount <= 250_000:
        score += 4
    if verified_deadline:
        score += 3
    return min(98, score)


def generic_requirements(source: str, deadline_verified: bool) -> list[dict[str, str]]:
    return [
        {"id": f"{source}-beneficiary", "label": "Confirmar beneficiario y actividad elegible", "state": "pendiente", "evidence": "Revisar bases oficiales"},
        {"id": f"{source}-tax", "label": "Estar al corriente con Hacienda y Seguridad Social", "state": "desconocido", "evidence": "Verificar antes de solicitar"},
        {"id": f"{source}-deadline", "label": "Confirmar plazo y forma de presentación", "state": "cumple" if deadline_verified else "pendiente", "evidence": "Dato oficial extraído" if deadline_verified else "Abrir disposición"},
    ]


def make_opportunity(*, source: str, reference: str, title: str, issuer: str, url: str,
                     territory: str, published: str, deadline: str, deadline_verified: bool,
                     amount: float = 0, instrument: str = "", summary: str = "") -> dict[str, Any]:
    tags = domain_tags(f"{title} {issuer} {territory}")
    return {
        "id": f"{source.lower()}-{reference.lower()}",
        "title": title,
        "issuer": issuer or "Organismo público",
        "source": source,
        "sourceRef": reference,
        "sourceUrl": url,
        "kind": classify_kind(title, instrument),
        "territory": territory,
        "publishedAt": published,
        "deadline": deadline,
        "deadlineVerified": deadline_verified,
        "amount": round(float(amount or 0)),
        "aidIntensity": instrument or "Cuantía y condiciones por verificar",
        "score": score_signal(title, territory, float(amount or 0), deadline_verified),
        "state": "nueva",
        "summary": summary or "Señal detectada en una fuente oficial. Deben revisarse las bases antes de decidir o preparar una solicitud.",
        "fitReasons": [f"Coincide con: {', '.join(tags)}.", f"Publicación oficial localizada en {source}."],
        "blockers": ["Confirmar beneficiarios, gastos elegibles e incompatibilidades en las bases."],
        "requirements": generic_requirements(source, deadline_verified),
        "evidence": [{"id": f"{source}-{reference}-official", "source": source, "label": "Publicación oficial", "date": published, "verified": True, "url": url}],
        "tags": tags,
        "demo": False,
    }


def collect_bdns(start: date, end: date) -> list[dict[str, Any]]:
    query = urlencode({"fechaDesde": start.strftime("%d/%m/%Y"), "fechaHasta": end.strftime("%d/%m/%Y"), "pagina": 0, "tamPagina": 200})
    rows = get_json(f"https://www.infosubvenciones.es/bdnstrans/api/convocatorias/busqueda?{query}").get("content", [])
    selected = []
    for row in rows:
        haystack = " ".join(str(row.get(key) or "") for key in ("descripcion", "nivel1", "nivel2", "nivel3"))
        if not (contains_any(haystack, DOMAIN_TERMS) or "asturias" in normalized(haystack)):
            continue
        code = str(row.get("numeroConvocatoria") or row.get("id"))
        try:
            detail = get_json(f"https://www.infosubvenciones.es/bdnstrans/api/convocatorias?{urlencode({'numConv': code})}")
        except (HTTPError, URLError, TimeoutError, ValueError):
            detail = {}
        if "instrumental" in normalized(str(detail.get("tipoConvocatoria") or "")) or normalized(str(row.get("descripcion") or "")).startswith("convenio "):
            continue
        parsed_text_deadline = parse_iso_date(detail.get("textFin"))
        deadline = detail.get("fechaFinSolicitud") or parsed_text_deadline or row.get("fechaRecepcion")
        if (detail.get("fechaFinSolicitud") or parsed_text_deadline) and deadline < end.isoformat():
            continue
        published = row.get("fechaRecepcion") or end.isoformat()
        instruments = ", ".join(item.get("descripcion", "") for item in detail.get("instrumentos", []) if item.get("descripcion"))
        beneficiaries = ", ".join(item.get("descripcion", "") for item in detail.get("tiposBeneficiarios", []) if item.get("descripcion"))
        summary = " · ".join(piece for piece in (beneficiaries, detail.get("descripcionBasesReguladoras")) if piece)
        selected.append(make_opportunity(
            source="BDNS", reference=code, title=row.get("descripcion") or "Convocatoria sin título",
            issuer=row.get("nivel3") or row.get("nivel2") or "Administración pública",
            url="https://www.infosubvenciones.es/bdnstrans/GE/es/convocatorias",
            territory=row.get("nivel2") or row.get("nivel1") or "España", published=published,
            deadline=deadline, deadline_verified=bool(detail.get("fechaFinSolicitud") or parsed_text_deadline),
            amount=detail.get("presupuestoTotal") or 0, instrument=instruments, summary=summary,
        ))
        time.sleep(0.08)
    return selected


def walk_boe(node: Any, context: tuple[str, ...] = ()) -> Iterable[tuple[dict[str, Any], tuple[str, ...]]]:
    if isinstance(node, dict):
        next_context = context
        if isinstance(node.get("nombre"), str):
            next_context = (*context, node["nombre"])
        if "identificador" in node and "titulo" in node:
            yield node, next_context
        for value in node.values():
            yield from walk_boe(value, next_context)
    elif isinstance(node, list):
        for value in node:
            yield from walk_boe(value, context)


def collect_boe(day: date) -> list[dict[str, Any]]:
    payload = get_json(f"https://www.boe.es/datosabiertos/api/boe/sumario/{day:%Y%m%d}")
    entries = list(walk_boe(payload))
    if not entries:
        raise ValueError("BOE response contained no recognizable gazette entries")
    results = []
    for item, context in entries:
        title = item.get("titulo", "")
        if not is_actionable_title(title) or not (contains_any(title, FUNDING_TERMS) and contains_any(f"{title} {' '.join(context)}", DOMAIN_TERMS)):
            continue
        reference = item.get("identificador", "BOE")
        results.append(make_opportunity(
            source="BOE", reference=reference, title=title, issuer=context[-1] if context else "Administración General del Estado",
            url=f"https://www.boe.es/diario_boe/txt.php?id={reference}", territory="España",
            published=day.isoformat(), deadline=day.isoformat(), deadline_verified=False,
            summary="Disposición detectada en el sumario diario del BOE. Plazo, beneficiarios y cuantía deben extraerse del texto oficial.",
        ))
    return results


def collect_bopa() -> list[dict[str, Any]]:
    page_url = "https://miprincipado.asturias.es/bopa/ultimos-boletines?p_r_p_summaryLastBopa=true"
    page = get_text(page_url)
    encoded_date = re.search(r"p_r_p_dispositionDate=(\d{2})%2F(\d{2})%2F(\d{4})", page)
    published = date.today().isoformat()
    if encoded_date:
        published = f"{encoded_date.group(3)}-{encoded_date.group(2)}-{encoded_date.group(1)}"
    entries = list(re.finditer(r"<dl>\s*<dt>(.*?)</dt>\s*<dd>(.*?)</dd>\s*</dl>", page, re.I | re.S))
    if not entries:
        raise ValueError("BOPA response contained no recognizable gazette entries")
    results = []
    for match in entries:
        title = clean_html(match.group(1))
        if not is_actionable_title(title) or not (contains_any(title, FUNDING_TERMS) and contains_any(title, DOMAIN_TERMS)):
            continue
        code_match = re.search(r"C[oó]d\.\s*([\d-]+)", title, re.I)
        reference = code_match.group(1) if code_match else f"BOPA-{abs(hash(title))}"
        title = re.sub(r"\s*\[C[oó]d\.\s*[\d-]+\]\s*$", "", title, flags=re.I)
        link_match = re.search(r'href="([^"]+)"', match.group(2), re.I)
        detail_url = urljoin(page_url, html.unescape(link_match.group(1))) if link_match else page_url
        results.append(make_opportunity(
            source="BOPA", reference=reference, title=title, issuer="Principado de Asturias",
            url=detail_url, territory="Asturias", published=published, deadline=published, deadline_verified=False,
            summary="Disposición detectada en el último sumario del BOPA. Plazo, beneficiarios y cuantía deben verificarse en el texto oficial.",
        ))
    return results


def collect_eu() -> list[dict[str, Any]]:
    endpoint = "https://api.tech.ec.europa.eu/search-api/prod/rest/search"
    query = {
        "bool": {"must": [
            {"terms": {"type": ["1", "8"]}},
            {"terms": {"status": ["31094501", "31094502"]}},
            {"term": {"programmePeriod": "2021 - 2027"}},
        ]}
    }
    display_fields = [
        "type", "identifier", "reference", "title", "status", "startDate",
        "deadlineDate", "frameworkProgramme", "description", "callTitle",
    ]
    results: dict[str, dict[str, Any]] = {}
    terms = (
        "bioinformatics", "artificial intelligence", "biomedicine", "data science",
        "tourism", "SME digital", "education research",
    )
    for term in terms:
        params = urlencode({"apiKey": "SEDIA", "text": term, "pageSize": 40, "pageNumber": 1})
        payload = post_multipart_json(f"{endpoint}?{params}", {
            "query": query,
            "languages": ["en"],
            "sort": {"field": "startDate", "order": "DESC"},
            "displayFields": display_fields,
        })
        if not isinstance(payload, dict) or not isinstance(payload.get("results"), list):
            raise ValueError("EU response did not contain a results list")
        for row in payload["results"]:
            metadata = row.get("metadata", {})
            reference = str(unwrap_metadata(metadata.get("identifier")) or unwrap_metadata(metadata.get("reference")) or row.get("id") or "")
            title = str(unwrap_metadata(metadata.get("title")) or unwrap_metadata(metadata.get("callTitle")) or "Untitled EU opportunity")
            if not reference:
                continue
            deadline = parse_iso_date(metadata.get("deadlineDate"))
            published = parse_iso_date(metadata.get("startDate")) or date.today().isoformat()
            if deadline and deadline < date.today().isoformat():
                continue
            results[reference] = make_opportunity(
                source="UE", reference=reference, title=title, issuer="Comisión Europea",
                url=f"https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/{reference}",
                territory="Unión Europea", published=published, deadline=deadline or published,
                deadline_verified=bool(deadline),
                instrument="Subvención directa de la UE; consorcio y cofinanciación por verificar",
                summary="Convocatoria abierta o próxima localizada mediante la API oficial Funding & Tenders. Compruebe elegibilidad, consorcio y documentos del topic.",
            )
    return list(results.values())


def load_existing(path: Path = OUTPUT) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(payload, dict) or not isinstance(payload.get("opportunities"), list):
            raise ValueError("existing dataset is not a payload with opportunities")
        return payload
    except (OSError, ValueError, AttributeError):
        return {}


def validate_source_result(source: str, value: Any) -> list[dict[str, Any]]:
    """Validate one collector result before it can replace any prior source data."""
    if not isinstance(value, list):
        raise ValueError("collector result must be a list")
    required_strings = (
        "id", "title", "issuer", "source", "sourceRef", "sourceUrl", "kind",
        "territory", "publishedAt", "deadline", "state", "summary",
    )
    required_lists = ("fitReasons", "blockers", "requirements", "evidence", "tags")
    validated: list[dict[str, Any]] = []
    seen: set[str] = set()
    for index, item in enumerate(value):
        if not isinstance(item, dict):
            raise ValueError(f"item {index} is not an object")
        missing = [
            field for field in required_strings
            if not isinstance(item.get(field), str) or not item[field].strip()
        ]
        if missing:
            raise ValueError(f"item {index} has invalid fields: {', '.join(missing)}")
        invalid_lists = [field for field in required_lists if not isinstance(item.get(field), list)]
        if invalid_lists:
            raise ValueError(f"item {index} has invalid lists: {', '.join(invalid_lists)}")
        if item["source"] != source:
            raise ValueError(f"item {index} belongs to {item['source']!r}, expected {source!r}")
        if not item["sourceUrl"].startswith("https://"):
            raise ValueError(f"item {index} sourceUrl is not HTTPS")
        if isinstance(item.get("score"), bool) or not isinstance(item.get("score"), (int, float)):
            raise ValueError(f"item {index} has an invalid score")
        if not 0 <= item["score"] <= 100:
            raise ValueError(f"item {index} score is outside 0..100")
        if isinstance(item.get("amount"), bool) or not isinstance(item.get("amount"), (int, float)):
            raise ValueError(f"item {index} has an invalid amount")
        if not isinstance(item.get("demo"), bool):
            raise ValueError(f"item {index} has an invalid demo flag")
        if "deadlineVerified" in item and not isinstance(item["deadlineVerified"], bool):
            raise ValueError(f"item {index} has an invalid deadlineVerified flag")
        if item["id"] in seen:
            raise ValueError(f"duplicate id in {source}: {item['id']}")
        seen.add(item["id"])
        try:
            date.fromisoformat(item["publishedAt"])
            date.fromisoformat(item["deadline"])
        except ValueError as exc:
            raise ValueError(f"item {index} contains an invalid date") from exc
        try:
            json.dumps(item, ensure_ascii=False)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"item {index} is not JSON serializable") from exc
        validated.append(item)
    return validated


def merge_successful_source(
    source: str,
    previous: list[dict[str, Any]],
    fresh: list[dict[str, Any]],
    *,
    today: date,
    days: int,
    keep_days: int,
) -> list[dict[str, Any]]:
    """Replace only the time window covered by a successful source query."""
    cutoff = (today - timedelta(days=keep_days)).isoformat()
    retained = [
        item for item in previous
        if not item.get("demo")
        and item.get("publishedAt", "0000-00-00") >= cutoff
        and is_actionable_title(item.get("title", ""))
    ]
    if source == "BDNS":
        start = (today - timedelta(days=days)).isoformat()
        retained = [item for item in retained if item.get("publishedAt", "") < start]
    elif source == "BOE":
        retained = [item for item in retained if item.get("publishedAt") != today.isoformat()]
    elif source == "BOPA":
        refreshed_dates = {item["publishedAt"] for item in fresh}
        if refreshed_dates:
            retained = [item for item in retained if item.get("publishedAt") not in refreshed_dates]
    elif source == "UE":
        # The EU query returns the complete currently open result set.
        retained = []
    return [*retained, *fresh]


def validate_payload(payload: dict[str, Any]) -> None:
    """Reject incomplete or internally inconsistent snapshots before disk writes."""
    opportunities = payload.get("opportunities")
    if not isinstance(opportunities, list) or not opportunities:
        raise ValueError("refusing to write an empty opportunity dataset")
    source_status = payload.get("sourceStatus")
    if not isinstance(source_status, dict) or set(source_status) != set(SOURCE_KINDS):
        raise ValueError("sourceStatus must describe every configured source")
    seen: set[str] = set()
    grouped: dict[str, list[dict[str, Any]]] = {source: [] for source in SOURCE_KINDS}
    for item in opportunities:
        source = item.get("source") if isinstance(item, dict) else None
        if source not in grouped:
            raise ValueError(f"unknown opportunity source: {source!r}")
        validate_source_result(source, [item])
        if item["id"] in seen:
            raise ValueError(f"duplicate opportunity id: {item['id']}")
        seen.add(item["id"])
        grouped[source].append(item)
    for source, status in source_status.items():
        if not isinstance(status, dict) or status.get("status") not in {"ok", "error"}:
            raise ValueError(f"invalid status for {source}")
        if status.get("count") != len(grouped[source]):
            raise ValueError(f"incorrect count for {source}")


def write_payload_pair(payload: dict[str, Any], output: Path, bundled_output: Path) -> None:
    """Write the canonical public payload and an identical bundled fallback."""
    validate_payload(payload)
    serialized = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    output.parent.mkdir(parents=True, exist_ok=True)
    bundled_output.parent.mkdir(parents=True, exist_ok=True)
    output_tmp = output.with_name(f".{output.name}.{uuid4().hex}.tmp")
    bundled_tmp = bundled_output.with_name(f".{bundled_output.name}.{uuid4().hex}.tmp")
    original_output = output.read_bytes() if output.exists() else None
    original_bundled = bundled_output.read_bytes() if bundled_output.exists() else None
    replaced: list[tuple[Path, bytes | None]] = []
    try:
        output_tmp.write_text(serialized, encoding="utf-8")
        bundled_tmp.write_text(serialized, encoding="utf-8")
        public_candidate = json.loads(output_tmp.read_text(encoding="utf-8"))
        bundled_candidate = json.loads(bundled_tmp.read_text(encoding="utf-8"))
        if public_candidate != bundled_candidate:
            raise ValueError("public and bundled payloads differ")
        os.replace(output_tmp, output)
        replaced.append((output, original_output))
        os.replace(bundled_tmp, bundled_output)
        replaced.append((bundled_output, original_bundled))
    except Exception:
        for target, original in reversed(replaced):
            if original is None:
                target.unlink(missing_ok=True)
            else:
                rollback = target.with_name(f".{target.name}.{uuid4().hex}.rollback")
                try:
                    rollback.write_bytes(original)
                    os.replace(rollback, target)
                finally:
                    rollback.unlink(missing_ok=True)
        raise
    finally:
        output_tmp.unlink(missing_ok=True)
        bundled_tmp.unlink(missing_ok=True)


def update_dataset(
    *,
    today: date,
    days: int,
    keep_days: int,
    collectors: Iterable[tuple[str, Any]],
    output: Path = OUTPUT,
    bundled_output: Path = BUNDLED_OUTPUT,
    now: datetime | None = None,
) -> int:
    """Run collectors and transactionally merge every independently healthy source."""
    checked_at = (now or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat()
    existing_payload = load_existing(output)
    existing = existing_payload.get("opportunities", [])
    previous_status = existing_payload.get("sourceStatus", {})
    previous_generated_at = existing_payload.get("generatedAt")
    previous_by_source = {
        source: [item for item in existing if isinstance(item, dict) and item.get("source") == source]
        for source in SOURCE_KINDS
    }
    results: dict[str, list[dict[str, Any]]] = {}
    failures: dict[str, str] = {}
    for name, collector in collectors:
        if name not in SOURCE_KINDS:
            failures[name] = "ValueError: unknown source"
            continue
        try:
            results[name] = validate_source_result(name, collector())
        except Exception as exc:
            failures[name] = f"{type(exc).__name__}: {exc}"

    missing = set(SOURCE_KINDS) - set(results) - set(failures)
    for source in missing:
        failures[source] = "RuntimeError: collector was not configured"

    if not results:
        print("ERROR All sources failed; existing datasets were left untouched.")
        for source, error in failures.items():
            print(f"WARNING {source}: {error}")
        return 1

    merged_by_source: dict[str, list[dict[str, Any]]] = {}
    source_status: dict[str, dict[str, Any]] = {}
    for source in SOURCE_KINDS:
        previous_items = previous_by_source[source]
        if source in results:
            merged_items = merge_successful_source(
                source,
                previous_items,
                results[source],
                today=today,
                days=days,
                keep_days=keep_days,
            )
            merged_by_source[source] = merged_items
            source_status[source] = {
                "status": "ok",
                "count": len(merged_items),
                "collectedCount": len(results[source]),
                "checkedAt": checked_at,
                "lastSuccessAt": checked_at,
            }
        else:
            # A failed source is carried forward byte-for-byte at the item level.
            merged_by_source[source] = previous_items
            prior = previous_status.get(source, {}) if isinstance(previous_status, dict) else {}
            last_success = prior.get("lastSuccessAt") if isinstance(prior, dict) else None
            if not last_success and previous_items:
                last_success = previous_generated_at
            source_status[source] = {
                "status": "error",
                "count": len(previous_items),
                "collectedCount": 0,
                "checkedAt": checked_at,
                "lastSuccessAt": last_success,
                "error": failures[source],
            }

    opportunities = sorted(
        (item for items in merged_by_source.values() for item in items),
        key=lambda item: (item.get("score", 0), item.get("publishedAt", "")),
        reverse=True,
    )
    fully_successful = not failures and set(results) == set(SOURCE_KINDS)
    payload = {
        # generatedAt is the last complete refresh, not merely the latest attempt.
        "generatedAt": checked_at if fully_successful else previous_generated_at,
        "checkedAt": checked_at,
        "notice": "Metadatos públicos. Verifique siempre las bases y la sede electrónica antes de actuar.",
        "sources": SOURCE_KINDS,
        "sourceStatus": source_status,
        "errors": [f"{source}: {error}" for source, error in failures.items()],
        "opportunities": opportunities,
    }
    try:
        write_payload_pair(payload, output, bundled_output)
    except (OSError, TypeError, ValueError) as exc:
        print(f"ERROR Dataset validation/write failed: {exc}")
        return 1
    print(f"Wrote {len(opportunities)} opportunities to {output}")
    for error in payload["errors"]:
        print(f"WARNING {error}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=10, help="BDNS lookback window")
    parser.add_argument("--keep-days", type=int, default=120, help="Retain recent records")
    args = parser.parse_args()
    today = date.today()
    collectors = (
        ("BDNS", lambda: collect_bdns(today - timedelta(days=args.days), today)),
        ("BOE", lambda: collect_boe(today)),
        ("BOPA", collect_bopa),
        ("UE", collect_eu),
    )
    return update_dataset(
        today=today,
        days=args.days,
        keep_days=args.keep_days,
        collectors=collectors,
    )


if __name__ == "__main__":
    raise SystemExit(main())
