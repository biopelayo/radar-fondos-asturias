#!/usr/bin/env python3
"""Collect and rank public funding signals from official Spanish sources.

Only public metadata is written. Personal eligibility data stays in the browser.
Unknown deadlines and conditions are labelled for manual verification.
"""

from __future__ import annotations

import argparse
import html
import json
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
    try:
        payload = get_json(f"https://www.boe.es/datosabiertos/api/boe/sumario/{day:%Y%m%d}")
    except (HTTPError, URLError, TimeoutError, ValueError):
        return []
    results = []
    for item, context in walk_boe(payload):
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
    try:
        page = get_text(page_url)
    except (HTTPError, URLError, TimeoutError):
        return []
    encoded_date = re.search(r"p_r_p_dispositionDate=(\d{2})%2F(\d{2})%2F(\d{4})", page)
    published = date.today().isoformat()
    if encoded_date:
        published = f"{encoded_date.group(3)}-{encoded_date.group(2)}-{encoded_date.group(1)}"
    results = []
    for match in re.finditer(r"<dl>\s*<dt>(.*?)</dt>\s*<dd>(.*?)</dd>\s*</dl>", page, re.I | re.S):
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
        for row in payload.get("results", []):
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


def load_existing() -> list[dict[str, Any]]:
    try:
        return json.loads(OUTPUT.read_text(encoding="utf-8")).get("opportunities", [])
    except (OSError, ValueError, AttributeError):
        return []


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=10, help="BDNS lookback window")
    parser.add_argument("--keep-days", type=int, default=120, help="Retain recent records")
    args = parser.parse_args()
    today = date.today()
    collected: list[dict[str, Any]] = []
    errors: list[str] = []
    for name, collector in (
        ("BDNS", lambda: collect_bdns(today - timedelta(days=args.days), today)),
        ("BOE", lambda: collect_boe(today)),
        ("BOPA", collect_bopa),
        ("UE", collect_eu),
    ):
        try:
            collected.extend(collector())
        except Exception as exc:
            errors.append(f"{name}: {type(exc).__name__}: {exc}")
    cutoff = today - timedelta(days=args.keep_days)
    existing = load_existing()
    merged = {
        item["id"]: item
        for item in existing
        if not item.get("demo")
        and item.get("publishedAt", "0000-00-00") >= cutoff.isoformat()
        and is_actionable_title(item.get("title", ""))
        and not (item.get("source") == "BDNS" and item.get("publishedAt", "") >= (today - timedelta(days=args.days)).isoformat())
    }
    merged.update({item["id"]: item for item in collected})
    opportunities = sorted(merged.values(), key=lambda item: (item.get("score", 0), item.get("publishedAt", "")), reverse=True)
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "notice": "Metadatos públicos. Verifique siempre las bases y la sede electrónica antes de actuar.",
        "sources": {"BDNS": "official-api", "BOE": "official-open-data", "BOPA": "official-summary", "UE": "official-api"},
        "errors": errors,
        "opportunities": opportunities,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    OUTPUT.write_text(serialized, encoding="utf-8")
    BUNDLED_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    BUNDLED_OUTPUT.write_text(serialized, encoding="utf-8")
    print(f"Wrote {len(opportunities)} opportunities to {OUTPUT.relative_to(ROOT)}")
    for error in errors:
        print(f"WARNING {error}")
    return 0 if opportunities or not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
