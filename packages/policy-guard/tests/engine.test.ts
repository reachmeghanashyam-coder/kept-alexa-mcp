import { describe, it, expect, beforeEach } from 'vitest';
import {
  globalHouseholdStore,
  evaluatePurchaseCompatibility,
  buildConsolidatedReturnPlan,
  issuePlanApproval,
  validateExecutionAuthorization,
  BENCHMARK_CANDIDATES,
} from '../src/index.js';

describe('Milestone 1 Acceptance Criteria: Kept Policy & Security Engine', () => {
  beforeEach(() => {
    globalHouseholdStore.resetDemoState();
  });

  // Acceptance Criterion 1: The same household record powers compatibility checking and return resolution
  it('Criterion 1: Uses the unified household record for both compatibility and return resolution', () => {
    const allItems = globalHouseholdStore.getAllItems();
    expect(allItems.length).toBe(4);

    // Verify owned items are queryable
    const ownedEspresso = allItems.find((i) => i.modelNumber === 'BES870XL');
    expect(ownedEspresso).toBeDefined();
    expect(ownedEspresso?.lifecycleState).toBe('OWNED_IN_HOME');

    // Run compatibility against the household record
    const compatResult = evaluatePurchaseCompatibility(
      BENCHMARK_CANDIDATES.incompatiblePortafilter,
      allItems
    );
    expect(compatResult.matchedOwnedItemId).toBe(ownedEspresso?.id);

    // Verify delivered in-trial items from the same store are queryable for return resolution
    const order842Items = globalHouseholdStore.getItemsByOrderId('ORDER-842-OCT2026');
    expect(order842Items.length).toBe(2);

    const plan = buildConsolidatedReturnPlan(order842Items, {
      [order842Items[0].id]: 'REPLACEMENT_FOR_DAMAGE',
      [order842Items[1].id]: 'RETURN_FOR_REFUND',
    });

    expect(plan.items.length).toBe(2);
    expect(plan.items[0].itemId).toBe(order842Items[0].id);
    expect(plan.items[1].itemId).toBe(order842Items[1].id);
  });

  // Acceptance Criterion 2: Known incompatible dimensions trigger a deterministic warning
  it('Criterion 2: Deterministically triggers INCOMPATIBLE warning with exact dimension delta and seller risk', () => {
    const allItems = globalHouseholdStore.getAllItems();
    const result = evaluatePurchaseCompatibility(
      BENCHMARK_CANDIDATES.incompatiblePortafilter,
      allItems
    );

    expect(result.status).toBe('INCOMPATIBLE');
    expect(result.reason).toContain('proprietary 54mm 3-ear');
    expect(result.reason).toContain('58mm with 2 ears');

    // Mismatched attributes breakdown
    expect(result.mismatchedAttributes).toEqual([
      {
        attribute: 'Portafilter Diameter (mm)',
        ownedValue: 54,
        candidateValue: 58,
      },
      {
        attribute: 'Locking Ear Count',
        ownedValue: 3,
        candidateValue: 2,
      },
    ]);

    // Restocking fee warning from third-party merchant
    expect(result.sellerRiskWarning).toContain('15% restocking fee');

    // Verified alternative provided
    expect(result.recommendedAlternative?.verifiedSpec).toBe('54mm 3-Ear Precision Machined');
  });

  // Acceptance Criterion 3: Missing dimensions or unverified policies produce UNVERIFIED, not a guessed answer
  it('Criterion 3: Missing specifications trigger UNVERIFIED_MISSING_SPECS (Epistemic Honesty)', () => {
    const allItems = globalHouseholdStore.getAllItems();
    const result = evaluatePurchaseCompatibility(
      BENCHMARK_CANDIDATES.unverifiedThirdPartyItem,
      allItems
    );

    expect(result.status).toBe('UNVERIFIED_MISSING_SPECS');
    expect(result.reason).toContain('Epistemic Guardrail triggered: will not assume compatibility');
    expect(result.sellerRiskWarning).toContain('Third-party marketplace listing without verified return policy terms');
  });

  // Acceptance Criterion 4: Two items from the same order retain independent conditions and resolution states
  it('Criterion 4: Two items from Order #842 maintain independent conditions, actions, and evidence', () => {
    const orderItems = globalHouseholdStore.getItemsByOrderId('ORDER-842-OCT2026');
    const kettle = orderItems.find((i) => i.id === 'item_trial_kettle_03')!;
    const sweater = orderItems.find((i) => i.id === 'item_trial_sweater_04')!;

    // Attach mock visual observation to kettle
    globalHouseholdStore.updateItemVisualEvidence(kettle.id, {
      summary: 'Fracture observed on upper handle seam; 360-degree power base not visible in frame',
      detectedDamage: 'Structural handle crack',
      missingPartsNoted: ['360-degree power base'],
      source: 'bedrock_nova_observation',
      capturedAt: '2026-10-20T00:00:00.000Z',
    });

    const updatedKettle = globalHouseholdStore.getItemById(kettle.id)!;
    const freshSweater = globalHouseholdStore.getItemById(sweater.id)!;

    // Verify conditions and evidence remain completely distinct
    expect(updatedKettle.visualEvidence?.detectedDamage).toBe('Structural handle crack');
    expect(freshSweater.visualEvidence).toBeUndefined();
    expect(freshSweater.conditionNotes).toContain('Unworn, pristine condition with tags intact');

    // Build plan where Kettle is requested as REPLACEMENT_FOR_DAMAGE and Sweater as RETURN_FOR_REFUND
    const plan = buildConsolidatedReturnPlan([updatedKettle, freshSweater], {
      [kettle.id]: 'REPLACEMENT_FOR_DAMAGE',
      [sweater.id]: 'RETURN_FOR_REFUND',
    });

    expect(plan.items[0].requestedAction).toBe('REPLACEMENT_FOR_DAMAGE');
    expect(plan.items[0].conditionSummary).toContain('Structural handle crack');

    expect(plan.items[1].requestedAction).toBe('RETURN_FOR_REFUND');
    expect(plan.items[1].conditionSummary).toContain('Unworn, pristine condition');

    // Consolidated trip verifies single-trip Whole Foods drop-off feasibility
    expect(plan.consolidatedTripSummary.singleTripPossible).toBe(true);
    expect(plan.consolidatedTripSummary.suggestedLocation).toBe('Whole Foods Market (Customer Service Desk)');
  });

  // Acceptance Criterion 5: A plan cannot be approved or executed without valid server-side authorization (and invalidates on modification)
  it('Criterion 5: Server-side cryptographic authorization gate blocks execution without approval, and invalidates on tampering', () => {
    const orderItems = globalHouseholdStore.getItemsByOrderId('ORDER-842-OCT2026');
    const draftPlan = buildConsolidatedReturnPlan(orderItems, {
      [orderItems[0].id]: 'REPLACEMENT_FOR_DAMAGE',
      [orderItems[1].id]: 'RETURN_FOR_REFUND',
    });

    globalHouseholdStore.savePlan(draftPlan);

    // 1. Attempt execution with fake/missing token -> fails
    const unauthExec = globalHouseholdStore.executePlan(draftPlan.planId, 'fake_token_123');
    expect(unauthExec.success).toBe(false);
    expect(unauthExec.reason).toContain('INVALID_STATE');

    // 2. Cannot approve without explicit user confirmation flag
    expect(() => issuePlanApproval(draftPlan, false)).toThrowError(/USER_CONFIRMATION_REQUIRED/);

    // 3. Issue genuine approval
    const approvedPlan = issuePlanApproval(draftPlan, true);
    expect(approvedPlan.approvalStatus).toBe('APPROVED');
    expect(approvedPlan.authorizationToken).toBeDefined();

    globalHouseholdStore.savePlan(approvedPlan);

    // 4. Tampering test: alter an item in the plan after approval
    const tamperedPlan = JSON.parse(JSON.stringify(approvedPlan));
    tamperedPlan.items[0].requestedAction = 'RETURN_FOR_REFUND'; // modified!

    const tamperedValidation = validateExecutionAuthorization(
      tamperedPlan,
      approvedPlan.authorizationToken!
    );
    expect(tamperedValidation.valid).toBe(false);
    expect(tamperedValidation.reason).toContain('TAMPERED_PLAN');

    // 5. Valid execution with authentic plan and token
    const validExec = globalHouseholdStore.executePlan(
      approvedPlan.planId,
      approvedPlan.authorizationToken!
    );
    expect(validExec.success).toBe(true);
    expect(validExec.executedPlan.approvalStatus).toBe('EXECUTED');

    // Check item lifecycle state transitioned to RETURN_PREPARED
    const executedKettle = globalHouseholdStore.getItemById(orderItems[0].id)!;
    expect(executedKettle.lifecycleState).toBe('RETURN_PREPARED');
  });

  // Acceptance Criterion 6: Resetting the demo restores the exact known fixture state
  it('Criterion 6: resetDemoState() completely restores original fixtures and clears plan history', () => {
    const orderItems = globalHouseholdStore.getItemsByOrderId('ORDER-842-OCT2026');
    const plan = buildConsolidatedReturnPlan(orderItems, {});
    const approvedPlan = issuePlanApproval(plan, true);
    globalHouseholdStore.savePlan(approvedPlan);
    globalHouseholdStore.executePlan(plan.planId, approvedPlan.authorizationToken!);

    // Verify state was modified
    expect(globalHouseholdStore.getItemById(orderItems[0].id)?.lifecycleState).toBe('RETURN_PREPARED');

    // Reset demo
    globalHouseholdStore.resetDemoState();

    // Verify completely restored
    const restoredKettle = globalHouseholdStore.getItemById(orderItems[0].id)!;
    expect(restoredKettle.lifecycleState).toBe('DELIVERED_IN_TRIAL');
    expect(globalHouseholdStore.getPlan(plan.planId)).toBeUndefined();
  });
});
