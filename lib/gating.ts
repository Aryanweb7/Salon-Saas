import { canUseFeature, PLAN_DEFINITIONS } from "@/lib/plans";
import type { FeatureKey, PlanId, SubscriptionStatus } from "@/lib/types";

export interface UsageSnapshot {
  staffCount: number;
  customerCount: number;
  remindersSent: number;
}

export function getReadOnlyReason(status: SubscriptionStatus) {
  if (status === "overdue") return "Your account is overdue after the 3-day grace period and is now in read-only mode.";
  if (status === "expired") return "Your subscription has expired. Renew to restore editing and automations.";
  if (status === "canceled") return "This subscription is canceled. Reactivate to resume operations.";
  if (status === "paused") return "This workspace is paused. Resume billing to edit data again.";
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
    message: canUseFeature(planId, feature) ? null : `Upgrade to ${planId === "basic" ? "Pro" : "Premium"} to unlock ${feature}.`,
  };
}
