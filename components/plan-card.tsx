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
        <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 text-[var(--success)]" /> {plan.reminderLimit ?? "Unlimited"} WhatsApp reminders</li>
        {Object.entries(plan.features).filter(([, enabled]) => enabled).slice(0, 4).map(([feature]) => (
          <li key={feature} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 text-[var(--success)]" /> {feature}</li>
        ))}
      </ul>
      <SubscribeButton planId={planId} className="mt-auto" />
    </Card>
  );
}

