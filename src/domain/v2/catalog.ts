import {
  assertValid,
  validateChangeEvent,
  validateClaim,
  validateDocument,
  validateOpportunity,
  validateOpportunityVersion,
  validateSourceRecord,
} from './validators'
import type {
  ChangeEvent,
  Claim,
  Document,
  Opportunity,
  OpportunityVersion,
  SourceRecord,
} from './types'

export interface CatalogShardDescriptor {
  id: string
  path: string
  sha256: string
  count: number
}

export interface CatalogManifest {
  schemaVersion: '2.0.0'
  catalogVersion: string
  generatedAt: string
  inputHash: string
  opportunityCount: number
  shards: CatalogShardDescriptor[]
  health: { path: 'health.json'; sha256: string }
}

export interface CatalogShard {
  schemaVersion: '2.0.0'
  id: string
  generatedAt: string
  opportunities: Opportunity[]
  versions: OpportunityVersion[]
  sourceRecords: SourceRecord[]
  documents: Document[]
  claims: Claim[]
  changeEvents: ChangeEvent[]
}

export interface V2Catalog {
  manifest: CatalogManifest
  opportunities: Opportunity[]
  versions: OpportunityVersion[]
  sourceRecords: SourceRecord[]
  documents: Document[]
  claims: Claim[]
  changeEvents: ChangeEvent[]
}

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/
const SHARD_PATH_PATTERN = /^shards\/opportunities\/[a-f0-9]{2}\.json$/

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} no es un objeto JSON.`)
  }
  return value as Record<string, unknown>
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} no es una lista.`)
  return value
}

function parseManifest(value: unknown): CatalogManifest {
  const manifest = requireRecord(value, 'El manifest V2')
  if (manifest.schemaVersion !== '2.0.0') throw new TypeError('Versión de catálogo V2 no compatible.')
  if (typeof manifest.catalogVersion !== 'string' || !SHA256_PATTERN.test(manifest.catalogVersion)) {
    throw new TypeError('El catálogo V2 no tiene una versión verificable.')
  }
  if (typeof manifest.inputHash !== 'string' || !SHA256_PATTERN.test(manifest.inputHash)) {
    throw new TypeError('El catálogo V2 no identifica su entrada pública.')
  }
  if (typeof manifest.generatedAt !== 'string' || Number.isNaN(Date.parse(manifest.generatedAt))) {
    throw new TypeError('El catálogo V2 no tiene una fecha válida.')
  }
  if (!Number.isInteger(manifest.opportunityCount) || (manifest.opportunityCount as number) < 1) {
    throw new TypeError('El catálogo V2 declara un recuento inválido.')
  }
  const shards = requireArray(manifest.shards, 'Los shards V2').map((entry, index) => {
    const descriptor = requireRecord(entry, `Shard ${index + 1}`)
    if (typeof descriptor.id !== 'string' || !/^shard:opportunities:[a-f0-9]{2}$/.test(descriptor.id)) {
      throw new TypeError(`Shard ${index + 1}: identificador inválido.`)
    }
    if (typeof descriptor.path !== 'string' || !SHARD_PATH_PATTERN.test(descriptor.path)) {
      throw new TypeError(`Shard ${index + 1}: ruta no permitida.`)
    }
    if (typeof descriptor.sha256 !== 'string' || !SHA256_PATTERN.test(descriptor.sha256)) {
      throw new TypeError(`Shard ${index + 1}: hash inválido.`)
    }
    if (!Number.isInteger(descriptor.count) || (descriptor.count as number) < 1) {
      throw new TypeError(`Shard ${index + 1}: recuento inválido.`)
    }
    return descriptor as unknown as CatalogShardDescriptor
  })
  const health = requireRecord(manifest.health, 'La referencia de salud V2')
  if (health.path !== 'health.json' || typeof health.sha256 !== 'string' || !SHA256_PATTERN.test(health.sha256)) {
    throw new TypeError('La referencia de salud V2 no es válida.')
  }
  return { ...manifest, shards, health } as unknown as CatalogManifest
}

async function sha256(text: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('Este navegador no permite verificar el catálogo con SHA-256.')
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

async function fetchText(url: URL): Promise<string> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`No se pudo cargar ${url.pathname}: HTTP ${response.status}.`)
  return response.text()
}

function parseShard(value: unknown, descriptor: CatalogShardDescriptor): CatalogShard {
  const raw = requireRecord(value, descriptor.id)
  if (raw.schemaVersion !== '2.0.0' || raw.id !== descriptor.id) {
    throw new TypeError(`${descriptor.id}: identidad o versión inválida.`)
  }
  const opportunities = requireArray(raw.opportunities, `${descriptor.id}.opportunities`)
    .map((entry) => assertValid(validateOpportunity(entry)))
  const versions = requireArray(raw.versions, `${descriptor.id}.versions`)
    .map((entry) => assertValid(validateOpportunityVersion(entry)))
  const sourceRecords = requireArray(raw.sourceRecords, `${descriptor.id}.sourceRecords`)
    .map((entry) => assertValid(validateSourceRecord(entry)))
  const documents = requireArray(raw.documents, `${descriptor.id}.documents`)
    .map((entry) => assertValid(validateDocument(entry)))
  const claims = requireArray(raw.claims, `${descriptor.id}.claims`)
    .map((entry) => assertValid(validateClaim(entry)))
  const changeEvents = requireArray(raw.changeEvents, `${descriptor.id}.changeEvents`)
    .map((entry) => assertValid(validateChangeEvent(entry)))
  if (opportunities.length !== descriptor.count) {
    throw new TypeError(`${descriptor.id}: el recuento no coincide con el manifest.`)
  }
  return { ...raw, opportunities, versions, sourceRecords, documents, claims, changeEvents } as unknown as CatalogShard
}

export async function loadV2Catalog(baseUrl = './data/v2/'): Promise<V2Catalog> {
  const root = new URL(baseUrl, window.location.href)
  const manifestText = await fetchText(new URL('manifest.json', root))
  const manifest = parseManifest(JSON.parse(manifestText) as unknown)
  const shards = await Promise.all(manifest.shards.map(async (descriptor) => {
    const text = await fetchText(new URL(descriptor.path, root))
    if (await sha256(text) !== descriptor.sha256) {
      throw new Error(`${descriptor.id}: el hash no coincide; se conserva la interfaz sin confiar en esos datos.`)
    }
    return parseShard(JSON.parse(text) as unknown, descriptor)
  }))
  const opportunities = shards.flatMap((shard) => shard.opportunities)
  if (opportunities.length !== manifest.opportunityCount) {
    throw new TypeError('El total de oportunidades V2 no coincide con el manifest.')
  }
  if (new Set(opportunities.map((item) => item.id)).size !== opportunities.length) {
    throw new TypeError('El catálogo V2 contiene oportunidades duplicadas.')
  }
  return {
    manifest,
    opportunities,
    versions: shards.flatMap((shard) => shard.versions),
    sourceRecords: shards.flatMap((shard) => shard.sourceRecords),
    documents: shards.flatMap((shard) => shard.documents),
    claims: shards.flatMap((shard) => shard.claims),
    changeEvents: shards.flatMap((shard) => shard.changeEvents),
  }
}
