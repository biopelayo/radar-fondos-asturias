/**
 * Temporary V2 contract seam.
 *
 * Replace these interfaces with imports from `src/domain/v2` when the H1
 * canonical contract lands. Keeping the seam in one file prevents UI-shaped
 * data from leaking into the future domain model.
 */

export type EvidenceWorkspaceStatus = 'ready' | 'loading' | 'error'

export type EvidenceClaimStatus =
  | 'located'
  | 'confirmed'
  | 'inferred'
  | 'conflict'
  | 'stale'
  | 'missing'

export type EvidenceClaimCategory =
  | 'eligibility'
  | 'money'
  | 'deadline'
  | 'document'
  | 'risk'

export interface EvidenceOpportunityV2 {
  id: string
  title: string
  officialTitle?: string
  issuer: string
  amountLabel?: string
  deadlineLabel?: string
  eligibilityLabel?: string
}

export interface EvidenceDocumentPageV2 {
  number: number
  text: string
  /** A local object/data URL or trusted host-provided preview. The component never fetches it. */
  previewSrc?: string
  alt?: string
}

export interface EvidenceDocumentV2 {
  id: string
  revisionId: string
  title: string
  source: string
  reference: string
  role: string
  publishedAt?: string
  format: 'pdf' | 'html' | 'text'
  pageCount: number
  renderState?: 'ready' | 'fallback' | 'unavailable'
  fallbackReason?: string
  pages: EvidenceDocumentPageV2[]
}

export interface EvidencePointerV2 {
  documentId: string
  revisionId: string
  page: number
  quote: string
  section?: string
}

export interface EvidenceClaimV2 {
  id: string
  category: EvidenceClaimCategory
  label: string
  value: string
  interpretation?: string
  consequence?: string
  confidence?: number
  status: EvidenceClaimStatus
  pointer?: EvidencePointerV2
}

export type EvidenceReviewAction = 'confirm' | 'flag'

export interface EvidenceWorkspaceProps {
  opportunity: EvidenceOpportunityV2 | null
  document: EvidenceDocumentV2 | null
  claims: EvidenceClaimV2[]
  status?: EvidenceWorkspaceStatus
  errorMessage?: string
  initialClaimId?: string
  className?: string
  onRetry?: () => void
  onClaimSelect?: (claim: EvidenceClaimV2) => void
  onClaimReview?: (claimId: string, action: EvidenceReviewAction) => void
  onOpenOfficialSource?: (document: EvidenceDocumentV2) => void
}
