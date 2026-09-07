import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  FileSearch,
  Flag,
  LocateFixed,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import '../../styles/v2/evidence-workspace.css'
import type {
  EvidenceClaimStatus,
  EvidenceClaimV2,
  EvidenceReviewAction,
  EvidenceWorkspaceProps,
} from './EvidenceWorkspace.types'

type MobilePane = 'analysis' | 'document' | 'actions'

const claimStateCopy: Record<EvidenceClaimStatus, string> = {
  located: 'Oficial localizada',
  confirmed: 'Confirmada por ti',
  inferred: 'Inferida',
  conflict: 'En conflicto',
  stale: 'Reconfirmar',
  missing: 'Sin evidencia',
}

const categoryCopy: Record<EvidenceClaimV2['category'], string> = {
  eligibility: 'Elegibilidad',
  money: 'Dinero',
  deadline: 'Plazo',
  document: 'Documento',
  risk: 'Riesgo',
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value))

function ClaimStateIcon({ status }: { status: EvidenceClaimStatus }) {
  if (status === 'confirmed') return <CheckCircle2 aria-hidden="true" />
  if (status === 'located') return <ShieldCheck aria-hidden="true" />
  if (status === 'conflict' || status === 'missing') return <AlertTriangle aria-hidden="true" />
  return <CircleDashed aria-hidden="true" />
}

function WorkspaceState({
  kind,
  message,
  onRetry,
}: {
  kind: 'loading' | 'error' | 'empty'
  message: string
  onRetry?: () => void
}) {
  const Icon = kind === 'error' ? AlertTriangle : kind === 'loading' ? RefreshCw : FileSearch
  const title = kind === 'error'
    ? 'No se pudo abrir el espacio de evidencia'
    : kind === 'loading'
      ? 'Preparando evidencia local'
      : 'Selecciona una oportunidad con evidencia'

  return (
    <section
      className={`v2-evidence-state is-${kind}`}
      aria-live="polite"
      aria-busy={kind === 'loading'}
    >
      <Icon aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
      {kind === 'error' && onRetry ? (
        <button type="button" onClick={onRetry}>
          <RefreshCw aria-hidden="true" /> Reintentar
        </button>
      ) : null}
    </section>
  )
}

function ReviewControls({
  claim,
  status,
  onReview,
}: {
  claim?: EvidenceClaimV2
  status?: EvidenceClaimStatus | 'flagged'
  onReview: (action: EvidenceReviewAction) => void
}) {
  if (!claim) {
    return (
      <div className="v2-evidence-review-empty">
        <CircleDashed aria-hidden="true" />
        <p>Selecciona un claim para revisar su consecuencia y procedencia.</p>
      </div>
    )
  }

  const statusLabel = status === 'flagged' ? 'Marcada para revisar' : claimStateCopy[status ?? claim.status]

  return (
    <div className="v2-evidence-review">
      <div className="v2-evidence-review-state">
        <span>Estado de revisión</span>
        <strong>{statusLabel}</strong>
      </div>
      <dl>
        <div>
          <dt>Valor interpretado</dt>
          <dd>{claim.value}</dd>
        </div>
        <div>
          <dt>Consecuencia</dt>
          <dd>{claim.consequence ?? 'No se ha descrito una consecuencia operativa.'}</dd>
        </div>
        <div>
          <dt>Confianza</dt>
          <dd>{claim.confidence === undefined ? 'No calculada' : `${Math.round(claim.confidence * 100)} %`}</dd>
        </div>
      </dl>
      <div className="v2-evidence-review-actions">
        <button type="button" onClick={() => onReview('confirm')} disabled={!claim.pointer}>
          <CheckCircle2 aria-hidden="true" /> Confirmar revisión
        </button>
        <button type="button" onClick={() => onReview('flag')}>
          <Flag aria-hidden="true" /> Revisar después
        </button>
      </div>
      {!claim.pointer ? <p className="v2-evidence-review-warning">No puede confirmarse sin una cita enlazada.</p> : null}
    </div>
  )
}

function Passage({
  text,
  quote,
  passageRef,
}: {
  text: string
  quote?: string
  passageRef: RefObject<HTMLElement>
}) {
  if (!quote) return <>{text}</>
  const start = text.toLocaleLowerCase('es').indexOf(quote.toLocaleLowerCase('es'))
  if (start < 0) return <>{text}</>
  const end = start + quote.length

  return (
    <>
      {text.slice(0, start)}
      <mark ref={passageRef} tabIndex={-1}>{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  )
}

export function EvidenceWorkspace({
  opportunity,
  document,
  claims,
  status = 'ready',
  errorMessage,
  initialClaimId,
  className = '',
  onRetry,
  onClaimSelect,
  onClaimReview,
  onOpenOfficialSource,
}: EvidenceWorkspaceProps) {
  const firstClaimId = initialClaimId && claims.some((claim) => claim.id === initialClaimId)
    ? initialClaimId
    : claims[0]?.id
  const [selectedClaimId, setSelectedClaimId] = useState(firstClaimId ?? '')
  const [pageNumber, setPageNumber] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightMode, setHighlightMode] = useState<'claim' | 'search'>('claim')
  const [mobilePane, setMobilePane] = useState<MobilePane>('analysis')
  const [analysisWidth, setAnalysisWidth] = useState(40)
  const [reviewOverrides, setReviewOverrides] = useState<Record<string, EvidenceClaimStatus | 'flagged'>>({})
  const [liveMessage, setLiveMessage] = useState('')
  const passageRef = useRef<HTMLElement>(null)

  const selectedClaim = claims.find((claim) => claim.id === selectedClaimId)
  const selectedPointer = selectedClaim?.pointer
  const totalPages = Math.max(document?.pageCount ?? 0, document?.pages.length ?? 0, 1)
  const currentPage = document?.pages.find((page) => page.number === pageNumber)
  const claimQuote = selectedPointer
    && selectedPointer.documentId === document?.id
    && selectedPointer.page === pageNumber
    ? selectedPointer.quote
    : undefined
  const activeQuote = highlightMode === 'search' ? searchQuery.trim() : claimQuote

  const searchMatches = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('es')
    if (!query || !document) return []
    return document.pages
      .filter((page) => page.text.toLocaleLowerCase('es').includes(query))
      .map((page) => page.number)
  }, [document, searchQuery])

  useEffect(() => {
    if (!claims.some((claim) => claim.id === selectedClaimId)) {
      setSelectedClaimId(firstClaimId ?? '')
    }
  }, [claims, firstClaimId, selectedClaimId])

  useEffect(() => {
    const claimPage = selectedPointer && selectedPointer.documentId === document?.id
      ? selectedPointer.page
      : document?.pages[0]?.number ?? 1
    setPageNumber(clamp(claimPage, 1, totalPages))
  }, [document?.id, document?.pages, selectedPointer, totalPages])

  useEffect(() => {
    if (!activeQuote || !passageRef.current) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    passageRef.current.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' })
    passageRef.current.focus({ preventScroll: true })
  }, [activeQuote, mobilePane, pageNumber])

  const selectClaim = (claim: EvidenceClaimV2) => {
    const pointer = claim.pointer
    const activeDocument = document
    setSelectedClaimId(claim.id)
    setHighlightMode('claim')
    if (pointer && activeDocument && pointer.documentId === activeDocument.id) {
      setPageNumber(clamp(pointer.page, 1, totalPages))
      setMobilePane('document')
      setLiveMessage(`${claim.label}. Documento ${activeDocument.title}, página ${pointer.page}.`)
    } else {
      setLiveMessage(`${claim.label}. La cita no pertenece al documento abierto.`)
    }
    onClaimSelect?.(claim)
  }

  const reviewClaim = (action: EvidenceReviewAction) => {
    if (!selectedClaim) return
    const nextStatus = action === 'confirm' ? 'confirmed' : 'flagged'
    setReviewOverrides((current) => ({ ...current, [selectedClaim.id]: nextStatus }))
    setLiveMessage(action === 'confirm' ? 'Revisión confirmada en esta sesión.' : 'Claim marcado para revisar después.')
    onClaimReview?.(selectedClaim.id, action)
  }

  const runSearch = (direction: 1 | -1 = 1) => {
    if (!searchQuery.trim()) {
      setLiveMessage('Escribe un término para buscar en el documento.')
      return
    }
    if (!searchMatches.length) {
      setLiveMessage(`Sin coincidencias para “${searchQuery.trim()}”.`)
      return
    }
    const currentIndex = searchMatches.indexOf(pageNumber)
    const nextIndex = currentIndex < 0
      ? direction === 1 ? 0 : searchMatches.length - 1
      : (currentIndex + direction + searchMatches.length) % searchMatches.length
    const nextPage = searchMatches[nextIndex]
    setPageNumber(nextPage)
    setHighlightMode('search')
    setLiveMessage(`Coincidencia ${nextIndex + 1} de ${searchMatches.length}, página ${nextPage}.`)
  }

  const handleSplitterKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    let nextWidth = analysisWidth
    if (event.key === 'ArrowLeft') nextWidth -= 2
    else if (event.key === 'ArrowRight') nextWidth += 2
    else if (event.key === 'Home') nextWidth = 34
    else if (event.key === 'End') nextWidth = 56
    else return
    event.preventDefault()
    setAnalysisWidth(clamp(nextWidth, 34, 56))
  }

  const resizeWithPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const container = event.currentTarget.parentElement?.getBoundingClientRect()
    if (!container) return
    const nextWidth = ((event.clientX - container.left) / container.width) * 100
    setAnalysisWidth(clamp(nextWidth, 34, 56))
  }

  if (status === 'loading') {
    return <WorkspaceState kind="loading" message="Ordenando documento, páginas y claims sin enviar datos fuera del dispositivo." />
  }
  if (status === 'error') {
    return <WorkspaceState kind="error" message={errorMessage ?? 'La copia local no se pudo interpretar.'} onRetry={onRetry} />
  }
  if (!opportunity || !document) {
    return <WorkspaceState kind="empty" message="El visor se abrirá aquí cuando el dossier tenga un documento seleccionado." />
  }

  const renderedStatus = selectedClaim
    ? reviewOverrides[selectedClaim.id] ?? selectedClaim.status
    : undefined
  const sourceMismatch = selectedClaim?.pointer && (
    selectedClaim.pointer.documentId !== document.id
    || selectedClaim.pointer.revisionId !== document.revisionId
  )
  const noRenderablePage = document.renderState === 'unavailable' || !currentPage
  const rootStyle = { '--v2-evidence-analysis-width': `${analysisWidth}%` } as CSSProperties

  const reviewControls = (
    <ReviewControls
      claim={selectedClaim}
      status={renderedStatus}
      onReview={reviewClaim}
    />
  )

  return (
    <section
      className={`v2-evidence-workspace ${className}`.trim()}
      style={rootStyle}
      aria-labelledby="v2-evidence-title"
    >
      <div className="v2-evidence-live sr-only" aria-live="polite">{liveMessage}</div>

      <header className="v2-evidence-header">
        <div className="v2-evidence-title-block">
          <span>{opportunity.issuer}</span>
          <h1 id="v2-evidence-title">{opportunity.title}</h1>
          {opportunity.officialTitle && opportunity.officialTitle !== opportunity.title ? (
            <p><b>Denominación oficial</b>{opportunity.officialTitle}</p>
          ) : null}
        </div>
        <div className="v2-evidence-decision-strip" aria-label="Resumen de decisión">
          <div><span>Elegibilidad</span><strong>{opportunity.eligibilityLabel ?? 'Por verificar'}</strong></div>
          <div><span>Capital</span><strong>{opportunity.amountLabel ?? 'Por verificar'}</strong></div>
          <div><span>Plazo</span><strong>{opportunity.deadlineLabel ?? 'Por verificar'}</strong></div>
        </div>
      </header>

      <div className="v2-evidence-mobile-tabs" role="tablist" aria-label="Regiones del espacio de evidencia">
        {(['analysis', 'document', 'actions'] as const).map((pane) => {
          const label = pane === 'analysis' ? 'Análisis' : pane === 'document' ? 'Documento' : 'Acciones'
          return (
            <button
              type="button"
              role="tab"
              key={pane}
              id={`v2-evidence-tab-${pane}`}
              aria-selected={mobilePane === pane}
              aria-controls={`v2-evidence-panel-${pane}`}
              onClick={() => setMobilePane(pane)}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="v2-evidence-layout" data-mobile-pane={mobilePane}>
        <aside
          className="v2-evidence-analysis"
          id="v2-evidence-panel-analysis"
          role="tabpanel"
          aria-labelledby="v2-evidence-tab-analysis"
        >
          <div className="v2-evidence-pane-heading">
            <div>
              <h2>Análisis trazable</h2>
              <p>{claims.length} claims · selecciona uno para localizar su fuente</p>
            </div>
            <LocateFixed aria-hidden="true" />
          </div>

          {claims.length ? (
            <div className="v2-evidence-claim-list" aria-label="Claims del dossier">
              {claims.map((claim) => {
                const effectiveStatus = reviewOverrides[claim.id] ?? claim.status
                const statusLabel = effectiveStatus === 'flagged'
                  ? 'Marcada para revisar'
                  : claimStateCopy[effectiveStatus]
                return (
                  <button
                    type="button"
                    key={claim.id}
                    className="v2-evidence-claim"
                    data-selected={claim.id === selectedClaim?.id}
                    data-status={effectiveStatus}
                    aria-current={claim.id === selectedClaim?.id ? 'true' : undefined}
                    onClick={() => selectClaim(claim)}
                  >
                    <span className="v2-evidence-claim-category">{categoryCopy[claim.category]}</span>
                    <strong>{claim.label}</strong>
                    <span className="v2-evidence-claim-value">{claim.value}</span>
                    <span className="v2-evidence-claim-state">
                      <ClaimStateIcon status={effectiveStatus === 'flagged' ? 'stale' : effectiveStatus} />
                      {statusLabel}
                    </span>
                    <small>{claim.pointer ? `p. ${claim.pointer.page}${claim.pointer.section ? ` · ${claim.pointer.section}` : ''}` : 'Cita ausente'}</small>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="v2-evidence-claim-empty">
              <CircleDashed aria-hidden="true" />
              <h3>Aún no hay claims extraídos</h3>
              <p>El documento puede leerse y buscarse, pero ninguna afirmación debe presentarse como verificada.</p>
            </div>
          )}

          {sourceMismatch ? (
            <div className="v2-evidence-inline-alert" role="status">
              <AlertTriangle aria-hidden="true" />
              <p>La cita pertenece a otra revisión. Ábrela antes de confirmar este claim.</p>
            </div>
          ) : null}

          <div className="v2-evidence-desktop-review">{reviewControls}</div>
        </aside>

        <div
          className="v2-evidence-splitter"
          role="separator"
          tabIndex={0}
          aria-label="Cambiar ancho entre análisis y documento"
          aria-orientation="vertical"
          aria-valuemin={34}
          aria-valuemax={56}
          aria-valuenow={Math.round(analysisWidth)}
          onKeyDown={handleSplitterKeyDown}
          onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
          onPointerMove={resizeWithPointer}
        ><span /></div>

        <section
          className="v2-evidence-document"
          id="v2-evidence-panel-document"
          role="tabpanel"
          aria-labelledby="v2-evidence-tab-document"
        >
          <header className="v2-evidence-document-header">
            <div>
              <span>{document.source} · {document.role}</span>
              <h2>{document.title}</h2>
              <p>{document.reference} · revisión {document.revisionId.slice(0, 10)}</p>
            </div>
            <div className="v2-evidence-document-facts">
              <span>{document.format.toUpperCase()}</span>
              <span>{document.publishedAt ?? 'Fecha por verificar'}</span>
              <span>{document.renderState === 'fallback' ? 'Lectura extraída' : 'Documento local'}</span>
            </div>
          </header>

          <div className="v2-evidence-toolbar" aria-label="Controles del documento">
            <div className="v2-evidence-page-controls">
              <button type="button" aria-label="Página anterior" onClick={() => setPageNumber((value) => Math.max(1, value - 1))} disabled={pageNumber <= 1}>
                <ChevronLeft aria-hidden="true" />
              </button>
              <label>Página <input type="number" min={1} max={totalPages} value={pageNumber} onChange={(event) => setPageNumber(clamp(Number(event.target.value) || 1, 1, totalPages))} /> de {totalPages}</label>
              <button type="button" aria-label="Página siguiente" onClick={() => setPageNumber((value) => Math.min(totalPages, value + 1))} disabled={pageNumber >= totalPages}>
                <ChevronRight aria-hidden="true" />
              </button>
            </div>

            <div className="v2-evidence-search">
              <Search aria-hidden="true" />
              <label className="sr-only" htmlFor="v2-evidence-search-input">Buscar en el documento</label>
              <input
                id="v2-evidence-search-input"
                type="search"
                value={searchQuery}
                placeholder="Buscar texto oficial…"
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') runSearch(1) }}
              />
              <button type="button" onClick={() => runSearch(-1)} aria-label="Coincidencia anterior" disabled={!searchMatches.length}><ChevronLeft aria-hidden="true" /></button>
              <button type="button" onClick={() => runSearch(1)} aria-label="Coincidencia siguiente"><ChevronRight aria-hidden="true" /></button>
              <span aria-hidden="true">{searchQuery.trim() ? `${searchMatches.length} pág.` : '—'}</span>
            </div>

            <div className="v2-evidence-zoom-controls">
              <button type="button" aria-label="Alejar documento" onClick={() => setZoom((value) => Math.max(75, value - 10))} disabled={zoom <= 75}><Minus aria-hidden="true" /></button>
              <output aria-label="Zoom del documento">{zoom} %</output>
              <button type="button" aria-label="Acercar documento" onClick={() => setZoom((value) => Math.min(160, value + 10))} disabled={zoom >= 160}><Plus aria-hidden="true" /></button>
            </div>
          </div>

          {document.renderState === 'fallback' ? (
            <div className="v2-evidence-fallback-note" role="status">
              <AlertTriangle aria-hidden="true" />
              <p><strong>Lectura de respaldo</strong>{document.fallbackReason ?? 'El original no puede mostrarse integrado; se usa el texto oficial extraído.'}</p>
            </div>
          ) : null}

          <div className="v2-evidence-page-stage">
            {noRenderablePage ? (
              <div className="v2-evidence-document-empty">
                <FileSearch aria-hidden="true" />
                <h3>Esta página no está disponible en la copia local</h3>
                <p>{document.fallbackReason ?? 'Conservamos la referencia y la cita para que puedas contrastarlas en la fuente oficial.'}</p>
                {selectedClaim?.pointer?.quote ? <blockquote>{selectedClaim.pointer.quote}</blockquote> : null}
                {onOpenOfficialSource ? (
                  <button type="button" onClick={() => onOpenOfficialSource(document)}>
                    Abrir fuente oficial
                  </button>
                ) : null}
              </div>
            ) : (
              <article
                className="v2-evidence-paper"
                aria-label={`Página ${pageNumber} de ${totalPages}`}
                style={{ '--v2-document-zoom': zoom / 100 } as CSSProperties}
              >
                {currentPage.previewSrc ? (
                  <img src={currentPage.previewSrc} alt={currentPage.alt ?? `Vista de la página ${pageNumber}`} />
                ) : null}
                <div className="v2-evidence-paper-text">
                  <Passage text={currentPage.text} quote={activeQuote} passageRef={passageRef} />
                </div>
                {highlightMode === 'claim' && claimQuote && !currentPage.text.toLocaleLowerCase('es').includes(claimQuote.toLocaleLowerCase('es')) ? (
                  <aside className="v2-evidence-unanchored" role="status">
                    <AlertTriangle aria-hidden="true" />
                    <p><strong>Cita no reanclada en esta revisión</strong>{claimQuote}</p>
                  </aside>
                ) : null}
                <footer>{document.reference} · página {pageNumber}</footer>
              </article>
            )}
          </div>
        </section>

        <aside
          className="v2-evidence-mobile-actions"
          id="v2-evidence-panel-actions"
          role="tabpanel"
          aria-labelledby="v2-evidence-tab-actions"
        >
          <div className="v2-evidence-pane-heading">
            <div><h2>Acciones de revisión</h2><p>Confirmaciones válidas solo para esta sesión.</p></div>
            <ShieldCheck aria-hidden="true" />
          </div>
          {reviewControls}
        </aside>
      </div>
    </section>
  )
}

export type { EvidenceWorkspaceProps } from './EvidenceWorkspace.types'
