import { SEEDED_HOUSEHOLD_ITEMS } from './fixtures.js';
import { HouseholdItemRecord, ReturnActionPlan, VisualEvidence } from './types.js';
import { validateExecutionAuthorization } from './security.js';

export class HouseholdStore {
  private items: Map<string, HouseholdItemRecord> = new Map();
  private plans: Map<string, ReturnActionPlan> = new Map();

  constructor() {
    this.resetDemoState();
  }

  public resetDemoState(): void {
    this.items.clear();
    this.plans.clear();

    // Deep clone seeded fixtures to prevent mutation leakage across test runs
    for (const item of SEEDED_HOUSEHOLD_ITEMS) {
      this.items.set(item.id, JSON.parse(JSON.stringify(item)));
    }
  }

  public getAllItems(): HouseholdItemRecord[] {
    return Array.from(this.items.values());
  }

  public getItemById(id: string): HouseholdItemRecord | undefined {
    return this.items.get(id);
  }

  public getItemsByOrderId(orderId: string): HouseholdItemRecord[] {
    return this.getAllItems().filter((item) => item.orderId === orderId);
  }

  public updateItemVisualEvidence(
    itemId: string,
    evidence: VisualEvidence
  ): HouseholdItemRecord {
    const item = this.items.get(itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found in household inventory.`);
    }

    item.visualEvidence = evidence;
    item.conditionNotes = `${item.conditionNotes ?? ''} [Observed: ${evidence.summary}]`.trim();
    this.items.set(itemId, item);
    return item;
  }

  public savePlan(plan: ReturnActionPlan): void {
    this.plans.set(plan.planId, JSON.parse(JSON.stringify(plan)));
  }

  public getPlan(planId: string): ReturnActionPlan | undefined {
    return this.plans.get(planId);
  }

  public executePlan(
    planId: string,
    token: string
  ): { success: boolean; executedPlan: ReturnActionPlan; reason?: string } {
    const plan = this.plans.get(planId);
    if (!plan) {
      return { success: false, executedPlan: {} as any, reason: 'PLAN_NOT_FOUND' };
    }

    const authCheck = validateExecutionAuthorization(plan, token);
    if (!authCheck.valid) {
      return {
        success: false,
        executedPlan: plan,
        reason: authCheck.reason,
      };
    }

    // Execute state transitions for all items in plan
    for (const planItem of plan.items) {
      const item = this.items.get(planItem.itemId);
      if (item) {
        item.lifecycleState = 'RETURN_PREPARED';
        this.items.set(item.id, item);
      }
    }

    plan.approvalStatus = 'EXECUTED';
    this.plans.set(planId, plan);

    return {
      success: true,
      executedPlan: plan,
    };
  }
}

// Global singleton instance for runtime and testing
export const globalHouseholdStore = new HouseholdStore();
