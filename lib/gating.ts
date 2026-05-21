import { canUseFeature, PLAN_DEFINITIONS } from "@/lib/plans";
import type { FeatureKey, PlanId, SubscriptionStatus } from "@/lib/types";

export interface UsageSnapshot {
  staffCount: number;
  customerCount: number;
  remindersSent: number;
}

export function getReadOnlyReason(status: SubscriptionStatus) {
  return null;
}

export function checkPlanLimit(planId: PlanId, usage: UsageSnapshot) {
  const plan = PLAN_DEFINITIONS[planId];

  return {
    staffAllowed: plan.staffLimit === null || usage.staffCount < plan.staffLimit,
    customersAllowed: plan.customerLimit === null || usage.customerCount < plan.customerLimit,
    remindersAllowed: plan.reminderLimit === null || usage.remindersSent < plan.reminderLimit,
  };
}

export function requireFeature(planId: PlanId, feature: FeatureKey) {
  return {
    enabled: canUseFeature(planId, feature),
    message: canUseFeature(planId, feature) ? null : `Upgrade to Pro to unlock ${feature}.`,
  };
}
