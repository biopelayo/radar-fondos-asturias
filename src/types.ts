export type OpportunityKind =
  | 'subvención'
  | 'autoempleo'
  | 'licitación'
  | 'financiación'
  | 'premio'

export type RequirementState = 'cumple' | 'pendiente' | 'bloqueo' | 'desconocido'

export interface Requirement {
  id: string
  label: string
  state: RequirementState
  evidence?: string
}

export interface Evidence {
  id: string
  source: string
  label: string
  date: string
  verified: boolean
  url: string
}

export interface Opportunity {
  id: string
  title: string
  issuer: string
  source: string
  sourceRef: string
  sourceUrl: string
  kind: OpportunityKind
  territory: string
  publishedAt: string
  deadline: string
  deadlineVerified?: boolean
  amount: number
  aidIntensity?: string
  score: number
  state: 'nueva' | 'analizando' | 'guardada' | 'preparando' | 'bloqueada'
  summary: string
  fitReasons: string[]
  blockers: string[]
  requirements: Requirement[]
  evidence: Evidence[]
  tags: string[]
  demo: boolean
}

export interface PrivateProfile {
  displayName: string
  residence: string
  territories: string
  situation: string
  sectors: string
  languages: string
  investmentCeiling: string
  incomeGoal: string
  notes: string
}

export interface ApplicationRecord {
  opportunityId: string
  stage: 'preseleccionada' | 'preparando' | 'presentada' | 'concedida' | 'denegada'
  createdAt: string
}
