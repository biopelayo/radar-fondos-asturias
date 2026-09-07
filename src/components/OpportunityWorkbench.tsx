import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  ExternalLink,
  FilePenLine,
  Filter,
  Search,
  ShieldCheck,
} from 'lucide-react'
import type { ApplicationRecord, Opportunity, OpportunityKind, RequirementState } from '../types'

interface OpportunityWorkbenchProps {
  opportunities: Opportunity[]
  applications: ApplicationRecord[]
  onPrepare: (opportunityId: string) => void
}

const money = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const date = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function remainingDays(deadline: string, verified = true) {
  if (!verified) return null
  const target = new Date(`${deadline}T23:59:59`)
  return Math.ceil((target.getTime() - Date.now()) / 86_400_000)
}

function RequirementIcon({ state }: { state: RequirementState }) {
  if (state === 'cumple') return <CheckCircle2 aria-hidden="true" />
  if (state === 'bloqueo') return <CircleAlert aria-hidden="true" />
  if (state === 'pendiente') return <CircleDashed aria-hidden="true" />
  return <AlertTriangle aria-hidden="true" />
}

export function OpportunityWorkbench({
  opportunities,
  applications,
  onPrepare,
}: OpportunityWorkbenchProps) {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<'todas' | OpportunityKind>('todas')
  const [selectedId, setSelectedId] = useState(opportunities[0]?.id ?? '')
  const [saved, setSaved] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(window.localStorage.getItem('funding-radar.saved.v1') ?? '[]'))
    } catch {
      return new Set()
    }
  })

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es')
    return opportunities
      .filter((item) => kind === 'todas' || item.kind === kind)
      .filter(
        (item) =>
          !normalized ||
          [item.title, item.issuer, item.source, item.territory, ...item.tags]
            .join(' ')
            .toLocaleLowerCase('es')
            .includes(normalized),
      )
      .sort((a, b) => b.score - a.score)
  }, [kind, opportunities, query])

  useEffect(() => {
    if (!filtered.some((item) => item.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? '')
    }
  }, [filtered, selectedId])

  const selected = opportunities.find((item) => item.id === selectedId) ?? filtered[0]
  const selectedApplication = applications.find((item) => item.opportunityId === selected?.id)
  const isDemo = opportunities.every((item) => item.demo)

  const toggleSaved = () => {
    if (!selected) return
    setSaved((current) => {
      const next = new Set(current)
      if (next.has(selected.id)) next.delete(selected.id)
      else next.add(selected.id)
      window.localStorage.setItem('funding-radar.saved.v1', JSON.stringify([...next]))
      return next
    })
  }

  if (!selected) {
    return (
      <section className="empty-state" aria-live="polite">
        <CircleDashed aria-hidden="true" />
        <h2>No hay oportunidades con estos filtros</h2>
        <p>Prueba otra búsqueda o restablece el tipo de oportunidad.</p>
        <button type="button" onClick={() => { setQuery(''); setKind('todas') }}>
          Limpiar filtros
        </button>
      </section>
    )
  }

  const days = remainingDays(selected.deadline, selected.deadlineVerified)
  const complete = selected.requirements.filter((item) => item.state === 'cumple').length
  const pending = selected.requirements.length - complete
  const preselected = opportunities.filter((item) => item.score >= 75)
  const applicationCapital = opportunities
    .filter((item) => applications.some((application) => application.opportunityId === item.id))
    .reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="workbench">
      <section className="opportunity-ledger" aria-labelledby="opportunities-heading">
        <div className="panel-heading">
          <div>
            <h2 id="opportunities-heading">Oportunidades</h2>
            <span>{filtered.length} señales ordenadas por encaje</span>
          </div>
          <Filter size={17} aria-hidden="true" />
        </div>

        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Buscar oportunidades</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ayuda, organismo, sector…"
          />
        </label>

        <div className="kind-tabs" role="group" aria-label="Tipo de oportunidad">
          {(['todas', 'subvención', 'autoempleo', 'licitación', 'financiación'] as const).map((item) => (
            <button
              type="button"
              key={item}
              className={kind === item ? 'active' : ''}
              aria-pressed={kind === item}
              onClick={() => setKind(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="ledger-labels" aria-hidden="true">
          <span>Oportunidad</span>
          <span>Encaje</span>
          <span>Límite</span>
        </div>

        <div className="opportunity-list">
          {filtered.map((item, index) => {
            const itemDays = remainingDays(item.deadline, item.deadlineVerified)
            return (
              <button
                type="button"
                key={item.id}
                className={`opportunity-row ${selected.id === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(item.id)}
                aria-current={selected.id === item.id ? 'true' : undefined}
              >
                <span className="rank">{String(index + 1).padStart(2, '0')}</span>
                <span className="opportunity-copy">
                  <strong>{item.title}</strong>
                  <span>{item.issuer}</span>
                  <span className="source-line"><b>{item.source}</b> · {item.kind}</span>
                </span>
                <span className={`score score-${Math.floor(item.score / 20)}`}>{item.score}</span>
                <span className={`deadline ${itemDays !== null && itemDays < 14 ? 'urgent' : ''}`}>
                  {itemDays === null ? 'Sin extraer' : date.format(new Date(`${item.deadline}T12:00:00`))}
                  <b>{itemDays === null ? 'Verificar' : itemDays > 0 ? `${itemDays} días` : 'Cerrada'}</b>
                </span>
              </button>
            )
          })}
        </div>

        <div className="ledger-foot">
          <span>{isDemo ? 'Datos de demostración' : 'Fuentes oficiales · verificar bases'}</span>
          <span>{filtered.length} de {opportunities.length}</span>
        </div>
      </section>

      <article className="dossier" key={selected.id} aria-labelledby="dossier-title">
        <header className="dossier-header">
          <div>
            <span className="issuer">{selected.issuer}</span>
            <h1 id="dossier-title">{selected.title}</h1>
          </div>
          <div className="dossier-reference">
            <span>{selected.source}</span>
            <code>{selected.sourceRef}</code>
          </div>
        </header>

        <div className="metrics-band">
          <div>
            <span>Capital potencial</span>
            <strong className="money">{selected.amount > 0 ? money.format(selected.amount) : 'Por verificar'}</strong>
            <small>{selected.aidIntensity}</small>
          </div>
          <div>
            <span>Encaje</span>
            <strong>{selected.score}<small>/100</small></strong>
            <div className="score-track" aria-label={`Encaje ${selected.score} de 100`}>
              <span style={{ width: `${selected.score}%` }} />
            </div>
          </div>
          <div>
            <span>Fecha límite</span>
            <strong className={days !== null && days < 14 ? 'deadline-text' : ''}>{days === null ? 'Por verificar' : date.format(new Date(`${selected.deadline}T12:00:00`))}</strong>
            <small>{days === null ? 'Consultar la disposición' : days > 0 ? `${days} días restantes` : 'Plazo cerrado'}</small>
          </div>
          <div>
            <span>Solicitud</span>
            <strong>{selectedApplication ? 'En preparación' : 'No iniciada'}</strong>
            <small>Siempre bajo tu orden</small>
          </div>
        </div>

        <section className="dossier-section summary-section">
          <div className="section-title-line">
            <h2>Resumen claro</h2>
            <span className="demo-mark">{selected.demo ? 'Datos de demostración' : 'Metadatos oficiales'}</span>
          </div>
          <p>{selected.summary}</p>
        </section>

        <section className="dossier-section fit-section">
          <h2>Por qué encaja</h2>
          <ul>
            {selected.fitReasons.map((reason) => (
              <li key={reason}><Check size={15} aria-hidden="true" />{reason}</li>
            ))}
          </ul>
        </section>

        <section className="dossier-section requirements-section">
          <div className="section-title-line">
            <h2>Requisitos</h2>
            <span>{complete} confirmados · {pending} por resolver</span>
          </div>
          <div className="requirements-table" role="table" aria-label="Requisitos de elegibilidad">
            <div className="requirement-row requirement-head" role="row">
              <span role="columnheader">Requisito</span>
              <span role="columnheader">Estado</span>
              <span role="columnheader">Evidencia</span>
            </div>
            {selected.requirements.map((requirement) => (
              <div className="requirement-row" role="row" key={requirement.id}>
                <span role="cell">{requirement.label}</span>
                <span role="cell" className={`requirement-state ${requirement.state}`}>
                  <RequirementIcon state={requirement.state} />{requirement.state}
                </span>
                <span role="cell">{requirement.evidence ?? 'Pendiente de aportar'}</span>
              </div>
            ))}
          </div>
        </section>
      </article>

      <aside className="action-rail" aria-label="Acciones del expediente">
        <section className="countdown">
          <span>Cierre de oportunidad</span>
          <strong>{days === null ? '--' : days > 0 ? String(days).padStart(2, '0') : '00'}</strong>
          <small>{days === null ? 'plazo por verificar' : 'días restantes'}</small>
          <div className="deadline-rule"><span style={{ width: `${days === null ? 6 : Math.max(6, Math.min(100, days))}%` }} /></div>
        </section>

        <section className="rail-section blockers">
          <div className="rail-heading">
            <h2>Falta por resolver</h2>
            <span>{selected.blockers.length}</span>
          </div>
          {selected.blockers.map((blocker) => (
            <p key={blocker}><AlertTriangle size={16} aria-hidden="true" />{blocker}</p>
          ))}
          {selected.blockers.length === 0 && <p><ShieldCheck size={16} aria-hidden="true" />Sin bloqueos detectados.</p>}
        </section>

        <section className="rail-section evidence-list">
          <div className="rail-heading">
            <h2>Evidencia oficial</h2>
            <span>{selected.evidence.filter((item) => item.verified).length} verificadas</span>
          </div>
          {selected.evidence.map((item) => (
            <a href={item.url} target="_blank" rel="noreferrer" key={item.id}>
              <span className="evidence-source">{item.source}</span>
              <span><b>{item.label}</b><small>{date.format(new Date(`${item.date}T12:00:00`))}</small></span>
              {item.verified ? <ShieldCheck aria-label="Verificado" /> : <CircleDashed aria-label="Pendiente" />}
            </a>
          ))}
        </section>

        <section className="rail-section compact-actions">
          <button type="button" className="secondary-action" onClick={toggleSaved}>
            <Bookmark size={16} fill={saved.has(selected.id) ? 'currentColor' : 'none'} aria-hidden="true" />
            {saved.has(selected.id) ? 'Guardada' : 'Guardar oportunidad'}
          </button>
          <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="secondary-action">
            <ExternalLink size={16} aria-hidden="true" />Abrir fuente oficial
          </a>
        </section>

        <button
          type="button"
          className="prepare-action"
          onClick={() => onPrepare(selected.id)}
          disabled={selected.state === 'bloqueada'}
        >
          <FilePenLine size={24} aria-hidden="true" />
          <span>
            <strong>{selectedApplication ? 'Continuar candidatura' : 'Preparar candidatura'}</strong>
            <small>{selected.state === 'bloqueada' ? 'Resuelve antes los bloqueos críticos' : 'Crear expediente bajo tu orden'}</small>
          </span>
          <ArrowRight size={21} aria-hidden="true" />
        </button>
      </aside>

      <section className="capital-pipeline" aria-labelledby="pipeline-heading">
        <div className="pipeline-title">
          <h2 id="pipeline-heading">Capital en pipeline</h2>
          <span>{isDemo ? 'Datos de demostración' : 'Capital publicado; no equivale a concesión'}</span>
        </div>
        {[
          ['Detectadas', opportunities.length, opportunities.reduce((sum, item) => sum + item.amount, 0)],
          ['Preseleccionadas', preselected.length, preselected.reduce((sum, item) => sum + item.amount, 0)],
          ['En preparación', applications.length, applicationCapital],
          ['Presentadas', 0, 0],
          ['Concedidas', 0, 0],
          ['Cobradas', 0, 0],
        ].map(([label, count, amount], index, all) => (
          <div className="pipeline-stage" key={String(label)}>
            <span>{label}</span>
            <strong>{count}</strong>
            <small>{money.format(Number(amount))}</small>
            {index < all.length - 1 && <ArrowRight className="pipeline-arrow" aria-hidden="true" />}
          </div>
        ))}
      </section>
    </div>
  )
}
