import { unstable_noStore as noStore } from "next/cache";

import { AppointmentsChart } from "@/components/charts/appointments-chart";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getSessionContext } from "@/lib/auth";
import { getAppointmentSeries, getDashboardAppointmentStats, listTodaysAppointmentsForSalon } from "@/lib/db/appointments";
import { getCustomerStats } from "@/lib/db/customers";
import { getRevenueSeries } from "@/lib/db/reports";
import { getStaffDashboardStats } from "@/lib/db/staff";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function DashboardPage() {
  noStore();

  const session = await getSessionContext();
  const salonId = session.salonId ?? "";
  const [customerStats, appointmentStats, revenueSeries, appointmentSeries, appointments, staffStats] = await Promise.all([
    getCustomerStats(salonId),
    getDashboardAppointmentStats(salonId),
    getRevenueSeries(salonId),
    getAppointmentSeries(salonId),
    listTodaysAppointmentsForSalon(salonId),
    getStaffDashboardStats(salonId),
  ]);
  return (
    <div className="min-w-0 space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="min-w-0">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Owner dashboard</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Today&apos;s salon pulse</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="success">All automations healthy</Badge>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Total customers" value={customerStats.totalCustomers.toString()} trend={customerStats.customerTrend} />
        <MetricCard label="Today appointments" value={appointmentStats.todayAppointments.toString()} trend={appointmentStats.appointmentTrend} />
        <MetricCard label="This month revenue" value={formatCurrency(customerStats.monthRevenue)} trend={customerStats.revenueTrend} />
        <MetricCard label="Staff count" value={staffStats.totalStaff.toString()} trend={staffStats.staffTrend} />
        <MetricCard label="Returning customers" value={formatPercent(customerStats.returningCustomers)} trend={customerStats.returningTrend} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="min-w-0">
          <CardTitle>Revenue growth</CardTitle>
          <CardDescription className="mb-4">Daily and monthly collections across visits and retail add-ons.</CardDescription>
          <RevenueChart data={revenueSeries} />
        </Card>
        <Card className="min-w-0">
          <CardTitle>Weekly booking demand</CardTitle>
          <CardDescription className="mb-4">Use staffing and walk-in forecasting to fill slow slots.</CardDescription>
          <AppointmentsChart data={appointmentSeries} />
        </Card>
      </section>

      <section>
        <Card className="space-y-4">
          <div>
            <CardTitle>Today&apos;s appointments</CardTitle>
            <CardDescription>Front-desk overview of arrivals, services, and assigned staff.</CardDescription>
          </div>
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border p-4 md:flex-row md:items-center">
                <div className="min-w-0">
                  <p className="break-words font-medium">{appointment.customer}</p>
                  <p className="break-words text-sm text-[var(--muted-foreground)]">{appointment.service} with {appointment.staff}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <span className="text-sm text-[var(--muted-foreground)]">{appointment.time}</span>
                  <Badge tone={appointment.status === "Pending" ? "warning" : "success"}>{appointment.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
