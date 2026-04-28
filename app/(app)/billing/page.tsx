import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubscribeButton } from "@/components/subscribe-button";
import { getSessionContext } from "@/lib/auth";
import { listRecentPayments } from "@/lib/db/salons";
import { getSalonSubscription } from "@/lib/db/subscriptions";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import { formatCurrency } from "@/lib/utils";

export default async function BillingPage() {
  const session = await getSessionContext();
  const subscription = await getSalonSubscription(session.salonId ?? "");
  const payments = await listRecentPayments();
  const currentPlan = PLAN_DEFINITIONS[subscription.planId];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold">Billing</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Manage the current plan, renewal status, payment history, and upgrades.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.2fr]">
        <Card className="space-y-3">
          <Badge tone="success">Current Plan</Badge>
          <h2 className="text-3xl font-semibold">{currentPlan.name}</h2>
          <p className="text-[var(--muted-foreground)]">{formatCurrency(currentPlan.price)} monthly - renews on {subscription.renewalDate ? subscription.renewalDate.toDateString() : "TBD"}</p>
          <SubscribeButton planId="premium" />
        </Card>
        <Card className="space-y-3">
          <Badge tone="warning">Subscription Health</Badge>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
            <span>{session.subscriptionStatus === "active" ? "Active and inside billing cycle" : `Current status: ${session.subscriptionStatus}`}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-[var(--accent)]" />
            <span>3-day grace window supported on failed renewals</span>
          </div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--danger)]" />
            <span>Read-only mode auto-triggers on overdue accounts</span>
          </div>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold">Payment history</h2>
          {payments.map((payment) => (
            <div key={`${payment.salon}-${payment.date}`} className="flex items-center justify-between rounded-2xl border p-4">
              <div>
                <p className="font-medium">{payment.date}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{payment.method}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                <Badge tone={payment.status === "Paid" ? "success" : "danger"}>{payment.status}</Badge>
              </div>
            </div>
          ))}
          <Button variant="outline">Renew Now</Button>
        </Card>
      </div>
    </div>
  );
}
