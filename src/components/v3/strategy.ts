import type { Opportunity, SourceRecord } from '../../domain/v2'
import type { PrivateProfile } from '../../types'

export type StrategyGoal = 'cash' | 'business' | 'research' | 'balanced'

export const strategyGoals: Array<{ id: StrategyGoal; label: string; description: string }> = [
  { id: 'cash', label: 'Ingresos rápidos', description: 'Prioriza vías directas y plazos próximos verificables.' },
  { id: 'business', label: 'Crear negocio', description: 'Busca ayudas de inversión, autoempleo y demanda pública.' },
  { id: 'research', label: 'Ciencia y datos', description: 'Eleva investigación, biomedicina, IA y consorcios.' },
  { id: 'balanced', label: 'Cartera equilibrada', description: 'Combina liquidez, activos y proyectos de mayor recorrido.' },
]

export interface StrategyCandidate {
  opportunity: Opportunity
  sourceRecord?: SourceRecord
  title: string
  sourceLabel: string
  strategicScore: number
  fitScore: number
  evidenceScore: number
  publishedCapital?: number
  deadline?: string
  deadlineVerified: boolean
  daysLeft?: number
  route: 'direct' | 'consortium' | 'supplier' | 'verify'
  routeLabel: string
  fitReasons: string[]
  blockers: string[]
  nextActions: string[]
}

const familyWeights: Record<StrategyGoal, Record<Opportunity['family'], number>> = {
  cash: { grant: 20, self_employment: 25, procurement: 12, loan: 3, guarantee: 5, prize: 10, accelerator: 8 },
  business: { grant: 18, self_employment: 22, procurement: 19, loan: 11, guarantee: 12, prize: 8, accelerator: 16 },
  research: { grant: 20, self_employment: 8, procurement: 17, loan: 4, guarantee: 4, prize: 13, accelerator: 15 },
  balanced: { grant: 18, self_employment: 18, procurement: 17, loan: 9, guarantee: 10, prize: 11, accelerator: 13 },
}

const stopWords = new Set(['para', 'como', 'desde', 'hasta', 'entre', 'sobre', 'solo', 'este', 'esta', 'todo', 'toda'])

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')
}

function terms(value: string) {
  return Array.from(new Set(normalize(value).split(/[^a-z0-9+]+/).filter((term) => term.length >= 4 && !stopWords.has(term))))
}

export function opportunityTitle(opportunity: Opportunity) {
  return opportunity.titles.find((item) => item.language.startsWith('es'))?.value
    ?? opportunity.titles[0]?.value
    ?? opportunity.canonicalReference
}

function getDeadline(opportunity: Opportunity) {
  const verified = opportunity.applicationWindows
    .filter((window) => window.verified && window.closesAt)
    .sort((left, right) => String(left.closesAt).localeCompare(String(right.closesAt)))[0]
  if (!verified?.closesAt) return { verified: false as const }
  const milliseconds = Date.parse(verified.closesAt) - Date.now()
  return {
    verified: true as const,
    value: verified.closesAt,
    daysLeft: Math.ceil(milliseconds / 86_400_000),
  }
}

function resolveRoute(opportunity: Opportunity) {
  if (opportunity.family === 'procurement') {
    return { route: 'supplier' as const, label: 'Proveedor o socio', reason: 'La contratación exige solvencia y capacidad de ejecución.' }
  }
  if (opportunity.geography.scope === 'eu') {
    return { route: 'consortium' as const, label: 'Consorcio europeo', reason: 'La vía europea suele requerir socios, alcance y preparación coordinada.' }
  }
  if (opportunity.geography.regionCodes.includes('ES-AS') && ['grant', 'self_employment', 'prize'].includes(opportunity.family)) {
    return { route: 'direct' as const, label: 'Solicitud directa', reason: 'La geografía y el tipo permiten estudiar una candidatura propia.' }
  }
  return { route: 'verify' as const, label: 'Verificar acceso', reason: 'Faltan reglas suficientes para definir la vía de entrada.' }
}

function goalSignals(goal: StrategyGoal) {
  if (goal === 'research') return ['investigacion', 'ciencia', 'datos', 'inteligencia', 'biomedicina', 'genomica', 'bioinformatica', 'doctorado']
  if (goal === 'business') return ['empresa', 'autonom', 'inversion', 'digital', 'turismo', 'comercio', 'alojamiento']
  if (goal === 'cash') return ['subvencion', 'beca', 'premio', 'servicio', 'contrato', 'ayuda']
  return ['subvencion', 'empresa', 'investigacion', 'turismo', 'digital', 'contrato']
}

function looksLikeAdministrativeNoise(title: string) {
  const normalizedTitle = normalize(title)
  return [
    'convocatoria para proveer',
    'se resuelve la convocatoria',
    'libre designacion',
    'pruebas selectivas',
    'se somete a informacion publica',
    'declaracion de utilidad publica',
  ].some((signal) => normalizedTitle.includes(signal))
}

export function buildStrategyCandidates(
  opportunities: Opportunity[],
  sourceRecords: SourceRecord[],
  profile: PrivateProfile,
  goal: StrategyGoal,
) {
  const sources = new Map(sourceRecords.map((item) => [item.id, item]))
  const profileTerms = terms(`${profile.residence} ${profile.territories} ${profile.situation} ${profile.sectors} ${profile.languages} ${profile.notes}`)
  const goalTerms = goalSignals(goal)
  return opportunities
    .filter((item) => item.lifecycleStatus === 'open' || item.lifecycleStatus === 'upcoming' || item.lifecycleStatus === 'extended')
    .map((opportunity): StrategyCandidate => {
      const title = opportunityTitle(opportunity)
      const haystack = normalize(`${title} ${opportunity.authority.name} ${opportunity.geography.executionPlaces.join(' ')} ${opportunity.eligibleActivities.join(' ')}`)
      const matchedProfile = profileTerms.filter((term) => haystack.includes(term))
      const matchedGoal = goalTerms.filter((term) => haystack.includes(term))
      const asturias = opportunity.geography.regionCodes.includes('ES-AS') || haystack.includes('asturias')
      const sourceRecord = sources.get(opportunity.sourceRecordIds[0])
      const route = resolveRoute(opportunity)
      const deadline = getDeadline(opportunity)
      const evidenceScore = Math.round(opportunity.quality.evidenceCoverage * 100)
      const fitScore = Math.min(100, 18 + (asturias ? 25 : opportunity.geography.countryCodes.includes('ES') ? 12 : 8) + Math.min(30, matchedProfile.length * 4) + Math.min(18, matchedGoal.length * 3))
      const deadlineBoost = deadline.verified && deadline.daysLeft >= 0 && deadline.daysLeft <= 30 ? 8 : 0
      const qualityBoost = Math.round(opportunity.quality.completeness * 8) + (evidenceScore >= 60 ? 6 : 0)
      const administrativeNoise = looksLikeAdministrativeNoise(title)
      const strategicScore = Math.max(0, Math.min(99, Math.round(fitScore * .52 + familyWeights[goal][opportunity.family] + qualityBoost + deadlineBoost - (administrativeNoise ? 24 : 0))))
      const publishedCapital = opportunity.finance.applicantMaximum ?? opportunity.finance.programmeBudget
      const fitReasons = [
        asturias ? 'Ejecución o autoridad vinculada a Asturias.' : 'Admite análisis desde España o desde un marco europeo.',
        matchedProfile.length ? `Coincide con tu perfil: ${matchedProfile.slice(0, 4).join(', ')}.` : 'No hay coincidencias suficientes con el perfil privado todavía.',
        route.reason,
      ]
      const blockers = [
        ...(opportunity.beneficiaryClasses.length ? [] : ['Beneficiarios todavía sin evidencia citable.']),
        ...(opportunity.quality.evidenceCoverage > 0 ? [] : ['No hay claims documentales verificados.']),
        ...(deadline.verified ? [] : ['Plazo oficial pendiente de extracción documental.']),
        ...(administrativeNoise ? ['El título parece un trámite administrativo, no una vía directa de financiación.'] : []),
        ...opportunity.incompatibilities.slice(0, 2),
      ]
      const nextActions = [
        'Abrir la fuente oficial y localizar bases, anexos y vía de presentación.',
        'Confirmar beneficiarios, territorio, gastos elegibles y compatibilidades.',
        route.route === 'supplier' ? 'Identificar proveedor principal o socio con solvencia acreditable.'
          : route.route === 'consortium' ? 'Definir rol propio y buscar socios con capacidad complementaria.'
            : 'Contrastar el proyecto con tu perfil y reservar los documentos exigidos.',
      ]
      return {
        opportunity,
        sourceRecord,
        title,
        sourceLabel: sourceRecord?.sourceKey.toUpperCase() ?? 'OFICIAL',
        strategicScore,
        fitScore,
        evidenceScore,
        publishedCapital,
        deadline: deadline.value,
        deadlineVerified: deadline.verified,
        daysLeft: deadline.daysLeft,
        route: route.route,
        routeLabel: route.label,
        fitReasons,
        blockers: Array.from(new Set(blockers)),
        nextActions,
      }
    })
    .sort((left, right) => right.strategicScore - left.strategicScore || right.fitScore - left.fitScore || left.title.localeCompare(right.title, 'es'))
}

export function profileCompletion(profile: PrivateProfile) {
  const fields = Object.values(profile)
  return Math.round(fields.filter((value) => value.trim()).length / fields.length * 100)
}

export function parsePrivateAmount(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}
