import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { ReturnActionPlan } from './types.js';

const SERVER_SECRET_KEY = process.env.KEPT_SECRET_KEY || process.env.DROPGUARD_SECRET_KEY || 'kept_secure_mcp_hmac_secret_2026';

export function generatePlanHash(
  plan: Pick<ReturnActionPlan, 'planId' | 'planVersion' | 'items' | 'calendarDeadline'>
): string {
  // Normalize items to ensure deterministic hashing
  const normalizedItems = plan.items.map((i) => ({
    itemId: i.itemId,
    action: i.requestedAction,
    pathwayId: i.selectedPathway.pathwayId,
  }));

  const dataToHash = JSON.stringify({
    planId: plan.planId,
    planVersion: plan.planVersion,
    items: normalizedItems,
    calendarDeadline: plan.calendarDeadline,
  });

  return createHash('sha256').update(dataToHash).digest('hex');
}

export function issuePlanApproval(
  plan: ReturnActionPlan,
  userConfirmed: boolean
): ReturnActionPlan {
  if (!userConfirmed) {
    throw new Error('USER_CONFIRMATION_REQUIRED: Plan cannot be approved without explicit user consent.');
  }

  // Ensure current plan is intact
  const expectedHash = generatePlanHash(plan);
  if (expectedHash !== plan.planHash) {
    throw new Error('TAMPERED_PLAN_STATE: Plan contents do not match existing hash.');
  }

  // Generate cryptographically signed authorization token bound to hash and version
  const tokenSignature = createHmac('sha256', SERVER_SECRET_KEY)
    .update(`${plan.planId}:v${plan.planVersion}:${plan.planHash}`)
    .digest('hex');

  const authorizationToken = `auth_${plan.planId}_v${plan.planVersion}_${tokenSignature.substring(0, 16)}`;

  return {
    ...plan,
    approvalStatus: 'APPROVED',
    authorizationToken,
  };
}

export function validateExecutionAuthorization(
  plan: ReturnActionPlan,
  providedToken: string
): { valid: boolean; reason?: string } {
  // 1. Check approval state
  if (plan.approvalStatus !== 'APPROVED') {
    return {
      valid: false,
      reason: `INVALID_STATE: Plan approval status is '${plan.approvalStatus}'. Expected 'APPROVED'.`,
    };
  }

  // 2. Check expiration TTL
  if (Date.now() > new Date(plan.expiresAt).getTime()) {
    return {
      valid: false,
      reason: 'EXPIRED_PLAN: Approval authorization window has expired (15-minute TTL).',
    };
  }

  // 3. Cryptographic integrity check: verify plan hash matches current items & pathway
  const recalculatedHash = generatePlanHash(plan);
  if (recalculatedHash !== plan.planHash) {
    return {
      valid: false,
      reason: 'TAMPERED_PLAN: The items or pathways in this plan were altered after authorization was granted.',
    };
  }

  // 4. Verify token signature
  const expectedSignature = createHmac('sha256', SERVER_SECRET_KEY)
    .update(`${plan.planId}:v${plan.planVersion}:${recalculatedHash}`)
    .digest('hex');

  const expectedToken = `auth_${plan.planId}_v${plan.planVersion}_${expectedSignature.substring(0, 16)}`;

  const providedBuf = Buffer.from(providedToken);
  const expectedBuf = Buffer.from(expectedToken);

  if (
    providedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return {
      valid: false,
      reason: 'INVALID_AUTHORIZATION_TOKEN: Token signature mismatch or unauthorized actor.',
    };
  }

  return { valid: true };
}
