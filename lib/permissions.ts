import { checkPlanLimit, requireFeature } from "@/lib/gating";
import { getSessionContext } from "@/lib/auth";

export async function assertCanMutateCustomers() {
  const session = await getSessionContext();

  if (session.readOnlyMode) {
    return { allowed: false, message: "Workspace is in read-only mode because billing is overdue." };
  }

  return { allowed: true, message: null, session };
}

export async function assertCanSendCampaign() {
  const session = await getSessionContext();

  if (session.readOnlyMode) {
    return { allowed: false, message: "Campaigns are blocked while the subscription is overdue." };
  }

  const feature = requireFeature(session.planId, "birthdayCampaigns");
  return { allowed: feature.enabled, message: feature.message, session };
}

export async function assertPlanCapacity(usage: { staffCount: number; customerCount: number; remindersSent: number }) {
  const session = await getSessionContext();
  return checkPlanLimit(session.planId, usage);
}
