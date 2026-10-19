import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  globalHouseholdStore,
  evaluatePurchaseCompatibility,
  buildConsolidatedReturnPlan,
  issuePlanApproval,
  validateExecutionAuthorization,
  BENCHMARK_CANDIDATES,
} from '../src/index.js';

describe('Adversarial Security & Business Logic Audit Suite', () => {
  beforeEach(() => {
    globalHouseholdStore.resetDemoState();
    vi.useRealTimers();
  });

  // E2E-09: Replay Attack Prevention
  it('E2E-09 Security: Replay attack is rejected on second execution attempt', () => {
    const orderItems = globalHouseholdStore.getItemsByOrderId('ORDER-842-OCT2026');
    const draftPlan = buildConsolidatedReturnPlan(orderItems, {
      [orderItems[0].id]: 'REPLACEMENT_FOR_DAMAGE',
    });
    globalHouseholdStore.savePlan(draftPlan);

    const approvedPlan = issuePlanApproval(draftPlan, true);
    globalHouseholdStore.savePlan(approvedPlan);

    const token = approvedPlan.authorizationToken!;

    // First execution: MUST SUCCEED
    const exec1 = globalHouseholdStore.executePlan(approvedPlan.planId, token);
    expect(exec1.success).toBe(true);
    expect(exec1.executedPlan.approvalStatus).toBe('EXECUTED');

    // Second execution (Replay Attack): MUST BE REJECTED
    const exec2 = globalHouseholdStore.executePlan(approvedPlan.planId, token);
    expect(exec2.success).toBe(false);
    expect(exec2.reason).toContain('INVALID_STATE');
    expect(exec2.reason).toContain('EXECUTED');
  });

  // Expired Token Test (15-minute TTL)
  it('Security: Rejects execution if approval window (15-min TTL) has expired', () => {
    vi.useFakeTimers();
    const now = new Date('2026-10-20T12:00:00Z');
    vi.setSystemTime(now);

    const orderItems = globalHouseholdStore.getItemsByOrderId('ORDER-842-OCT2026');
    const draftPlan = buildConsolidatedReturnPlan(orderItems, {});
    globalHouseholdStore.savePlan(draftPlan);

    const approvedPlan = issuePlanApproval(draftPlan, true);
    globalHouseholdStore.savePlan(approvedPlan);
    const token = approvedPlan.authorizationToken!;

    // Fast-forward time by 16 minutes
    vi.setSystemTime(new Date(now.getTime() + 16 * 60 * 1000));

    const expiredValidation = validateExecutionAuthorization(approvedPlan, token);
    expect(expiredValidation.valid).toBe(false);
    expect(expiredValidation.reason).toContain('EXPIRED_PLAN');

    const execResult = globalHouseholdStore.executePlan(approvedPlan.planId, token);
    expect(execResult.success).toBe(false);
    expect(execResult.reason).toContain('EXPIRED_PLAN');
  });

  // Malformed & Foreign Token Rejection
  it('Security: Rejects forged, truncated, or cross-plan tokens', () => {
    const orderItems = globalHouseholdStore.getItemsByOrderId('ORDER-842-OCT2026');
    const draftPlan = buildConsolidatedReturnPlan(orderItems, {});
    globalHouseholdStore.savePlan(draftPlan);
    const approvedPlan = issuePlanApproval(draftPlan, true);
    globalHouseholdStore.savePlan(approvedPlan);

    const genuineToken = approvedPlan.authorizationToken!;

    // 1. Truncated token
    const truncatedToken = genuineToken.substring(0, genuineToken.length - 4);
    const truncRes = globalHouseholdStore.executePlan(approvedPlan.planId, truncatedToken);
    expect(truncRes.success).toBe(false);
    expect(truncRes.reason).toContain('INVALID_AUTHORIZATION_TOKEN');

    // 2. Swapped signature bytes
    const lastChar = genuineToken.slice(-1);
    const forgedToken = genuineToken.slice(0, -1) + (lastChar === 'z' ? 'a' : 'z');
    const forgeRes = globalHouseholdStore.executePlan(approvedPlan.planId, forgedToken);
    expect(forgeRes.success).toBe(false);

    // 3. Foreign plan ID injection
    const foreignToken = genuineToken.replace(approvedPlan.planId, 'plan_foreign_999');
    const foreignRes = globalHouseholdStore.executePlan(approvedPlan.planId, foreignToken);
    expect(foreignRes.success).toBe(false);
  });

  // Positive Compatibility Test (Exact Match)
  it('Business Logic: Positively verifies candidate that matches exact household specs', () => {
    const allItems = globalHouseholdStore.getAllItems();
    const exactMatchCandidate = {
      title: 'Crema Pro 54mm Stainless Steel Portafilter (3 Ears)',
      category: 'Kitchen Appliances',
      targetSpecs: {
        portafilterSizeMm: 54,
        earCount: 3,
      },
      sellerPolicy: {
        isThirdParty: false,
        returnWindowDays: 30,
        termsExplicitlyStated: true,
      },
    };

    const result = evaluatePurchaseCompatibility(exactMatchCandidate, allItems);
    expect(result.status).toBe('COMPATIBLE');
    expect(result.mismatchedAttributes.length).toBe(0);
    expect(result.reason).toContain('Exact specification match');
    expect(result.matchedOwnedItemId).toBe('item_owned_espresso_01');
  });

  // Missing Household Target (Unknown category)
  it('Business Logic: Honestly reports when no household equipment relates to category', () => {
    const allItems = globalHouseholdStore.getAllItems();
    const unrelatedCandidate = {
      title: 'Tesla Model Y Cabin Air Filter HEPA',
      category: 'Automotive',
      targetSpecs: { filterType: 'HEPA' },
    };

    const result = evaluatePurchaseCompatibility(unrelatedCandidate, allItems);
    expect(result.status).toBe('UNVERIFIED_MISSING_SPECS');
    expect(result.reason).toContain('No related household equipment found');
  });

  // Stale Plan Version & Tampered Contents Post-Approval
  it('Security: Rejects execution if plan items or version are tampered with post-approval', () => {
    const orderItems = globalHouseholdStore.getItemsByOrderId('ORDER-842-OCT2026');
    const draftPlan = buildConsolidatedReturnPlan(orderItems, {
      [orderItems[0].id]: 'REPLACEMENT_FOR_DAMAGE',
    });
    globalHouseholdStore.savePlan(draftPlan);

    const approvedPlan = issuePlanApproval(draftPlan, true);
    globalHouseholdStore.savePlan(approvedPlan);
    const token = approvedPlan.authorizationToken!;

    // Case A: Plan version bumped (stale version attack)
    const stalePlan = { ...approvedPlan, planVersion: approvedPlan.planVersion + 1 };
    globalHouseholdStore.savePlan(stalePlan);
    const staleRes = globalHouseholdStore.executePlan(stalePlan.planId, token);
    expect(staleRes.success).toBe(false);
    expect(staleRes.reason).toContain('TAMPERED_PLAN');

    // Restore valid plan
    globalHouseholdStore.savePlan(approvedPlan);

    // Case B: Tampering with items in the plan after approval
    const tamperedPlan = {
      ...approvedPlan,
      items: [
        ...approvedPlan.items,
        {
          itemId: 'item_fraudulent_999',
          title: 'Unauthorized Luxury Watch',
          requestedAction: 'RETURN_FOR_REFUND' as any,
          selectedPathway: approvedPlan.items[0].selectedPathway,
          status: 'PENDING' as any,
        },
      ],
    };
    globalHouseholdStore.savePlan(tamperedPlan);
    const tamperRes = globalHouseholdStore.executePlan(tamperedPlan.planId, token);
    expect(tamperRes.success).toBe(false);
    expect(tamperRes.reason).toContain('TAMPERED_PLAN');
  });

  // Concurrent Execution Race Condition Hardening
  it('Concurrency: Rejects parallel concurrent execution race conditions safely', async () => {
    const orderItems = globalHouseholdStore.getItemsByOrderId('ORDER-842-OCT2026');
    const draftPlan = buildConsolidatedReturnPlan(orderItems, {
      [orderItems[0].id]: 'REPLACEMENT_FOR_DAMAGE',
    });
    globalHouseholdStore.savePlan(draftPlan);

    const approvedPlan = issuePlanApproval(draftPlan, true);
    globalHouseholdStore.savePlan(approvedPlan);
    const token = approvedPlan.authorizationToken!;

    // Trigger 5 parallel execution attempts simultaneously
    const attempts = await Promise.all([
      Promise.resolve(globalHouseholdStore.executePlan(approvedPlan.planId, token)),
      Promise.resolve(globalHouseholdStore.executePlan(approvedPlan.planId, token)),
      Promise.resolve(globalHouseholdStore.executePlan(approvedPlan.planId, token)),
      Promise.resolve(globalHouseholdStore.executePlan(approvedPlan.planId, token)),
      Promise.resolve(globalHouseholdStore.executePlan(approvedPlan.planId, token)),
    ]);

    const successes = attempts.filter((a) => a.success);
    const failures = attempts.filter((a) => !a.success);

    // Exactly ONE execution must succeed, the rest rejected as INVALID_STATE (already executed)
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(4);
    for (const fail of failures) {
      expect(fail.reason).toContain('INVALID_STATE');
    }
  });
});
