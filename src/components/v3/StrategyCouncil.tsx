import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Download,
  ExternalLink,
  FlaskConical,
  Gauge,
  Landmark,
  LoaderCircle,
  RefreshCw,
  ShieldQuestion,
  Target,
  WalletCards,
} from 'lucide-react'
import type { V2Catalog } from '../../domain/v2'
import type { ApplicationRecord, PrivateProfile } from '../../types'
import '../../styles/v3/strategy-council.css'
import {
  buildStrategyCandidates,
  parsePrivateAmount,
  profileCompletion,
  strategyGoals,
  type StrategyCandidate,
  type StrategyGoal,
} from './strategy'

interface StrategyCouncilProps {
  catalog: V2Catalog | null
  status: 'loading' | 'ready' | 'error'
  errorMessage?: string
  profile: PrivateProfile
  applications: ApplicationRecord[]
  onRetry: () => void
  onOpenEvidence: (opportunityId: string) => void
  onPrepare: (candidate: StrategyCandidate) => void
}

const goalIcons: Record<StrategyGoal, typeof Target> = {
  cash: WalletCards,
  business: Building2,
  research: FlaskConical,
  balanced: Gauge,
}

function formatMoney(value?: number) {
  if (value === undefined) return 'Por verificar'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

function formatDeadline(candidate: StrategyCandidate) {
  if (!candidate.deadlineVerified || !candidate.deadline) return 'Por verificar'
  return new Date(candidate.deadline).toLocaleDateString('es-ES')
}

function downloadPlan(candidate: StrategyCandidate, goal: StrategyGoal, profile: PrivateProfile) {
  const plan = {
    exportedAt: new Date().toISOString(),
    strategyGoal: goal,
    opportunity: {
      id: candidate.opportunity.id,
      reference: candidate.opportunity.canonicalReference,
      title: candidate.title,
      officialUrl: candidate.opportunity.submission.officialUrl,
    },
    assessment: {
      strategicScore: candidate.strategicScore,
      fitScore: candidate.fitScore,
      evidenceScore: candidate.evidenceScore,
      eligibility: 'unknown',
      route: candidate.route,
      publishedCapital: candidate.publishedCapital,
      deadline: candidate.deadlineVerified ? candidate.deadline : null,
      fitReasons: candidate.fitReasons,
      blockers: candidate.blockers,
      nextActions: candidate.nextActions,
    },
    privateContext: {
      profileCompletion: profileCompletion(profile),
      investmentCeiling: parsePrivateAmount(profile.investmentCeiling) ?? null,
      note: 'El perfil privado se resume y no se publica; este archivo queda bajo control del usuario.',
    },
    guardrail: 'Preparación asistida. Revisión, identificación, firma y presentación siempre manuales.',
  }
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `estrategia-${candidate.opportunity.canonicalReference.replace(/[^a-z0-9_-]+/gi, '-')}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function StrategyCouncil({
  catalog,
  status,
  errorMessage,
  profile,
  applications,
  onRetry,
  onOpenEvidence,
  onPrepare,
}: StrategyCouncilProps) {
  const [goal, setGoal] = useState<StrategyGoal>('balanced')
  const candidates = useMemo(
    () => catalog ? buildStrategyCandidates(catalog.opportunities, catalog.sourceRecords, profile, goal) : [],
    [catalog, goal, profile],
  )
  const [selectedId, setSelectedId] = useState<string>()
  const selected = candidates.find((candidate) => candidate.opportunity.id === selectedId) ?? candidates[0]

  useEffect(() => {
    if (!selectedId || !candidates.some((candidate) => candidate.opportunity.id === selectedId)) {
      setSelectedId(candidates[0]?.opportunity.id)
    }
  }, [candidates, selectedId])

  if (status === 'loading') {
    return <main className="v3-strategy-state"><LoaderCircle className="is-spinning" /><h1>Verificando el catálogo V2</h1><p>Se comprueban hashes y contratos antes de calcular una estrategia.</p></main>
  }
  if (status === 'error' || !catalog) {
    return <main className="v3-strategy-state is-error"><AlertTriangle /><h1>La estrategia no puede confiar en el catálogo</h1><p>{errorMessage ?? 'No se pudo cargar la base V2.'}</p><button type="button" onClick={onRetry}><RefreshCw /> Reintentar verificación</button></main>
  }
  if (!selected) {
    return <main className="v3-strategy-state"><ShieldQuestion /><h1>No hay oportunidades abiertas</h1><p>El motor volverá a evaluar el catálogo en la siguiente actualización.</p></main>
  }

  const detectedCapital = candidates.reduce((sum, candidate) => sum + (candidate.publishedCapital ?? 0), 0)
  const investment = parsePrivateAmount(profile.investmentCeiling)
  const application = applications.find((item) => item.opportunityId === selected.opportunity.id)

  return (
    <main className="v3-strategy" aria-labelledby="v3-strategy-title">
      <header className="v3-strategy-header">
        <div>
          <h1 id="v3-strategy-title">Consejo Estratégico V3</h1>
          <p>Convierte el catálogo validado en una cartera de decisiones. El motor es determinista, explica sus límites y no presenta nada por ti.</p>
        </div>
        <div className="v3-strategy-trust"><CheckCircle2 /><span><strong>{catalog.manifest.opportunityCount} registros verificados</strong><small>{catalog.manifest.catalogVersion.slice(0, 22)}…</small></span></div>
      </header>

      <section className="v3-strategy-metrics" aria-label="Estado de la estrategia">
        <div><span>CATÁLOGO</span><strong>{catalog.manifest.opportunityCount}</strong><small>oportunidades públicas</small></div>
        <div><span>CAPITAL PUBLICADO</span><strong>{formatMoney(detectedCapital)}</strong><small>dotaciones, no concesión esperada</small></div>
        <div><span>PERFIL PRIVADO</span><strong>{profileCompletion(profile)}%</strong><small>{profileCompletion(profile) < 70 ? 'completa el perfil para afinar' : 'base suficiente para priorizar'}</small></div>
        <div><span>CAPITAL PROPIO</span><strong>{formatMoney(investment)}</strong><small>solo se usa en este navegador</small></div>
      </section>

      <div className="v3-strategy-grid">
        <aside className="v3-goals" aria-label="Objetivo estratégico">
          <h2>Objetivo</h2>
          <p>Elige qué debe optimizar el motor en esta sesión.</p>
          {strategyGoals.map((item) => {
            const Icon = goalIcons[item.id]
            return <button type="button" key={item.id} data-active={goal === item.id} aria-pressed={goal === item.id} onClick={() => { setGoal(item.id); setSelectedId(undefined) }}><Icon /><span><strong>{item.label}</strong><small>{item.description}</small></span></button>
          })}
          <div className="v3-method-note"><ShieldQuestion /><p><strong>Elegibilidad desconocida</strong>Un score alto nunca sustituye las bases. Primero evidencia; después decisión.</p></div>
        </aside>

        <section className="v3-ledger" aria-label="Cartera priorizada">
          <header><div><h2>Cartera priorizada</h2><p>{candidates.length} vías abiertas o próximas · orden provisional</p></div><span>{strategyGoals.find((item) => item.id === goal)?.label}</span></header>
          <div className="v3-ledger-list">
            {candidates.slice(0, 18).map((candidate, index) => (
              <button type="button" key={candidate.opportunity.id} data-selected={candidate.opportunity.id === selected.opportunity.id} aria-current={candidate.opportunity.id === selected.opportunity.id ? 'true' : undefined} onClick={() => setSelectedId(candidate.opportunity.id)}>
                <b>{String(index + 1).padStart(2, '0')}</b>
                <span><strong>{candidate.title}</strong><small>{candidate.sourceLabel} · {candidate.routeLabel} · evidencia {candidate.evidenceScore}%</small></span>
                <em>{candidate.strategicScore}</em>
              </button>
            ))}
          </div>
        </section>

        <article className="v3-brief">
          <header>
            <span>{selected.sourceLabel} · {selected.opportunity.canonicalReference}</span>
            <h2>{selected.title}</h2>
            <div><strong>{selected.routeLabel}</strong><small>Ruta recomendada, pendiente de evidencia</small></div>
          </header>
          <dl className="v3-decision-numbers">
            <div><dt>PRIORIDAD</dt><dd>{selected.strategicScore}/99</dd></div>
            <div><dt>ENCAJE</dt><dd>{selected.fitScore}%</dd></div>
            <div><dt>EVIDENCIA</dt><dd>{selected.evidenceScore}%</dd></div>
            <div><dt>PLAZO</dt><dd>{formatDeadline(selected)}</dd></div>
          </dl>

          <section><h3>Por qué está aquí</h3>{selected.fitReasons.map((reason) => <p className="v3-reason" key={reason}><CheckCircle2 />{reason}</p>)}</section>
          <section><h3>Lo que impide decidir</h3>{selected.blockers.map((blocker) => <p className="v3-blocker" key={blocker}><AlertTriangle />{blocker}</p>)}</section>
          <section><h3>Siguiente secuencia</h3><ol>{selected.nextActions.map((action) => <li key={action}>{action}</li>)}</ol></section>

          <footer>
            <div><span>CAPITAL PUBLICADO</span><strong>{formatMoney(selected.publishedCapital)}</strong><small>No es el importe garantizado para un solicitante.</small></div>
            <button type="button" className="v3-secondary-action" onClick={() => onOpenEvidence(selected.opportunity.id)}><Landmark /> Abrir evidencia</button>
            <button type="button" className="v3-secondary-action" onClick={() => window.open(selected.opportunity.submission.officialUrl, '_blank', 'noopener,noreferrer')}><ExternalLink /> Fuente oficial</button>
            <button type="button" className="v3-secondary-action" onClick={() => downloadPlan(selected, goal, profile)}><Download /> Exportar estrategia</button>
            <button type="button" className="v3-primary-action" onClick={() => onPrepare(selected)}><BriefcaseBusiness /> {application ? 'Continuar expediente' : 'Preparar expediente'} <ArrowRight /></button>
          </footer>
        </article>
      </div>
    </main>
  )
}
