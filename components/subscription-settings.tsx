import { CalendarDays, Check, CreditCard, Sparkles } from "lucide-react";

import { CancelSubscriptionButton } from "@/components/cancel-subscription-button";
import { SubscribeButton } from "@/components/subscribe-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import type { PlanId, SubscriptionStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type SubscriptionSettingsProps = {
  currentPlanId: PlanId;
  status: SubscriptionStatus;
  renewalDate: Date | null;
  hasRemoteSubscription: boolean;
};

const planBenefits: Record<PlanId, string[]> = {
  free: [
    "1 month full access",
    "Unlimited staff and customers",
    "Unlimited campaign sends",
    "All feature modules enabled",
  ],
  basic: [
    "10 staff users",
    "Unlimited customers",
    "Advanced reports and commissions",
    "Birthday campaigns",
  ],
  pro: [
    "10 staff users",
    "Unlimited customers",
    "Advanced reports and commissions",
    "Birthday campaigns",
  ],
};

function formatDate(date: Date | null) {
  if (!date) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusTone(status: SubscriptionStatus) {
  if (status === "active") return "success";
  if (status === "past_due") return "warning";
  return "danger";
}

export function SubscriptionSettings({
  currentPlanId,
  status,
  renewalDate,
  hasRemoteSubscription,
}: SubscriptionSettingsProps) {
  const currentPlan = PLAN_DEFINITIONS[currentPlanId];
  const isPaidPlan = currentPlanId !== "free";

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold sm:text-2xl">Subscription</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Activate a plan and manage the benefits available to this salon.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/billing">Billing desk</a>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardDescription>Current subscription</CardDescription>
              <CardTitle className="mt-1 whitespace-nowrap">{currentPlan.name}</CardTitle>
            </div>
            <Badge tone={getStatusTone(status)}>{status.replace("_", " ")}</Badge>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] p-3">
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <CreditCard className="h-4 w-4" />
                {currentPlan.billingInterval === "year" ? "Annual price" : "Monthly price"}
              </div>
              <p className="mt-2 font-semibold">{formatCurrency(currentPlan.price)}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3">
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <CalendarDays className="h-4 w-4" />
                {isPaidPlan ? "Next renewal" : "Trial ends"}
              </div>
              <p className="mt-2 font-semibold">{formatDate(renewalDate)}</p>
            </div>
          </div>

          {isPaidPlan && hasRemoteSubscription ? <CancelSubscriptionButton /> : null}
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(PLAN_DEFINITIONS) as PlanId[]).map((planId) => {
            const plan = PLAN_DEFINITIONS[planId];
            const isCurrent = planId === currentPlanId && status === "active";
            const canSubscribe = planId === "basic" || planId === "pro";

            return (
              <Card key={planId} className="flex h-full flex-col gap-4 rounded-lg">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {plan.mostPopular ? <Sparkles className="h-4 w-4 text-[var(--accent)]" /> : null}
                      <CardTitle className="whitespace-nowrap">{plan.name}</CardTitle>
                    </div>
                    <p className="mt-1 text-2xl font-bold">
                      {formatCurrency(plan.price)}
                      <span className="text-sm font-normal text-[var(--muted-foreground)]">/{plan.billingInterval}</span>
                    </p>
                  </div>
                  {isCurrent ? <Badge tone="success">Active</Badge> : plan.mostPopular ? <Badge tone="warning">Popular</Badge> : null}
                </div>

                <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
                  {planBenefits[planId].map((benefit) => (
                    <li key={benefit} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {isCurrent ? (
                    <div className="flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 text-sm font-semibold">
                      Current plan
                    </div>
                  ) : canSubscribe ? (
                    <SubscribeButton
                      planId={planId}
                      label={`Activate ${plan.name}`}
                      redirectTo="/settings"
                      className="w-full"
                    />
                  ) : (
                    <div className="flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--muted-foreground)]">
                      Included on signup
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
