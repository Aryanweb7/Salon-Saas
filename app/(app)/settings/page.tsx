import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold">Settings</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Branding, branch preferences, template settings, and team-level operational defaults.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="space-y-3">
          <Badge>Business profile</Badge>
          <p>Salon name, city, GST, tax behavior, and receipt identity.</p>
          <Button variant="outline">Edit profile</Button>
        </Card>
        <Card className="space-y-3">
          <Badge tone="warning">WhatsApp templates</Badge>
          <p>Manage provider selection, approved message templates, and automation timings.</p>
          <Button variant="outline">Open templates</Button>
        </Card>
        <Card className="space-y-3">
          <Badge tone="success">Branch settings</Badge>
          <p>Premium salons can add multiple branches with branch-wise reports and staff rosters.</p>
          <Button variant="outline">Manage branches</Button>
        </Card>
      </div>
    </div>
  );
}
