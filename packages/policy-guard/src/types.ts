export type LifecycleState =
  | 'CONSIDERING'
  | 'PURCHASED'
  | 'DELIVERED_IN_TRIAL'
  | 'OWNED_IN_HOME'
  | 'RETURN_PREPARED'
  | 'RETURNED';

export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'CONFLICT' | 'UNKNOWN';

export type DataOrigin =
  | 'DEMO_SEEDED_FIXTURE'
  | 'PUBLISHED_DOCUMENT_SOURCE'
  | 'LIVE_USER_OBSERVATION';

export interface DropOffEligibility {
  wholeFoodsBoxFree: boolean;
  upsDropoffBoxed: boolean;
  kohlsDropoffBoxFree: boolean;
}

export interface PolicyFixture {
  returnWindowDays: number;
  restockingFeePercent: number;
  dropOffEligibility: DropOffEligibility;
  sourceDocumentId?: string;
  sourceCitation?: string;
  isThirdPartySeller: boolean;
  termsVerified: boolean;
}

export interface VisualEvidence {
  summary: string;
  detectedDamage?: string;
  missingPartsNoted?: string[];
  source: 'bedrock_nova_observation' | 'user_upload' | 'seeded_fixture';
  capturedAt: string;
}

export interface HouseholdItemRecord {
  id: string;
  orderId: string;
  productTitle: string;
  brand: string;
  modelNumber: string;
  category: string;
  lifecycleState: LifecycleState;
  purchaseDate: string; // ISO
  deliveryDate?: string; // ISO
  trialDeadlineDate?: string; // ISO
  verifiedSpecs: Record<string, string | number | boolean>;
  includedAccessories: string[];
  conditionNotes?: string;
  visualEvidence?: VisualEvidence;
  policyFixture: PolicyFixture;
  originLabel: DataOrigin;
}

export interface CandidateItem {
  id?: string;
  title: string;
  brand?: string;
  category: string;
  targetSpecs?: Record<string, string | number | boolean>;
  sellerPolicy?: {
    isThirdParty: boolean;
    restockingFeePercent?: number;
    returnWindowDays?: number;
    termsExplicitlyStated: boolean;
  };
}

export interface CompatibilityCheckResult {
  candidateTitle: string;
  status: 'COMPATIBLE' | 'INCOMPATIBLE' | 'DUPLICATE_OWNED' | 'UNVERIFIED_MISSING_SPECS';
  matchedOwnedItemId?: string;
  matchedOwnedProductTitle?: string;
  reason: string;
  mismatchedAttributes?: Array<{
    attribute: string;
    ownedValue: string | number | boolean;
    candidateValue: string | number | boolean;
  }>;
  sourceEvidence: string;
  sellerRiskWarning?: string;
  recommendedAlternative?: {
    title: string;
    asin: string;
    verifiedSpec: string;
    returnPolicySummary: string;
  };
  originLabel: DataOrigin;
}

export type PathwayId =
  | 'whole_foods_box_free'
  | 'ups_store_boxed'
  | 'kohls_box_free'
  | 'seller_contact_required';

export interface ReturnPathway {
  pathwayId: PathwayId;
  carrierName: string;
  locationName: string;
  requiresPackaging: boolean;
  requiresPrintedLabel: boolean;
  estimatedFeeUsd: number;
  convenienceScore: number;
  eligibilityStatus: 'ELIGIBLE' | 'INELIGIBLE' | 'UNVERIFIED';
  reason: string;
  sourceCitation: string;
}

export interface PlanItemAction {
  itemId: string;
  productTitle: string;
  requestedAction: 'REPLACEMENT_FOR_DAMAGE' | 'RETURN_FOR_REFUND';
  conditionSummary: string;
  selectedPathway: ReturnPathway;
}

export interface ConsolidatedTripSummary {
  suggestedLocation: string;
  requiresBoxes: boolean;
  singleTripPossible: boolean;
  totalItems: number;
  notes: string;
}

export interface ReturnActionPlan {
  planId: string;
  planVersion: number;
  createdAt: string;
  expiresAt: string;
  items: PlanItemAction[];
  consolidatedTripSummary: ConsolidatedTripSummary;
  calendarDeadline: string;
  approvalStatus:
    | 'DRAFT_PENDING_APPROVAL'
    | 'APPROVED'
    | 'EXECUTED'
    | 'EXPIRED'
    | 'TAMPERED_INVALID';
  authorizationToken?: string;
  planHash: string;
  originLabel: DataOrigin;
}
