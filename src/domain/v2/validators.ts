import {
  V2_SCHEMA_VERSION,
  type ChangeEvent,
  type Claim,
  type Document,
  type EvidencePointer,
  type Opportunity,
  type OpportunityVersion,
  type Provenance,
  type SourceHealth,
  type SourceRecord,
} from './types'

export interface ValidationIssue {
  path: string
  message: string
}

export type ValidationResult<T> =
  | { ok: true; value: T; issues: [] }
  | { ok: false; issues: ValidationIssue[] }

type UnknownRecord = Record<string, unknown>

const ID_PATTERNS = {
  opportunity: /^opp:[a-z0-9][a-z0-9._:-]*$/,
  opportunityVersion: /^oppver:sha256:[a-f0-9]{64}$/,
  sourceRecord: /^src:[a-z0-9][a-z0-9._:-]*$/,
  document: /^doc:[a-z0-9][a-z0-9._:-]*$/,
  documentRevision: /^docrev:sha256:[a-f0-9]{64}$/,
  claim: /^claim:[a-z0-9][a-z0-9._:-]*$/,
  change: /^change:[a-z0-9][a-z0-9._:-]*$/,
  sourceHealth: /^health:[a-z0-9][a-z0-9._:-]*$/,
  sha256: /^sha256:[a-f0-9]{64}$/,
} as const

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function issue(issues: ValidationIssue[], path: string, message: string) {
  issues.push({ path, message })
}

function stringField(
  record: UnknownRecord,
  key: string,
  issues: ValidationIssue[],
  pattern?: RegExp,
) {
  const value = record[key]
  if (typeof value !== 'string' || value.length === 0) {
    issue(issues, `$.${key}`, 'must be a non-empty string')
  } else if (pattern && !pattern.test(value)) {
    issue(issues, `$.${key}`, 'has an invalid canonical format')
  }
}

function timestampField(record: UnknownRecord, key: string, issues: ValidationIssue[], optional = false) {
  const value = record[key]
  if (optional && value === undefined) return
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    issue(issues, `$.${key}`, 'must be an ISO date-time')
  }
}

function numberField(
  record: UnknownRecord,
  key: string,
  issues: ValidationIssue[],
  options: { integer?: boolean; minimum?: number; maximum?: number; optional?: boolean } = {},
) {
  const value = record[key]
  if (options.optional && value === undefined) return
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issue(issues, `$.${key}`, 'must be a finite number')
    return
  }
  if (options.integer && !Number.isInteger(value)) issue(issues, `$.${key}`, 'must be an integer')
  if (options.minimum !== undefined && value < options.minimum) issue(issues, `$.${key}`, `must be >= ${options.minimum}`)
  if (options.maximum !== undefined && value > options.maximum) issue(issues, `$.${key}`, `must be <= ${options.maximum}`)
}

function enumField(record: UnknownRecord, key: string, allowed: readonly string[], issues: ValidationIssue[]) {
  if (typeof record[key] !== 'string' || !allowed.includes(record[key])) {
    issue(issues, `$.${key}`, `must be one of: ${allowed.join(', ')}`)
  }
}

function stringArray(
  record: UnknownRecord,
  key: string,
  issues: ValidationIssue[],
  pattern?: RegExp,
  minimum = 0,
) {
  const value = record[key]
  if (!Array.isArray(value) || value.length < minimum) {
    issue(issues, `$.${key}`, `must be an array with at least ${minimum} item(s)`)
    return
  }
  value.forEach((item, index) => {
    if (typeof item !== 'string' || item.length === 0 || (pattern ? !pattern.test(item) : false)) {
      issue(issues, `$.${key}[${index}]`, 'has an invalid value')
    }
  })
  if (new Set(value).size !== value.length) issue(issues, `$.${key}`, 'must contain unique values')
}

function baseRecord(value: unknown, issues: ValidationIssue[]): UnknownRecord | undefined {
  if (!isRecord(value)) {
    issue(issues, '$', 'must be an object')
    return undefined
  }
  if (value.schemaVersion !== V2_SCHEMA_VERSION) {
    issue(issues, '$.schemaVersion', `must equal ${V2_SCHEMA_VERSION}`)
  }
  return value
}

function finish<T>(value: unknown, issues: ValidationIssue[]): ValidationResult<T> {
  return issues.length
    ? { ok: false, issues }
    : { ok: true, value: value as T, issues: [] }
}

function validateProvenance(value: unknown, path: string, issues: ValidationIssue[]) {
  if (!isRecord(value)) {
    issue(issues, path, 'must be a provenance object')
    return
  }
  const local: ValidationIssue[] = []
  stringArray(value, 'sourceRecordIds', local, ID_PATTERNS.sourceRecord, 1)
  stringArray(value, 'documentRevisionIds', local, ID_PATTERNS.documentRevision)
  stringArray(value, 'claimIds', local, ID_PATTERNS.claim)
  stringField(value, 'resolverVersion', local)
  timestampField(value, 'derivedAt', local)
  local.forEach((entry) => issue(issues, `${path}${entry.path.slice(1)}`, entry.message))
}

function validateEvidence(value: unknown, path: string, issues: ValidationIssue[]) {
  if (!isRecord(value)) {
    issue(issues, path, 'must be an evidence pointer')
    return
  }
  const revision = value.documentRevisionId
  if (typeof revision !== 'string' || !ID_PATTERNS.documentRevision.test(revision)) {
    issue(issues, `${path}.documentRevisionId`, 'must be a document revision ID')
  }
  if (!Number.isInteger(value.page) || (value.page as number) < 1) {
    issue(issues, `${path}.page`, 'must be a one-based page number')
  }
  if (typeof value.fragment !== 'string' || value.fragment.trim().length === 0) {
    issue(issues, `${path}.fragment`, 'must be a non-empty source fragment')
  }
  if (value.quoteHash !== undefined && (typeof value.quoteHash !== 'string' || !ID_PATTERNS.sha256.test(value.quoteHash))) {
    issue(issues, `${path}.quoteHash`, 'must be a SHA-256 value')
  }
}

export function validateOpportunity(value: unknown): ValidationResult<Opportunity> {
  const issues: ValidationIssue[] = []
  const record = baseRecord(value, issues)
  if (!record) return finish(value, issues)
  stringField(record, 'id', issues, ID_PATTERNS.opportunity)
  stringField(record, 'canonicalReference', issues)
  stringField(record, 'currentVersionId', issues, ID_PATTERNS.opportunityVersion)
  enumField(record, 'family', ['grant', 'self_employment', 'procurement', 'loan', 'guarantee', 'prize', 'accelerator'], issues)
  enumField(record, 'lifecycleStatus', ['upcoming', 'open', 'suspended', 'extended', 'closed', 'cancelled', 'awarded'], issues)
  stringArray(record, 'sourceRecordIds', issues, ID_PATTERNS.sourceRecord, 1)
  stringArray(record, 'documentRevisionIds', issues, ID_PATTERNS.documentRevision)
  stringArray(record, 'relatedOpportunityIds', issues, ID_PATTERNS.opportunity)
  stringArray(record, 'beneficiaryClasses', issues)
  stringArray(record, 'eligibleActivities', issues)
  stringArray(record, 'excludedActivities', issues)
  stringArray(record, 'incompatibilities', issues)
  if (!Array.isArray(record.titles) || record.titles.length === 0) issue(issues, '$.titles', 'must contain at least one localized title')
  if (!isRecord(record.authority)) issue(issues, '$.authority', 'must be an authority object')
  if (!isRecord(record.geography)) issue(issues, '$.geography', 'must be a geography object')
  if (!Array.isArray(record.applicationWindows)) issue(issues, '$.applicationWindows', 'must be an array')
  if (!isRecord(record.finance)) issue(issues, '$.finance', 'must be a finance object')
  if (!isRecord(record.submission)) issue(issues, '$.submission', 'must be a submission route')
  if (!isRecord(record.quality)) {
    issue(issues, '$.quality', 'must be a quality object')
  } else {
    numberField(record.quality, 'completeness', issues, { minimum: 0, maximum: 1 })
    numberField(record.quality, 'evidenceCoverage', issues, { minimum: 0, maximum: 1 })
    numberField(record.quality, 'conflictCount', issues, { integer: true, minimum: 0 })
  }
  validateProvenance(record.provenance, '$.provenance', issues)
  return finish(value, issues)
}

export function validateSourceRecord(value: unknown): ValidationResult<SourceRecord> {
  const issues: ValidationIssue[] = []
  const record = baseRecord(value, issues)
  if (!record) return finish(value, issues)
  stringField(record, 'id', issues, ID_PATTERNS.sourceRecord)
  stringField(record, 'sourceKey', issues)
  stringField(record, 'externalId', issues)
  stringField(record, 'canonicalUrl', issues, /^https:\/\//)
  stringField(record, 'retrievedUrl', issues, /^https:\/\//)
  timestampField(record, 'firstObservedAt', issues)
  timestampField(record, 'lastObservedAt', issues)
  timestampField(record, 'publishedAt', issues, true)
  timestampField(record, 'updatedAt', issues, true)
  if (record.contentHash !== undefined && (typeof record.contentHash !== 'string' || !ID_PATTERNS.sha256.test(record.contentHash))) {
    issue(issues, '$.contentHash', 'must be a SHA-256 value')
  }
  if (!isRecord(record.http)) issue(issues, '$.http', 'must contain HTTP metadata')
  if (!isRecord(record.adapter)) issue(issues, '$.adapter', 'must identify the adapter and version')
  stringArray(record, 'externalReferences', issues)
  if (!isRecord(record.retrieval)) {
    issue(issues, '$.retrieval', 'must be a retrieval object')
  } else {
    enumField(record.retrieval, 'status', ['ok', 'not_modified', 'error'], issues)
    timestampField(record.retrieval, 'checkedAt', issues)
    if (record.retrieval.status === 'error' && !isRecord(record.retrieval.error)) {
      issue(issues, '$.retrieval.error', 'is required for failed retrievals')
    }
  }
  if (typeof record.id === 'string' && typeof record.sourceKey === 'string' && !record.id.startsWith(`src:${record.sourceKey}:`)) {
    issue(issues, '$.id', 'must be namespaced by sourceKey')
  }
  return finish(value, issues)
}

export function validateDocument(value: unknown): ValidationResult<Document> {
  const issues: ValidationIssue[] = []
  const record = baseRecord(value, issues)
  if (!record) return finish(value, issues)
  stringField(record, 'id', issues, ID_PATTERNS.document)
  stringField(record, 'revisionId', issues, ID_PATTERNS.documentRevision)
  stringField(record, 'officialUrl', issues, /^https:\/\//)
  stringField(record, 'mimeType', issues)
  stringField(record, 'language', issues)
  stringField(record, 'sha256', issues, ID_PATTERNS.sha256)
  enumField(record, 'role', ['regulatory_basis', 'call', 'correction', 'extension', 'form', 'guide', 'submission_instructions', 'resolution', 'procurement_admin_spec', 'procurement_technical_spec', 'procurement_notice', 'award_notice'], issues)
  timestampField(record, 'publishedAt', issues, true)
  numberField(record, 'byteSize', issues, { integer: true, minimum: 0, optional: true })
  if (!isRecord(record.extraction)) issue(issues, '$.extraction', 'must describe extraction')
  if (!Array.isArray(record.relations)) issue(issues, '$.relations', 'must be an array')
  stringArray(record, 'sourceRecordIds', issues, ID_PATTERNS.sourceRecord, 1)
  stringArray(record, 'dependentClaimIds', issues, ID_PATTERNS.claim)
  if (typeof record.sha256 === 'string' && record.revisionId !== `docrev:${record.sha256}`) {
    issue(issues, '$.revisionId', 'must be derived from sha256')
  }
  return finish(value, issues)
}

export function validateClaim(value: unknown): ValidationResult<Claim> {
  const issues: ValidationIssue[] = []
  const record = baseRecord(value, issues)
  if (!record) return finish(value, issues)
  stringField(record, 'id', issues, ID_PATTERNS.claim)
  stringField(record, 'opportunityId', issues, ID_PATTERNS.opportunity)
  if (record.opportunityVersionId !== undefined && (typeof record.opportunityVersionId !== 'string' || !ID_PATTERNS.opportunityVersion.test(record.opportunityVersionId))) {
    issue(issues, '$.opportunityVersionId', 'must be an opportunity version ID')
  }
  stringField(record, 'path', issues, /^\//)
  enumField(record, 'valueType', ['string', 'number', 'boolean', 'date', 'datetime', 'money', 'list', 'object', 'null'], issues)
  numberField(record, 'confidence', issues, { minimum: 0, maximum: 1 })
  enumField(record, 'reviewStatus', ['unreviewed', 'confirmed', 'rejected', 'conflict', 'needs_review'], issues)
  if (!isRecord(record.extraction)) issue(issues, '$.extraction', 'must describe extraction')
  if (!Array.isArray(record.evidence) || record.evidence.length === 0) {
    issue(issues, '$.evidence', 'must contain at least one evidence pointer')
  } else {
    record.evidence.forEach((entry, index) => validateEvidence(entry, `$.evidence[${index}]`, issues))
  }
  if (!Array.isArray(record.alternatives)) issue(issues, '$.alternatives', 'must be an array')
  if (typeof record.conflict !== 'boolean') issue(issues, '$.conflict', 'must be boolean')
  timestampField(record, 'effectiveAt', issues, true)
  return finish(value, issues)
}

export function validateOpportunityVersion(value: unknown): ValidationResult<OpportunityVersion> {
  const issues: ValidationIssue[] = []
  const record = baseRecord(value, issues)
  if (!record) return finish(value, issues)
  stringField(record, 'id', issues, ID_PATTERNS.opportunityVersion)
  stringField(record, 'opportunityId', issues, ID_PATTERNS.opportunity)
  stringField(record, 'contentHash', issues, ID_PATTERNS.sha256)
  stringField(record, 'precedenceRuleVersion', issues)
  numberField(record, 'sequence', issues, { integer: true, minimum: 1 })
  timestampField(record, 'observedAt', issues)
  timestampField(record, 'effectiveAt', issues, true)
  if (record.previousVersionId !== undefined && (typeof record.previousVersionId !== 'string' || !ID_PATTERNS.opportunityVersion.test(record.previousVersionId))) {
    issue(issues, '$.previousVersionId', 'must be an opportunity version ID')
  }
  const snapshotResult = validateOpportunity(record.snapshot)
  if (!snapshotResult.ok) snapshotResult.issues.forEach((entry) => issue(issues, `$.snapshot${entry.path.slice(1)}`, entry.message))
  stringArray(record, 'sourceRecordIds', issues, ID_PATTERNS.sourceRecord, 1)
  stringArray(record, 'documentRevisionIds', issues, ID_PATTERNS.documentRevision)
  stringArray(record, 'claimIds', issues, ID_PATTERNS.claim)
  if (!Array.isArray(record.semanticDiff)) issue(issues, '$.semanticDiff', 'must be an array')
  if (isRecord(record.snapshot)) {
    if (record.snapshot.id !== record.opportunityId) issue(issues, '$.snapshot.id', 'must match opportunityId')
    if (record.snapshot.currentVersionId !== record.id) issue(issues, '$.snapshot.currentVersionId', 'must match version id')
  }
  if (record.previousVersionId === record.id) issue(issues, '$.previousVersionId', 'cannot refer to itself')
  return finish(value, issues)
}

export function validateChangeEvent(value: unknown): ValidationResult<ChangeEvent> {
  const issues: ValidationIssue[] = []
  const record = baseRecord(value, issues)
  if (!record) return finish(value, issues)
  stringField(record, 'id', issues, ID_PATTERNS.change)
  stringField(record, 'opportunityId', issues, ID_PATTERNS.opportunity)
  stringField(record, 'toVersionId', issues, ID_PATTERNS.opportunityVersion)
  if (record.fromVersionId !== undefined && (typeof record.fromVersionId !== 'string' || !ID_PATTERNS.opportunityVersion.test(record.fromVersionId))) {
    issue(issues, '$.fromVersionId', 'must be an opportunity version ID')
  }
  enumField(record, 'classification', ['informational', 'material', 'urgent', 'closure'], issues)
  stringArray(record, 'changedPaths', issues, /^\//, 1)
  stringField(record, 'summary', issues)
  timestampField(record, 'observedAt', issues)
  timestampField(record, 'effectiveAt', issues, true)
  stringArray(record, 'sourceRecordIds', issues, ID_PATTERNS.sourceRecord, 1)
  stringArray(record, 'documentRevisionIds', issues, ID_PATTERNS.documentRevision)
  if (record.fromVersionId === record.toVersionId) issue(issues, '$.toVersionId', 'must differ from fromVersionId')
  return finish(value, issues)
}

export function validateSourceHealth(value: unknown): ValidationResult<SourceHealth> {
  const issues: ValidationIssue[] = []
  const record = baseRecord(value, issues)
  if (!record) return finish(value, issues)
  stringField(record, 'id', issues, ID_PATTERNS.sourceHealth)
  stringField(record, 'sourceKey', issues)
  enumField(record, 'status', ['healthy', 'degraded', 'stale', 'down'], issues)
  timestampField(record, 'checkedAt', issues)
  timestampField(record, 'lastSuccessAt', issues, true)
  numberField(record, 'recordCount', issues, { integer: true, minimum: 0 })
  numberField(record, 'consecutiveFailures', issues, { integer: true, minimum: 0 })
  numberField(record, 'latencyMs', issues, { minimum: 0, optional: true })
  if (typeof record.id === 'string' && typeof record.sourceKey === 'string' && record.id !== `health:${record.sourceKey}`) {
    issue(issues, '$.id', 'must equal health:<sourceKey>')
  }
  if ((record.status === 'down' || record.status === 'degraded') && !isRecord(record.error)) {
    issue(issues, '$.error', 'is required for degraded or down status')
  }
  return finish(value, issues)
}

export function assertValid<T>(result: ValidationResult<T>): T {
  if (!result.ok) {
    throw new TypeError(result.issues.map((entry) => `${entry.path}: ${entry.message}`).join('\n'))
  }
  return result.value
}

export type { EvidencePointer, Provenance }
