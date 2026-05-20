import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BusinessProfileSettings } from "@/components/settings-controls";
import { getSessionContext } from "@/lib/auth";
import { getSettingsSnapshot } from "@/lib/db/settings";

export default async function SettingsPage() {
  const session = await getSessionContext();
  const snapshot = session.salonId ? await getSettingsSnapshot(session.salonId) : null;
  const config = snapshot?.config ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold">Settings</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Manage your salon business profile.
        </p>
      </div>
      <Card className="max-w-2xl space-y-3">
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
          readOnly={!session.salonId}
        />
      </Card>
    </div>
  );
}
