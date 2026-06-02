import { checkPlanLimit, requireFeature } from "@/lib/gating";
import { getSessionContext } from "@/lib/auth";

export async function assertCanMutateWorkspace() {
  const session = await getSessionContext();

  if (session.readOnlyMode) {
    return { allowed: false, message: "Your free trial has ended. Upgrade to a plan to continue using all features.", session };
  }

  return { allowed: true, message: null, session };
}

export async function assertCanMutateCustomers() {
  return assertCanMutateWorkspace();
}

export async function assertCanSendCampaign() {
  const session = await getSessionContext();

  const feature = requireFeature(session.planId, "birthdayCampaigns");
  return { allowed: feature.enabled, message: feature.message, session };
}

export async function assertPlanCapacity(usage: { staffCount: number; customerCount: number; remindersSent: number }) {
  const session = await getSessionContext();
  return checkPlanLimit(session.planId, usage);
}
