export const V2_SCHEMA_VERSION = '2.0.0' as const

export type SchemaVersion = typeof V2_SCHEMA_VERSION
export type ISODateTime = string
export type ISODate = string
export type Sha256 = `sha256:${string}`
export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type OpportunityId = `opp:${string}`
export type OpportunityVersionId = `oppver:${string}`
export type SourceRecordId = `src:${string}`
export type DocumentId = `doc:${string}`
export type DocumentRevisionId = `docrev:${string}`
export type ClaimId = `claim:${string}`
export type ChangeEventId = `change:${string}`
export type SourceHealthId = `health:${string}`

export interface Provenance {
  sourceRecordIds: SourceRecordId[]
  documentRevisionIds: DocumentRevisionId[]
  claimIds: ClaimId[]
  resolverVersion: string
  derivedAt: ISODateTime
}

export interface LocalizedText {
  language: string
  value: string
}

export interface Authority {
  id: string
  name: string
  level: 'local' | 'regional' | 'national' | 'eu' | 'international'
  countryCode?: string
}

export type OpportunityFamily =
  | 'grant'
  | 'self_employment'
  | 'procurement'
  | 'loan'
  | 'guarantee'
  | 'prize'
  | 'accelerator'

export type LifecycleStatus =
  | 'upcoming'
  | 'open'
  | 'suspended'
  | 'extended'
  | 'closed'
  | 'cancelled'
  | 'awarded'

export interface ApplicationWindow {
  id: string
  opensAt?: ISODateTime
  closesAt?: ISODateTime
  timeZone: string
  mode: 'absolute' | 'relative' | 'unknown'
  verified: boolean
  relativeRule?: string
}

export interface FinancialStructure {
  currency: string
  programmeBudget?: number
  applicantMinimum?: number
  applicantMaximum?: number
  aidIntensityPercent?: number
  eligibleCostNotes: string[]
  repayableAmount?: number
  nonRepayableAmount?: number
}

export interface SubmissionRoute {
  officialUrl: string
  channel: 'electronic' | 'in_person' | 'mixed' | 'unknown'
  registry?: string
  electronicSignatureRequired?: boolean
}

export interface OpportunityQuality {
  completeness: number
  evidenceCoverage: number
  conflictCount: number
  reviewStatus: 'unreviewed' | 'needs_review' | 'reviewed'
}

export interface Opportunity {
  schemaVersion: SchemaVersion
  id: OpportunityId
  canonicalReference: string
  family: OpportunityFamily
  titles: LocalizedText[]
  authority: Authority
  geography: {
    scope: 'local' | 'regional' | 'national' | 'eu' | 'international'
    countryCodes: string[]
    regionCodes: string[]
    executionPlaces: string[]
  }
  lifecycleStatus: LifecycleStatus
  applicationWindows: ApplicationWindow[]
  finance: FinancialStructure
  beneficiaryClasses: string[]
  eligibleActivities: string[]
  excludedActivities: string[]
  incompatibilities: string[]
  aidRegime?: string
  submission: SubmissionRoute
  sourceRecordIds: SourceRecordId[]
  documentRevisionIds: DocumentRevisionId[]
  relatedOpportunityIds: OpportunityId[]
  currentVersionId: OpportunityVersionId
  quality: OpportunityQuality
  provenance: Provenance
}

export interface SourceRecord {
  schemaVersion: SchemaVersion
  id: SourceRecordId
  sourceKey: string
  externalId: string
  canonicalUrl: string
  retrievedUrl: string
  firstObservedAt: ISODateTime
  lastObservedAt: ISODateTime
  publishedAt?: ISODateTime
  updatedAt?: ISODateTime
  contentHash?: Sha256
  http: {
    status: number
    etag?: string
    lastModified?: string
    contentType?: string
  }
  adapter: {
    name: string
    version: string
    schemaVersion: string
  }
  externalReferences: string[]
  retrieval: {
    status: 'ok' | 'not_modified' | 'error'
    checkedAt: ISODateTime
    error?: {
      code: string
      message: string
      retryable: boolean
    }
  }
}

export type DocumentRole =
  | 'regulatory_basis'
  | 'call'
  | 'correction'
  | 'extension'
  | 'form'
  | 'guide'
  | 'submission_instructions'
  | 'resolution'
  | 'procurement_admin_spec'
  | 'procurement_technical_spec'
  | 'procurement_notice'
  | 'award_notice'

export type DocumentRelationType =
  | 'basis_of'
  | 'calls'
  | 'corrects'
  | 'extends'
  | 'replaces'
  | 'annexes'
  | 'instructs'
  | 'resolves'

export interface Document {
  schemaVersion: SchemaVersion
  id: DocumentId
  revisionId: DocumentRevisionId
  officialUrl: string
  role: DocumentRole
  mimeType: string
  language: string
  publishedAt?: ISODateTime
  byteSize?: number
  sha256: Sha256
  extraction: {
    method: 'native_text' | 'html' | 'ocr' | 'manual' | 'none'
    version: string
    pageCount?: number
    quality?: number
  }
  relations: Array<{
    type: DocumentRelationType
    targetDocumentId: DocumentId
    targetRevisionId?: DocumentRevisionId
  }>
  sourceRecordIds: SourceRecordId[]
  dependentClaimIds: ClaimId[]
}

export interface EvidencePointer {
  documentRevisionId: DocumentRevisionId
  page: number
  fragment: string
  startOffset?: number
  endOffset?: number
  selector?: string
  quoteHash?: Sha256
}

export interface Claim<T extends JsonValue = JsonValue> {
  schemaVersion: SchemaVersion
  id: ClaimId
  opportunityId: OpportunityId
  opportunityVersionId?: OpportunityVersionId
  path: string
  valueType: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'money' | 'list' | 'object' | 'null'
  value: T
  extraction: {
    method: 'api' | 'rule' | 'native_text' | 'ocr' | 'manual' | 'inference'
    version: string
  }
  confidence: number
  evidence: EvidencePointer[]
  reviewStatus: 'unreviewed' | 'confirmed' | 'rejected' | 'conflict' | 'needs_review'
  alternatives: JsonValue[]
  conflict: boolean
  effectiveAt?: ISODateTime
}

export interface FieldChange {
  path: string
  kind: 'added' | 'removed' | 'changed'
  previous?: JsonValue
  current?: JsonValue
  material: boolean
}

export interface OpportunityVersion {
  schemaVersion: SchemaVersion
  id: OpportunityVersionId
  opportunityId: OpportunityId
  sequence: number
  contentHash: Sha256
  observedAt: ISODateTime
  effectiveAt?: ISODateTime
  previousVersionId?: OpportunityVersionId
  snapshot: Opportunity
  sourceRecordIds: SourceRecordId[]
  documentRevisionIds: DocumentRevisionId[]
  claimIds: ClaimId[]
  semanticDiff: FieldChange[]
  precedenceRuleVersion: string
}

export interface ChangeEvent {
  schemaVersion: SchemaVersion
  id: ChangeEventId
  opportunityId: OpportunityId
  fromVersionId?: OpportunityVersionId
  toVersionId: OpportunityVersionId
  classification: 'informational' | 'material' | 'urgent' | 'closure'
  changedPaths: string[]
  summary: string
  observedAt: ISODateTime
  effectiveAt?: ISODateTime
  sourceRecordIds: SourceRecordId[]
  documentRevisionIds: DocumentRevisionId[]
}

export interface SourceHealth {
  schemaVersion: SchemaVersion
  id: SourceHealthId
  sourceKey: string
  status: 'healthy' | 'degraded' | 'stale' | 'down'
  checkedAt: ISODateTime
  lastSuccessAt?: ISODateTime
  recordCount: number
  consecutiveFailures: number
  latencyMs?: number
  error?: {
    code: string
    message: string
    retryable: boolean
  }
}
