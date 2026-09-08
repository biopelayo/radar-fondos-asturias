import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarDays,
  Database,
  Download,
  FileCheck2,
  FileSearch,
  LayoutDashboard,
  Menu,
  Radar,
  RefreshCw,
  SearchCheck,
  Settings,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
import { OpportunityWorkbench } from './components/OpportunityWorkbench'
import { EvidenceWorkspace } from './components/v2'
import type { EvidenceDocumentV2, EvidenceOpportunityV2 } from './components/v2'
import { StrategyCouncil } from './components/v3'
import { demoOpportunities } from './data/demo'
import bundledPayload from './data/opportunities.generated.json'
import { loadV2Catalog } from './domain/v2'
import type { V2Catalog } from './domain/v2'
import { emptyProfile, useLocalWorkspace } from './hooks/useLocalWorkspace'
import type { ApplicationRecord, Opportunity, PrivateProfile } from './types'

type View = 'panel' | 'strategy-v3' | 'evidence-v2' | 'radar' | 'expedientes' | 'calendario' | 'fuentes' | 'perfil' | 'ajustes'

interface DataPayload {
  generatedAt?: string
  opportunities?: Opportunity[]
  errors?: string[]
}

type DataHealth = 'loading' | 'fresh' | 'partial' | 'stale'

const MAX_DATA_AGE_MS = 36 * 60 * 60 * 1000

function evaluateDataHealth(payload: DataPayload): Exclude<DataHealth, 'loading'> {
  const generatedTime = payload.generatedAt ? Date.parse(payload.generatedAt) : Number.NaN
  const age = Date.now() - generatedTime
  if (!Number.isFinite(generatedTime) || age < -5 * 60 * 1000 || age > MAX_DATA_AGE_MS) return 'stale'
  return payload.errors?.length ? 'partial' : 'fresh'
}

const navigation: Array<{ id: View; label: string; icon: typeof Radar }> = [
  { id: 'panel', label: 'Mesa de decisión', icon: LayoutDashboard },
  { id: 'strategy-v3', label: 'Consejo V3', icon: BrainCircuit },
  { id: 'evidence-v2', label: 'Evidence Lab V2', icon: FileSearch },
  { id: 'radar', label: 'Radar', icon: Radar },
  { id: 'expedientes', label: 'Expedientes', icon: BriefcaseBusiness },
  { id: 'calendario', label: 'Plazos', icon: CalendarDays },
  { id: 'fuentes', label: 'Fuentes', icon: Database },
  { id: 'perfil', label: 'Perfil privado', icon: UserRound },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
]

function viewFromHash(): View {
  const requested = window.location.hash.slice(1) as View
  return navigation.some((item) => item.id === requested) ? requested : 'panel'
}

const sourceRows = [
  ['BDNS / SNPSAP', 'Subvenciones estatales, autonómicas y locales', 'API oficial', 'Activa'],
  ['BOE', 'Disposiciones y extractos de convocatorias', 'Datos abiertos', 'Activa'],
  ['BOPA', 'Boletín del Principado de Asturias', 'Sumario oficial', 'Activa'],
  ['Funding & Tenders', 'Convocatorias directas de la Unión Europea', 'API oficial', 'Activa'],
  ['PLACSP', 'Contratos y licitaciones públicas', 'Portal oficial', 'Próxima fase'],
  ['SEKUENS', 'Programas empresariales de Asturias', 'Web oficial', 'Próxima fase'],
] as const

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function statusLabel(stage: ApplicationRecord['stage']) {
  const labels: Record<ApplicationRecord['stage'], string> = {
    preseleccionada: 'Preseleccionada',
    preparando: 'En preparación',
    presentada: 'Presentada',
    concedida: 'Concedida',
    denegada: 'Denegada',
  }
  return labels[stage]
}

function ProfileView({
  profile,
  onChange,
  onImport,
}: {
  profile: PrivateProfile
  onChange: (profile: PrivateProfile) => void
  onImport: (profile: PrivateProfile) => void
}) {
  const fields: Array<[keyof PrivateProfile, string, string]> = [
    ['displayName', 'Nombre de trabajo', 'Solo se guarda en este navegador'],
    ['residence', 'Residencia y base', 'Ej. Oviedo, Asturias'],
    ['territories', 'Territorios posibles', 'Asturias, España, UE…'],
    ['situation', 'Situación profesional', 'Demandante de empleo, autónomo…'],
    ['sectors', 'Sectores y capacidades', 'IA, datos, turismo, docencia…'],
    ['languages', 'Idiomas', 'Castellano, inglés…'],
    ['investmentCeiling', 'Capital propio máximo', 'Importe orientativo'],
    ['incomeGoal', 'Objetivo económico', 'Objetivo mensual neto'],
    ['notes', 'Notas de elegibilidad', 'Condiciones, activos, límites…'],
  ]

  const exportProfile = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'perfil-privado-radar-fondos-asturias.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importProfile = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        onImport({ ...emptyProfile, ...(JSON.parse(String(reader.result)) as Partial<PrivateProfile>) })
      } catch {
        window.alert('El archivo no contiene un perfil JSON válido.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <main className="single-view profile-view">
      <header className="view-heading">
        <div><span>Espacio local del navegador</span><h1>Perfil privado de elegibilidad</h1></div>
        <div className="heading-actions">
          <label className="file-action"><Upload size={16} />Importar JSON<input type="file" accept="application/json" onChange={(event) => importProfile(event.target.files?.[0])} /></label>
          <button type="button" onClick={exportProfile}><Download size={16} />Exportar copia</button>
        </div>
      </header>
      <div className="privacy-notice"><ShieldCheck size={20} /><div><strong>Estos datos no salen del navegador.</strong><span>No se publican en GitHub ni se envían a los recolectores. Sirven para calcular encaje y requisitos.</span></div></div>
      <form className="profile-grid" onSubmit={(event) => event.preventDefault()}>
        {fields.map(([key, label, placeholder]) => (
          <label key={key} className={key === 'notes' || key === 'sectors' ? 'wide-field' : ''}>
            <span>{label}</span>
            {key === 'notes' || key === 'sectors' ? (
              <textarea value={profile[key]} placeholder={placeholder} onChange={(event) => onChange({ ...profile, [key]: event.target.value })} />
            ) : (
              <input value={profile[key]} placeholder={placeholder} onChange={(event) => onChange({ ...profile, [key]: event.target.value })} />
            )}
          </label>
        ))}
      </form>
      <p className="autosave-line"><Activity size={15} />Guardado automático en este dispositivo.</p>
    </main>
  )
}

function SourcesView() {
  return (
    <main className="single-view sources-view">
      <header className="view-heading"><div><span>Ingesta y contraste</span><h1>Fuentes oficiales</h1></div></header>
      <div className="source-table" role="table" aria-label="Fuentes monitorizadas">
        <div className="source-row source-head" role="row"><span role="columnheader">Fuente</span><span role="columnheader">Cobertura</span><span role="columnheader">Acceso</span><span role="columnheader">Estado</span></div>
        {sourceRows.map((row) => (
          <div className="source-row" role="row" key={row[0]}>
            <strong role="cell">{row[0]}</strong><span role="cell">{row[1]}</span><code role="cell">{row[2]}</code><b role="cell" className={row[3] === 'Activa' ? '' : 'planned'}><i />{row[3]}</b>
          </div>
        ))}
      </div>
      <section className="method-strip"><SearchCheck size={25} /><div><strong>Una oportunidad no se considera lista hasta que tenga evidencia oficial.</strong><span>El detector descubre; la ficha contrasta publicación, beneficiarios, cuantía, plazo y procedimiento antes de recomendar una acción.</span></div></section>
    </main>
  )
}

function ApplicationsView({ applications, opportunities, catalog }: { applications: ApplicationRecord[]; opportunities: Opportunity[]; catalog: V2Catalog | null }) {
  return (
    <main className="single-view applications-view">
      <header className="view-heading"><div><span>Control de candidaturas</span><h1>Expedientes</h1></div><strong>{applications.length} activos</strong></header>
      {applications.length === 0 ? (
        <section className="large-empty"><FileCheck2 /><h2>Aún no has ordenado preparar ninguna candidatura</h2><p>Desde la mesa de decisión puedes abrir un expediente. El sistema no presenta nada por su cuenta.</p></section>
      ) : (
        <div className="application-table">
          <div className="application-row application-head"><span>Oportunidad</span><span>Estado</span><span>Capital</span><span>Creado</span></div>
          {applications.map((application) => {
            const opportunity = opportunities.find((item) => item.id === application.opportunityId)
            const v2Opportunity = catalog?.opportunities.find((item) => item.id === application.opportunityId)
            const v2Title = v2Opportunity?.titles.find((item) => item.language.startsWith('es'))?.value ?? v2Opportunity?.titles[0]?.value
            const v2Amount = v2Opportunity?.finance.applicantMaximum ?? v2Opportunity?.finance.programmeBudget
            const amount = opportunity?.amount || v2Amount
            return <div className="application-row" key={application.opportunityId}><strong>{opportunity?.title ?? v2Title ?? application.opportunityId}</strong><b>{statusLabel(application.stage)}</b><span>{amount === undefined ? 'Por verificar' : formatMoney(amount)}</span><time>{new Date(application.createdAt).toLocaleDateString('es-ES')}</time></div>
          })}
        </div>
      )}
    </main>
  )
}

function CalendarView({ opportunities }: { opportunities: Opportunity[] }) {
  const dated = opportunities
    .filter((item) => item.deadlineVerified && new Date(`${item.deadline}T23:59:59`).getTime() >= Date.now())
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 30)
  return (
    <main className="single-view calendar-view">
      <header className="view-heading"><div><span>Ventana de actuación</span><h1>Próximos plazos</h1></div><strong>{dated.length} fechas verificadas</strong></header>
      <div className="deadline-list">
        {dated.map((item) => {
          const days = Math.ceil((new Date(`${item.deadline}T23:59:59`).getTime() - Date.now()) / 86_400_000)
          return <div className="deadline-item" key={item.id}><time dateTime={item.deadline}><b>{new Date(`${item.deadline}T12:00:00`).toLocaleDateString('es-ES', { day: '2-digit' })}</b><span>{new Date(`${item.deadline}T12:00:00`).toLocaleDateString('es-ES', { month: 'short' })}</span></time><div><strong>{item.title}</strong><small>{item.source} · {item.territory}</small></div><em>{days} días</em></div>
        })}
      </div>
    </main>
  )
}

function SettingsView({ health }: { health: DataHealth }) {
  return (
    <main className="single-view settings-view">
      <header className="view-heading"><div><span>Operación controlada</span><h1>Ajustes del sistema</h1></div></header>
      <div className="settings-list">
        <section><span>RECOLECCIÓN</span><strong>Dos controles diarios</strong><p>A las 09:00 y por la tarde mediante la automatización programada.</p><b>{health === 'fresh' ? 'Datos al día' : health === 'loading' ? 'Actualizando' : 'Usando copia disponible'}</b></section>
        <section><span>CORREO</span><strong>Gmail opcional</strong><p>Se activa únicamente con secretos del repositorio; la contraseña nunca entra en la web.</p><b>Configuración externa</b></section>
        <section><span>PRIVACIDAD</span><strong>Perfil aislado</strong><p>Elegibilidad y expedientes permanecen en el almacenamiento local del navegador.</p><b>Local</b></section>
        <section><span>AUTONOMÍA</span><strong>Sin envíos automáticos</strong><p>La app prepara un expediente solo al recibir tu orden. Firma y presentación siempre manuales.</p><b>Control humano</b></section>
      </div>
    </main>
  )
}

function RadarView({ opportunities }: { opportunities: Opportunity[] }) {
  const plotted = opportunities.slice().sort((a, b) => b.score - a.score).slice(0, 40)
  const points = plotted.map((item, index) => {
    const angle = (index / Math.max(plotted.length, 1)) * Math.PI * 2 - Math.PI / 2
    const radius = 40 + item.score * 1.25
    return { ...item, x: 240 + Math.cos(angle) * radius, y: 240 + Math.sin(angle) * radius }
  })
  return (
    <main className="single-view radar-view">
      <header className="view-heading"><div><span>Panorama de capital</span><h1>Radar de oportunidades</h1></div><strong>Encaje × urgencia × importe</strong></header>
      <div className="radar-layout">
        <div className="radar-plot" aria-label="Mapa visual de oportunidades">
          <svg viewBox="0 0 480 480" role="img" aria-label="Radar de encaje">
            {[65, 125, 185].map((radius) => <circle key={radius} cx="240" cy="240" r={radius} />)}
            <path d="M240 42V438M42 240H438M100 100L380 380M380 100L100 380" />
            <text x="240" y="27">MAYOR ENCAJE</text><text x="240" y="466">EXPLORATORIO</text>
            {points.map((point) => <g key={point.id}><circle className={`radar-dot kind-${point.kind}`} cx={point.x} cy={point.y} r={Math.max(5, Math.min(13, Math.sqrt(point.amount) / 30))} /><text className="dot-rank" x={point.x + 11} y={point.y + 4}>{point.score}</text></g>)}
          </svg>
        </div>
        <div className="radar-legend">
          <span>Lectura operativa</span>
          <h2>Primero lo viable, después lo grande</h2>
          <p>La distancia al centro representa prioridad de trabajo. El tamaño aproxima el capital potencial; el color distingue la vía de acceso.</p>
          {opportunities.slice().sort((a, b) => b.score - a.score).slice(0, 4).map((item, index) => <div className="radar-item" key={item.id}><b>{String(index + 1).padStart(2, '0')}</b><span><strong>{item.title}</strong><small>{item.source} · {formatMoney(item.amount)}</small></span><em>{item.score}</em></div>)}
        </div>
      </div>
    </main>
  )
}

function EvidenceView({
  catalog,
  status,
  errorMessage,
  selectedId,
  onSelect,
  onRetry,
}: {
  catalog: V2Catalog | null
  status: 'loading' | 'ready' | 'error'
  errorMessage?: string
  selectedId?: string
  onSelect: (opportunityId: string) => void
  onRetry: () => void
}) {
  if (status === 'loading') {
    return <main className="v2-evidence-view"><EvidenceWorkspace opportunity={null} document={null} claims={[]} status="loading" /></main>
  }
  if (status === 'error' || !catalog) {
    return <main className="v2-evidence-view"><EvidenceWorkspace opportunity={null} document={null} claims={[]} status="error" errorMessage={errorMessage} onRetry={onRetry} /></main>
  }
  const preferred = catalog.opportunities.find((item) => item.id === selectedId)
    ?? catalog.opportunities.find((item) => item.geography.regionCodes.includes('ES-AS'))
    ?? catalog.opportunities[0]
  if (!preferred) {
    return <main className="v2-evidence-view"><EvidenceWorkspace opportunity={null} document={null} claims={[]} /></main>
  }
  const sourceRecord = catalog.sourceRecords.find((item) => preferred.sourceRecordIds.includes(item.id))
  const canonicalDocument = catalog.documents.find((item) => preferred.documentRevisionIds.includes(item.revisionId))
  const document: EvidenceDocumentV2 = canonicalDocument ?? {
    officialUrl: sourceRecord?.canonicalUrl ?? preferred.submission.officialUrl,
    role: preferred.family === 'procurement' ? 'procurement_notice' : 'call',
    mimeType: sourceRecord?.http.contentType ?? 'text/html',
    language: 'es',
    publishedAt: sourceRecord?.publishedAt,
    extraction: { method: 'none', version: 'catalog-v2-index' },
    sourceRecordIds: preferred.sourceRecordIds,
  }
  const claims = catalog.claims.filter((claim) => claim.opportunityId === preferred.id)

  return (
    <main className="v2-evidence-view">
      <div className="v2-catalog-bar">
        <label htmlFor="v2-opportunity-select">Oportunidad del catálogo validado</label>
        <select id="v2-opportunity-select" value={preferred.id} onChange={(event) => onSelect(event.target.value)}>
          {catalog.opportunities.map((item) => {
            const title = item.titles.find((entry) => entry.language.startsWith('es'))?.value ?? item.titles[0]?.value ?? item.canonicalReference
            return <option value={item.id} key={item.id}>{item.canonicalReference} · {title}</option>
          })}
        </select>
        <span>{catalog.manifest.opportunityCount} registros · hash verificado</span>
      </div>
      <EvidenceWorkspace
        opportunity={preferred as EvidenceOpportunityV2}
        document={document}
        claims={claims}
        pages={[]}
        documentState="unavailable"
        fallbackReason="La publicación oficial está localizada en el catálogo V2, pero todavía no hay texto por página ni fragmentos citables. Los campos sin claim permanecen Por verificar."
        onOpenOfficialSource={(item) => window.open(item.officialUrl, '_blank', 'noopener,noreferrer')}
      />
    </main>
  )
}

export default function App() {
  const [activeView, setActiveView] = useState<View>(viewFromHash)
  const [menuOpen, setMenuOpen] = useState(false)
  const initialPayload = bundledPayload as DataPayload
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialPayload.opportunities?.length ? initialPayload.opportunities : demoOpportunities)
  const [generatedAt, setGeneratedAt] = useState<string | undefined>(initialPayload.generatedAt)
  const [dataHealth, setDataHealth] = useState<DataHealth>(initialPayload.opportunities?.length ? evaluateDataHealth(initialPayload) : 'stale')
  const [v2Catalog, setV2Catalog] = useState<V2Catalog | null>(null)
  const [v2Status, setV2Status] = useState<'loading' | 'ready' | 'error'>('loading')
  const [v2Error, setV2Error] = useState<string>()
  const [selectedV2OpportunityId, setSelectedV2OpportunityId] = useState<string>()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const { profile, setProfile, importProfile, applications, prepareApplication } = useLocalWorkspace()

  const refreshData = useCallback(async () => {
    setDataHealth('loading')
    try {
      const response = await fetch('./data/opportunities.json', { cache: 'no-store' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = await response.json() as DataPayload
      if (!payload.opportunities?.length) throw new Error('Dataset vacío')
      setOpportunities(payload.opportunities)
      setGeneratedAt(payload.generatedAt)
      setDataHealth(evaluateDataHealth(payload))
    } catch {
      setDataHealth('stale')
    }
  }, [])

  const refreshV2 = useCallback(async () => {
    setV2Status('loading')
    setV2Error(undefined)
    try {
      const catalog = await loadV2Catalog()
      setV2Catalog(catalog)
      setV2Status('ready')
      setSelectedV2OpportunityId((current) => current ?? catalog.opportunities.find((item) => item.geography.regionCodes.includes('ES-AS'))?.id ?? catalog.opportunities[0]?.id)
    } catch (error) {
      setV2Catalog(null)
      setV2Status('error')
      setV2Error(error instanceof Error ? error.message : 'El catálogo V2 no pudo verificarse.')
    }
  }, [])

  useEffect(() => { void refreshData() }, [refreshData])
  useEffect(() => { void refreshV2() }, [refreshV2])
  useEffect(() => {
    const syncViewFromHash = () => setActiveView(viewFromHash())
    window.addEventListener('hashchange', syncViewFromHash)
    return () => window.removeEventListener('hashchange', syncViewFromHash)
  }, [])
  useEffect(() => {
    if (window.location.hash === `#${activeView}`) return
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${activeView}`)
  }, [activeView])

  const closeMenu = useCallback((returnFocus = true) => {
    setMenuOpen(false)
    if (returnFocus) window.setTimeout(() => menuButtonRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeMenu, menuOpen])

  const totalCapital = useMemo(() => opportunities.reduce((sum, item) => sum + item.amount, 0), [opportunities])
  const rankedOpportunities = useMemo(() => {
    const privateTerms = `${profile.residence} ${profile.territories} ${profile.situation} ${profile.sectors}`
      .toLocaleLowerCase('es')
      .split(/[^\p{L}\p{N}+]+/u)
      .filter((term) => term.length >= 4)
    if (!privateTerms.length) return opportunities
    return opportunities.map((item) => {
      const haystack = `${item.title} ${item.issuer} ${item.territory} ${item.tags.join(' ')}`.toLocaleLowerCase('es')
      const matches = new Set(privateTerms.filter((term) => haystack.includes(term))).size
      return { ...item, score: Math.min(99, item.score + Math.min(12, matches * 2)) }
    })
  }, [opportunities, profile])
  const renderView = () => {
    if (activeView === 'panel') return <OpportunityWorkbench opportunities={rankedOpportunities} applications={applications} onPrepare={prepareApplication} />
    if (activeView === 'strategy-v3') return <StrategyCouncil catalog={v2Catalog} status={v2Status} errorMessage={v2Error} profile={profile} applications={applications} onRetry={() => void refreshV2()} onOpenEvidence={(opportunityId) => { setSelectedV2OpportunityId(opportunityId); setActiveView('evidence-v2') }} onPrepare={(candidate) => prepareApplication(candidate.opportunity.id)} />
    if (activeView === 'evidence-v2') return <EvidenceView catalog={v2Catalog} status={v2Status} errorMessage={v2Error} selectedId={selectedV2OpportunityId} onSelect={setSelectedV2OpportunityId} onRetry={() => void refreshV2()} />
    if (activeView === 'radar') return <RadarView opportunities={rankedOpportunities} />
    if (activeView === 'expedientes') return <ApplicationsView applications={applications} opportunities={rankedOpportunities} catalog={v2Catalog} />
    if (activeView === 'calendario') return <CalendarView opportunities={rankedOpportunities} />
    if (activeView === 'fuentes') return <SourcesView />
    if (activeView === 'perfil') return <ProfileView profile={profile} onChange={setProfile} onImport={importProfile} />
    return <SettingsView health={dataHealth} />
  }

  const healthCopy = dataHealth === 'fresh'
    ? ['Datos al día', 'Fuentes oficiales actualizadas']
    : dataHealth === 'loading'
      ? ['Actualizando', 'Consultando el dataset público']
      : dataHealth === 'partial'
        ? ['Actualización parcial', 'Alguna fuente requiere revisión']
        : ['Copia local disponible', 'Pulsa recargar para reintentar']

  return (
    <div className="app-shell">
      <aside id="primary-navigation" className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand"><div className="brand-mark"><span /><span /><span /></div><div><strong>RADAR</strong><small>FONDOS · ASTURIAS</small></div><button ref={closeButtonRef} type="button" className="close-menu" aria-label="Cerrar navegación" onClick={() => closeMenu()}><X /></button></div>
        <nav aria-label="Navegación principal">
          {navigation.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={activeView === id ? 'active' : ''} onClick={() => { setActiveView(id); closeMenu(false) }}><Icon /><span>{label}</span></button>)}
        </nav>
        <div className="sidebar-intel"><span>CAPITAL DETECTADO</span><strong>{formatMoney(totalCapital)}</strong><small>{opportunities.length} señales · {opportunities.every((item) => item.demo) ? 'escenario demo' : 'datos oficiales'}</small></div>
        <div className={`sidebar-status health-${dataHealth}`}><i /><span><strong>{healthCopy[0]}</strong><small>{healthCopy[1]}</small></span></div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button ref={menuButtonRef} type="button" className="menu-button" aria-label="Abrir navegación" aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen(true)}><Menu /></button>
          <div className="breadcrumb"><span>INTELIGENCIA DE FINANCIACIÓN</span><strong>{navigation.find((item) => item.id === activeView)?.label}</strong></div>
          <div className={`freshness health-${dataHealth}`} aria-live="polite" title={`${healthCopy[0]}. ${healthCopy[1]}`}><i /><span><small>{healthCopy[0]}</small><strong>{generatedAt ? new Date(generatedAt).toLocaleString('es-ES') : healthCopy[1]}</strong></span></div>
          <button type="button" className="icon-button" aria-label="Actualizar datos ahora" title="Actualizar datos ahora" onClick={() => void refreshData()} disabled={dataHealth === 'loading'}><RefreshCw /></button>
          <button type="button" className="profile-chip" onClick={() => setActiveView('perfil')}><span>{profile.displayName ? profile.displayName.slice(0, 2).toUpperCase() : 'PP'}</span><div><strong>{profile.displayName || 'Perfil privado'}</strong><small>Solo en este equipo</small></div></button>
        </header>
        {renderView()}
      </div>
      <nav className="mobile-nav" aria-label="Navegación móvil">
        {navigation.filter((item) => ['panel', 'strategy-v3', 'evidence-v2', 'expedientes', 'perfil'].includes(item.id)).map(({ id, label, icon: Icon }) => <button type="button" key={id} className={activeView === id ? 'active' : ''} aria-current={activeView === id ? 'page' : undefined} onClick={() => setActiveView(id)}><Icon /><span>{label === 'Mesa de decisión' ? 'Mesa' : label === 'Consejo V3' ? 'V3' : label === 'Evidence Lab V2' ? 'Evidencia' : label === 'Perfil privado' ? 'Perfil' : label}</span></button>)}
      </nav>
      {menuOpen && <button className="mobile-scrim" aria-label="Cerrar navegación" onClick={() => closeMenu()} />}
    </div>
  )
}
