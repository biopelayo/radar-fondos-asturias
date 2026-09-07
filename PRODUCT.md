# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated by the user: React, TypeScript and Vite for a static GitHub Pages deployment, with Python-based scheduled collection in GitHub Actions. Private working data is browser-local and never committed.

## Users

The product has one primary user: an independent owner-operator in Asturias who wants to discover and act on funding opportunities without needing grant-specialist knowledge. The source code and public opportunity catalogue are open, but the workspace is personal rather than multi-user.

## Product Purpose

Turn fragmented official notices into ranked, understandable and actionable funding opportunities. Success is measured by eligible opportunities found, applications completed, time saved, money requested and money awarded—not by the number of notices collected.

## Positioning

The product treats each item as a living funding opportunity that joins calls, regulatory bases, corrections, extensions and application steps. It explains fit against a private local profile, shows evidence from official sources and converts requirements into an on-demand application workflow.

## Operating Context

- Desktop-first personal dashboard, normally reviewed from a computer.
- Public official data is refreshed before 09:00 Europe/Madrid, with a second daily reconciliation.
- A daily digest and urgent alerts are delivered through Gmail.
- Geographic coverage includes Asturias, Spain, direct European Union programmes and international calls that accept Spanish applicants.
- Opportunity families include grants, self-employment aid, favourable finance, guarantees, economic prizes, funded accelerators, public contracts and tenders. Each family remains visibly distinct.
- Application drafting happens only after an explicit user command. Final review, electronic identification, signature and submission remain manual.

## Capabilities and Constraints

- Ingest official sources including BDNS/SNPSAP, BOE, BOPA/miPrincipado and EU Funding & Tenders, with complementary official sector sources.
- Link versions and related documents without hiding corrections or extensions.
- Extract purpose, eligible applicants, amount, aid intensity, eligible costs, dates, evidence, documentation and submission route.
- Apply hard eligibility rules before an explainable relevance score.
- Provide discovery, saved opportunities, comparison, requirements checklists, deadlines, application preparation and outcome tracking.
- Store the private profile, documents, notes and applications only in the user's browser or an explicit local encrypted export.
- Never place certificates, identifiers, credentials, financial details or application documents in GitHub Pages or the public repository.
- Run as a free public project without a mandatory paid backend. Any optional AI enhancement must degrade gracefully to deterministic analysis.
- Scheduled GitHub Actions can be delayed or disabled; the UI must expose freshness, health and manual refresh paths.
- The product name is deliberately undecided.

## Brand Commitments

Desktop intelligence workspace: authoritative, ambitious, scientific and financially focused. The interface should feel exceptional while remaining fast to scan and calm under high information density.

## Evidence on Hand

- Official BOE open-data API and RSS channels.
- Official BDNS/SNPSAP OpenAPI description.
- Official BOPA and miPrincipado pages.
- European Commission Funding & Tenders sources.
- Public professional background: https://biopelayo.github.io/
- No testimonials, award-rate claims or product performance benchmarks exist yet; future work must not fabricate them.

## Product Principles

1. Official evidence before interpretation.
2. Eligibility before excitement.
3. Money and next action before document volume.
4. Private by local-first design.
5. Human-controlled applications, with no autonomous submission.

## Accessibility & Inclusion

The desktop-first surface must remain keyboard navigable, screen-reader legible, colour-safe and usable at 200% zoom. Dense information must never rely on colour alone.
