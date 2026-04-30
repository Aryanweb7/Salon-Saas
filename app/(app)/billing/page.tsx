import { AlertTriangle, CheckCircle2, Clock3, CreditCard, Lock } from "lucide-react";

import { CancelSubscriptionButton } from "@/components/cancel-subscription-button";
import { SubscribeButton } from "@/components/subscribe-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getSessionContext } from "@/lib/auth";
import { listRecentPaymentsForSalon } from "@/lib/db/salons";
import { getBillingSnapshot } from "@/lib/db/subscriptions";
import { getReadOnlyReason } from "@/lib/gating";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import type { PlanId } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

function formatDate(value: Date | null | undefined) {
  return value ? value.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "TBD";
}

function getStatusTone(status: string) {
  if (status === "active") return "success";
  if (status === "trial" || status === "past_due") return "warning";
  if (status === "overdue" || status === "expired" || status === "canceled") return "danger";
  return "default";
}

function getStatusCopy(status: string) {
  if (status === "active") return "Billing is healthy and your workspace is fully editable.";
  if (status === "trial") return "You are inside the trial window. Your first paid cycle will start after checkout.";
  if (status === "past_due") return "A payment is overdue. The grace window is active before the workspace locks.";
  if (status === "overdue") return "The grace window has ended and the workspace is locked in read-only mode.";
  if (status === "expired") return "This subscription has expired. Renew to regain write access.";
  if (status === "canceled") return "This subscription is canceled. Start a new payment to restore access.";
  return `Current status: ${status}`;
}

export default async function BillingPage() {
  const session = await getSessionContext();

  if (!session.salonId) {
    return (
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold">Billing</h1>
        <p className="text-[var(--muted-foreground)]">No salon is attached to this account.</p>
      </div>
    );
  }

  const billing = await getBillingSnapshot(session.salonId);
  const payments = await listRecentPaymentsForSalon(session.salonId);
  const planId = billing?.planId ?? session.planId;
  const status = billing?.status ?? session.subscriptionStatus;
  const currentPlan = PLAN_DEFINITIONS[planId];
  const readOnlyReason = session.readOnlyMode ? getReadOnlyReason(status) : null;
  const upgradePlans = (Object.keys(PLAN_DEFINITIONS) as PlanId[]).filter((id) => PLAN_DEFINITIONS[id].price > currentPlan.price);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold">Billing</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Review subscription health, see upcoming charges, and manage plan changes.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Badge tone="success">Current plan</Badge>
            <Badge tone={getStatusTone(status)}>{status.replace("_", " ")}</Badge>
          </div>
          <div>
            <h2 className="text-3xl font-semibold">{currentPlan.name}</h2>
            <p className="mt-2 text-[var(--muted-foreground)]">{formatCurrency(currentPlan.price)} monthly</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Next payment date</p>
              <p className="mt-2 text-lg font-semibold">{formatDate(billing?.nextBillingDate ?? billing?.renewalDate)}</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Grace window ends</p>
              <p className="mt-2 text-lg font-semibold">{formatDate(billing?.graceEndsAt)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {upgradePlans.map((upgradePlanId) => (
              <SubscribeButton key={upgradePlanId} planId={upgradePlanId} className="min-w-[190px]" />
            ))}
            <CancelSubscriptionButton />
          </div>
        </Card>

        <Card className="space-y-4">
          <Badge tone="warning">Subscription health</Badge>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--success)]" />
            <div>
              <p className="font-medium">Current status</p>
              <p className="text-sm text-[var(--muted-foreground)]">{getStatusCopy(status)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
            <div>
              <p className="font-medium">Automatic unpaid detection</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Razorpay webhooks mark failed payments as past due, and the daily cron pushes accounts into overdue after the grace period.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 text-[var(--danger)]" />
            <div>
              <p className="font-medium">Read-only lock</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {readOnlyReason ?? "Editing remains available while billing is active or inside the grace window."}
              </p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-xl font-semibold">Payment history</h2>
          </div>
          {payments.length ? (
            payments.map((payment) => (
              <div key={`${payment.salon}-${payment.date}-${payment.amount}`} className="flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="font-medium">{payment.date}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{payment.method}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                  <Badge tone={payment.status === "Paid" ? "success" : payment.status === "Failed" ? "danger" : "default"}>
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-[var(--muted-foreground)]">
              No payments recorded yet for this salon.
            </div>
          )}
          {status === "past_due" || status === "overdue" ? (
            <div className="rounded-2xl border border-[var(--danger)]/30 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--danger)]" />
                <div>
                  <p className="font-medium">Unpaid balance needs attention</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Complete a new payment or move to a new plan to restore healthy billing state.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
