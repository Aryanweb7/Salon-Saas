import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessionContext } from "@/lib/auth";
import { listStaffReport } from "@/lib/db/reports";
import { formatCurrency } from "@/lib/utils";

export default async function StaffPage() {
  const session = await getSessionContext();
  const staff = await listStaffReport(session.salonId ?? "");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-semibold">Staff management</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">Roles, commission rates, attendance, and performance stats with plan-aware user caps.</p>
        </div>
        <Button>Add Staff Member</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {staff.map((member) => (
          <Card key={member.name} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{member.name}</h2>
                <p className="text-sm text-[var(--muted-foreground)]">{member.role}</p>
              </div>
              <Badge tone={member.commission > 0 ? "success" : "default"}>{member.commission}% commission</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-[var(--muted)] p-3">
                <p className="text-[var(--muted-foreground)]">Attendance</p>
                <p className="mt-1 text-lg font-semibold">{member.attendance}</p>
              </div>
              <div className="rounded-2xl bg-[var(--muted)] p-3">
                <p className="text-[var(--muted-foreground)]">Sales</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(member.sales)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
