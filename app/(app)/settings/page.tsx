import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  BusinessProfileSettings,
  WhatsappTemplateSettings,
} from "@/components/settings-controls";
import { getSessionContext } from "@/lib/auth";
import { getSettingsSnapshot } from "@/lib/db/settings";

const templateChecklist = [
  "Appointment reminder template with customer name, service, date, and time variables",
  "30-day revisit nudge template with comeback offer wording",
  "Birthday offer template with coupon or gift benefit",
  "Fallback support template for manual follow-up when delivery fails",
];

const optInPlan = [
  "Collect opt-in during walk-in registration, online booking, and invoice checkout",
  "Store consent source and timestamp before enabling marketing reminders",
  "Offer a simple opt-out phrase in every promotional template",
  "Keep transactional reminders separate from promotional birthday and revisit campaigns",
];

export default async function SettingsPage() {
  const session = await getSessionContext();
  const snapshot = session.salonId ? await getSettingsSnapshot(session.salonId) : null;
  const config = snapshot?.config ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold">Settings</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Branding, template settings, and team-level operational defaults.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-3">
          <Badge>Business profile</Badge>
          <p>
            {snapshot?.salonName ?? "Salon name"}, {snapshot?.city || "city not set"}.
            GST and receipt identity are saved for billing defaults.
          </p>
          <BusinessProfileSettings
            salonName={snapshot?.salonName ?? session.salonName ?? ""}
            city={snapshot?.city ?? ""}
            config={config}
            brandingEnabled={snapshot?.brandingEnabled ?? false}
            readOnly={session.readOnlyMode || !session.salonId}
          />
        </Card>
        <Card className="space-y-3">
          <Badge tone="warning">WhatsApp templates</Badge>
          <p>
            Manage reminder timing, birthday offers, revisit nudges, and approved message templates.
          </p>
          <WhatsappTemplateSettings
            config={config}
            readOnly={session.readOnlyMode || !session.salonId}
          />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">WhatsApp automation coverage</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Daily automation now queues appointment reminders, 30-day revisit nudges, and birthday offers.
              </p>
            </div>
            <Badge tone="success">Active flow</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border p-4">
              <p className="text-sm font-medium">Appointment reminder</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Queued around 24 hours before upcoming appointments.</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-sm font-medium">Revisit after 30 days</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Triggered from the customer&apos;s `lastVisitAt` date.</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-sm font-medium">Birthday offer</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Queued for 9:00 AM on the customer&apos;s birthday.</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <Badge tone="warning">Opt-in rollout plan</Badge>
          <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
            {optInPlan.map((item) => (
              <div key={item} className="rounded-2xl border p-3">
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Template approval plan</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Create and approve these customer-facing templates before enabling production sends.
            </p>
          </div>
          <Badge>Template checklist</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {templateChecklist.map((item) => (
            <div key={item} className="rounded-2xl border p-4 text-sm text-[var(--muted-foreground)]">
              {item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
