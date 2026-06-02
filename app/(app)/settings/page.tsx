import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BusinessProfileSettings } from "@/components/settings-controls";
import { SubscriptionSettings } from "@/components/subscription-settings";
import { getSessionContext } from "@/lib/auth";
import { getSettingsSnapshot } from "@/lib/db/settings";
import { getBillingSnapshot } from "@/lib/db/subscriptions";

function addOneMonth(date: Date) {
  const nextMonth = new Date(date);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return nextMonth;
}

export default async function SettingsPage() {
  const session = await getSessionContext();
  const [snapshot, billing] = session.salonId
    ? await Promise.all([
        getSettingsSnapshot(session.salonId).catch(() => null),
        getBillingSnapshot(session.salonId).catch(() => null),
      ])
    : [null, null];
  const config = snapshot?.config ?? {};

  return (
    <div className="min-w-0 space-y-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">Settings</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Manage your salon business profile.
        </p>
      </div>
      <Card className="max-w-2xl space-y-3">
        <Badge>Business profile</Badge>
        <p className="break-words">
          {snapshot?.salonName ?? "Salon name"}, {snapshot?.city || "city not set"}.
          GST and receipt identity are saved for billing defaults.
        </p>
        <BusinessProfileSettings
          salonName={snapshot?.salonName ?? session.salonName ?? ""}
          city={snapshot?.city ?? ""}
          config={config}
          brandingEnabled={snapshot?.brandingEnabled ?? false}
          readOnly={!session.salonId}
        />
      </Card>
      <SubscriptionSettings
        currentPlanId={billing?.planId ?? session.planId}
        status={billing?.status ?? session.subscriptionStatus}
        renewalDate={
          billing?.renewalDate ??
          billing?.nextBillingDate ??
          (billing?.planId === "free" && (billing.periodStartDate || billing.subscriptionCreatedAt)
            ? addOneMonth(billing.periodStartDate ?? billing.subscriptionCreatedAt)
            : null)
        }
        hasRemoteSubscription={Boolean(billing?.razorpaySubscriptionId)}
      />
    </div>
  );
}
