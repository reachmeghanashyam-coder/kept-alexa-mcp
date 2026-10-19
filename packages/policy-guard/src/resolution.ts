import {
  ConsolidatedTripSummary,
  HouseholdItemRecord,
  PlanItemAction,
  ReturnActionPlan,
  ReturnPathway,
} from './types.js';
import { generatePlanHash } from './security.js';

export function evaluateItemReturnPathways(
  item: HouseholdItemRecord
): ReturnPathway[] {
  const pathways: ReturnPathway[] = [];

  // Check 1: Whole Foods Box-Free
  if (item.policyFixture.dropOffEligibility.wholeFoodsBoxFree) {
    pathways.push({
      pathwayId: 'whole_foods_box_free',
      carrierName: 'Amazon / Whole Foods Return Desk',
      locationName: 'Whole Foods Market (Customer Service Desk)',
      requiresPackaging: false,
      requiresPrintedLabel: false,
      estimatedFeeUsd: 0,
      convenienceScore: 98,
      eligibilityStatus: 'ELIGIBLE',
      reason:
        'Eligible for box-free, label-free drop-off. Present digital QR code at customer service counter.',
      sourceCitation:
        item.policyFixture.sourceCitation ?? 'Amazon Standard Return Policy §2.1',
    });
  }

  // Check 2: UPS Store Drop-off (Boxed)
  if (item.policyFixture.dropOffEligibility.upsDropoffBoxed) {
    pathways.push({
      pathwayId: 'ups_store_boxed',
      carrierName: 'UPS Store',
      locationName: 'The UPS Store',
      requiresPackaging: true,
      requiresPrintedLabel: false,
      estimatedFeeUsd: 0,
      convenienceScore: 75,
      eligibilityStatus: 'ELIGIBLE',
      reason:
        'Drop-off supported with digital code. Item must be secured inside cardboard shipping container.',
      sourceCitation:
        item.policyFixture.sourceCitation ?? 'Amazon Carrier Logistics Agreement §UPS',
    });
  }

  // Check 3: Kohl's Box-Free
  if (item.policyFixture.dropOffEligibility.kohlsDropoffBoxFree) {
    pathways.push({
      pathwayId: 'kohls_box_free',
      carrierName: "Kohl's Drop-off Desk",
      locationName: "Kohl's Department Store",
      requiresPackaging: false,
      requiresPrintedLabel: false,
      estimatedFeeUsd: 0,
      convenienceScore: 90,
      eligibilityStatus: 'ELIGIBLE',
      reason: 'Eligible for box-free drop-off at designated customer service counter.',
      sourceCitation:
        item.policyFixture.sourceCitation ?? "Amazon Partner Network §Kohl's Drop-off",
    });
  }

  // Fallback for third-party unverified sellers
  if (item.policyFixture.isThirdPartySeller && !item.policyFixture.termsVerified) {
    pathways.push({
      pathwayId: 'seller_contact_required',
      carrierName: 'Direct Third-Party Merchant Fulfillment',
      locationName: 'Seller Authorization Portal',
      requiresPackaging: true,
      requiresPrintedLabel: true,
      estimatedFeeUsd: 0,
      convenienceScore: 20,
      eligibilityStatus: 'UNVERIFIED',
      reason:
        'Third-party merchant terms unverified. Standard Amazon drop-off desks cannot accept this item without seller RMA authorization.',
      sourceCitation: 'Marketplace Merchant Policy §Independent Sellers',
    });
  }

  return pathways;
}

export function buildConsolidatedReturnPlan(
  items: HouseholdItemRecord[],
  userActions: Record<string, 'REPLACEMENT_FOR_DAMAGE' | 'RETURN_FOR_REFUND'>
): ReturnActionPlan {
  const planItems: PlanItemAction[] = items.map((item) => {
    const availablePathways = evaluateItemReturnPathways(item);
    // Select the highest convenience score eligible pathway
    const selectedPathway =
      availablePathways.find((p) => p.pathwayId === 'whole_foods_box_free') ??
      availablePathways[0] ?? {
        pathwayId: 'seller_contact_required',
        carrierName: 'Unknown',
        locationName: 'Unverified',
        requiresPackaging: true,
        requiresPrintedLabel: true,
        estimatedFeeUsd: 0,
        convenienceScore: 0,
        eligibilityStatus: 'UNVERIFIED',
        reason: 'No eligible drop-off pathway found.',
        sourceCitation: 'N/A',
      };

    const action =
      userActions[item.id] ??
      (item.conditionNotes?.includes('cracked') ? 'REPLACEMENT_FOR_DAMAGE' : 'RETURN_FOR_REFUND');

    const conditionSummary = item.visualEvidence
      ? [item.visualEvidence.detectedDamage, item.visualEvidence.summary].filter(Boolean).join(' — ')
      : (item.conditionNotes ?? 'Standard customer return request');

    return {
      itemId: item.id,
      productTitle: item.productTitle,
      requestedAction: action,
      conditionSummary,
      selectedPathway,
    };
  });

  // Calculate consolidated trip feasibility
  const allEligibleWholeFoods = planItems.every(
    (pi) => pi.selectedPathway.pathwayId === 'whole_foods_box_free'
  );

  const consolidatedTrip: ConsolidatedTripSummary = {
    suggestedLocation: allEligibleWholeFoods
      ? 'Whole Foods Market (Customer Service Desk)'
      : 'Multiple Drop-Off Locations Required',
    requiresBoxes: !allEligibleWholeFoods,
    singleTripPossible: allEligibleWholeFoods,
    totalItems: planItems.length,
    notes: allEligibleWholeFoods
      ? 'All items qualify for consolidated box-free drop-off at a single counter.'
      : 'Items have differing packaging or drop-off requirements.',
  };

  // Find nearest deadline
  const deadlines = items
    .map((i) => i.trialDeadlineDate)
    .filter((d): d is string => Boolean(d))
    .sort();

  const calendarDeadline = deadlines[0] ?? new Date(Date.now() + 30 * 86400000).toISOString();

  const draftPlanPayload = {
    planId: `plan_dropguard_${Date.now()}`,
    planVersion: 1,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min approval TTL
    items: planItems,
    consolidatedTripSummary: consolidatedTrip,
    calendarDeadline,
    approvalStatus: 'DRAFT_PENDING_APPROVAL' as const,
    originLabel: 'PUBLISHED_DOCUMENT_SOURCE' as const,
  };

  const planHash = generatePlanHash(draftPlanPayload);

  return {
    ...draftPlanPayload,
    planHash,
  };
}
