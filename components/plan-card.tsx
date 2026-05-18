import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SubscribeButton } from "@/components/subscribe-button";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import { formatCurrency } from "@/lib/utils";

export function PlanCard({ planId }: { planId: keyof typeof PLAN_DEFINITIONS }) {
  const plan = PLAN_DEFINITIONS[planId];

  return (
    <Card className="relative flex h-full flex-col gap-5">
      {plan.mostPopular ? <Badge className="absolute right-6 top-6" tone="warning">Most Popular</Badge> : null}
      <div>
        <h3 className="text-2xl font-semibold">{plan.name}</h3>
        <p className="mt-2 text-4xl font-bold">{formatCurrency(plan.price)}<span className="text-base font-normal text-[var(--muted-foreground)]">/month</span></p>
      </div>
      <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
        <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 text-[var(--success)]" /> {plan.staffLimit ?? "Unlimited"} staff users</li>
        <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 text-[var(--success)]" /> {plan.customerLimit ?? "Unlimited"} customers</li>
        <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 text-[var(--success)]" /> {plan.emailLimit ?? "Unlimited"} campaign emails/month</li>
      </ul>
      <div className="mt-auto space-y-3">
        {planId === "free" ? (
          <div className="flex h-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--muted)]/60 px-4 text-sm font-medium">
            Included on signup
          </div>
        ) : (
          <SubscribeButton planId={planId} className="w-full" />
        )}
        <p className="text-xs leading-5 text-[var(--muted-foreground)]">
          {planId === "free" ? "Limited free plan for getting started." : "Monthly subscription. Cancel anytime."}
        </p>
      </div>
    </Card>
  );
}
