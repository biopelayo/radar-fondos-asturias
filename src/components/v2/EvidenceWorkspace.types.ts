import type { Claim, Document, Opportunity } from '../../domain/v2'

/** Canonical domain projections consumed by the workspace. */
export type EvidenceOpportunityV2 = Pick<
  Opportunity,
  'id' | 'canonicalReference' | 'titles' | 'authority' | 'applicationWindows' | 'finance' | 'beneficiaryClasses'
>

/** A catalogue hit may precede document ingestion; identity is optional until then. */
export type EvidenceDocumentV2 = Pick<
  Document,
  'officialUrl' | 'role' | 'mimeType' | 'language' | 'publishedAt' | 'extraction' | 'sourceRecordIds'
> & Partial<Pick<Document, 'id' | 'revisionId'>>

/** UI-only page body; the canonical Document deliberately stores no rendered text. */
export interface EvidenceDocumentPageV2 {
  number: number
  text: string
  previewSrc?: string
  alt?: string
}

export type EvidenceClaimV2 = Claim
export type EvidenceWorkspaceStatus = 'ready' | 'loading' | 'error'
export type EvidenceDocumentState = 'ready' | 'fallback' | 'unavailable'
export type EvidenceReviewAction = 'confirm' | 'flag'

export interface EvidenceWorkspaceProps {
  opportunity: EvidenceOpportunityV2 | null
  document: EvidenceDocumentV2 | null
  claims: Claim[]
  pages?: EvidenceDocumentPageV2[]
  documentState?: EvidenceDocumentState
  fallbackReason?: string
  status?: EvidenceWorkspaceStatus
  errorMessage?: string
  initialClaimId?: Claim['id']
  className?: string
  onRetry?: () => void
  onClaimSelect?: (claim: Claim) => void
  onClaimReview?: (claimId: Claim['id'], action: EvidenceReviewAction) => void
  onOpenOfficialSource?: (document: EvidenceDocumentV2) => void
}
