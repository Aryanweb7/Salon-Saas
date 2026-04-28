import { AppointmentsChart } from "@/components/charts/appointments-chart";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getSessionContext } from "@/lib/auth";
import { getAppointmentSeries, getDashboardAppointmentStats, listAppointmentsForSalon } from "@/lib/db/appointments";
import { getCustomerStats } from "@/lib/db/customers";
import { getRevenueSeries, listStaffReport } from "@/lib/db/reports";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getSessionContext();
  const salonId = session.salonId ?? "";
  const [customerStats, appointmentStats, revenueSeries, appointmentSeries, appointments, staff] = await Promise.all([
    getCustomerStats(salonId),
    getDashboardAppointmentStats(salonId),
    getRevenueSeries(salonId),
    getAppointmentSeries(salonId),
    listAppointmentsForSalon(salonId),
    listStaffReport(salonId),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Owner dashboard</p>
          <h1 className="text-4xl font-semibold">Today&apos;s salon pulse</h1>
        </div>
        <Badge tone="success">All automations healthy</Badge>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Total customers" value={customerStats.totalCustomers.toString()} trend="+12% vs last month" />
        <MetricCard label="Today appointments" value={appointmentStats.todayAppointments.toString()} trend="+4 walk-ins" />
        <MetricCard label="This month revenue" value={formatCurrency(customerStats.monthRevenue)} trend="+18% growth" />
        <MetricCard label="Pending reminders" value={appointmentStats.pendingReminders.toString()} trend="92% delivery rate" />
        <MetricCard label="Staff count" value={staff.length.toString()} trend="1 new joiner" />
        <MetricCard label="Returning customers" value={formatPercent(customerStats.returningCustomers)} trend="+6 pts" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle>Revenue growth</CardTitle>
          <CardDescription className="mb-4">Daily and monthly collections across visits and retail add-ons.</CardDescription>
          <RevenueChart data={revenueSeries} />
        </Card>
        <Card>
          <CardTitle>Weekly booking demand</CardTitle>
          <CardDescription className="mb-4">Use staffing and walk-in forecasting to fill slow slots.</CardDescription>
          <AppointmentsChart data={appointmentSeries} />
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <CardTitle>Today&apos;s appointments</CardTitle>
            <CardDescription>Front-desk overview of arrivals, services, and assigned staff.</CardDescription>
          </div>
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div key={`${appointment.customer}-${appointment.time}`} className="flex flex-col justify-between gap-3 rounded-3xl border p-4 md:flex-row md:items-center">
                <div>
                  <p className="font-medium">{appointment.customer}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{appointment.service} with {appointment.staff}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--muted-foreground)]">{appointment.time}</span>
                  <Badge tone={appointment.status === "Pending" ? "warning" : "success"}>{appointment.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <CardTitle>Reminder queue</CardTitle>
            <CardDescription>WhatsApp automation logs with provider abstraction support.</CardDescription>
          </div>
          <div className="space-y-3">
            {appointmentStats.reminders.map((reminder) => (
              <div key={`${reminder.template}-${reminder.scheduledFor}`} className="rounded-3xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{reminder.template}</p>
                  <Badge tone={reminder.status === "Sent" ? "success" : reminder.status === "Failed" ? "danger" : "warning"}>{reminder.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{reminder.provider} - {reminder.scheduledFor}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
