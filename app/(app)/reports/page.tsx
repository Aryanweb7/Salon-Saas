import { AppointmentsChart } from "@/components/charts/appointments-chart";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getSessionContext } from "@/lib/auth";
import { getAppointmentSeries } from "@/lib/db/appointments";
import { getRevenueSeries } from "@/lib/db/reports";

export default async function ReportsPage() {
  const session = await getSessionContext();
  const salonId = session.salonId ?? "";
  const [appointmentSeries, revenueSeries] = await Promise.all([
    getAppointmentSeries(salonId),
    getRevenueSeries(salonId),
  ]);

  return (
    <div className="min-w-0 space-y-6">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold sm:text-4xl">Reports</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Daily, weekly, monthly, repeat-customer, and service performance intelligence.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardTitle>Revenue report</CardTitle>
          <CardDescription className="mb-4">Daily to monthly revenue visibility.</CardDescription>
          <RevenueChart data={revenueSeries} />
        </Card>
        <Card className="min-w-0">
          <CardTitle>Booking load</CardTitle>
          <CardDescription className="mb-4">Monitor peak days and staffing demand.</CardDescription>
          <AppointmentsChart data={appointmentSeries} />
        </Card>
      </div>
    </div>
  );
}
