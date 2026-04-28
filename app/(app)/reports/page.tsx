import { AppointmentsChart } from "@/components/charts/appointments-chart";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getSessionContext } from "@/lib/auth";
import { getAppointmentSeries } from "@/lib/db/appointments";
import { getRevenueSeries, listStaffReport } from "@/lib/db/reports";
import { formatCurrency } from "@/lib/utils";

export default async function ReportsPage() {
  const session = await getSessionContext();
  const salonId = session.salonId ?? "";
  const [appointmentSeries, revenueSeries, staff] = await Promise.all([
    getAppointmentSeries(salonId),
    getRevenueSeries(salonId),
    listStaffReport(salonId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold">Reports</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Daily, weekly, monthly, repeat-customer, service, and staff performance intelligence.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle>Revenue report</CardTitle>
          <CardDescription className="mb-4">Daily to monthly revenue visibility.</CardDescription>
          <RevenueChart data={revenueSeries} />
        </Card>
        <Card>
          <CardTitle>Booking load</CardTitle>
          <CardDescription className="mb-4">Monitor peak days and staffing demand.</CardDescription>
          <AppointmentsChart data={appointmentSeries} />
        </Card>
      </div>
      <Card className="space-y-3">
        <CardTitle>Staff leaderboard</CardTitle>
        <CardDescription>Commission analytics and sales stats are plan-gated above Basic.</CardDescription>
        {staff.map((member) => (
          <div key={member.name} className="flex items-center justify-between rounded-2xl border p-4">
            <div>
              <p className="font-medium">{member.name}</p>
              <p className="text-sm text-[var(--muted-foreground)]">{member.role}</p>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(member.sales)}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
