import { Card } from "@/components/ui/card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { AppointmentsChart } from "@/components/charts/appointments-chart";
import { getAppointmentSeries, getDashboardAppointmentStats } from "@/lib/db/appointments";
import { getRevenueSeries } from "@/lib/db/reports";
import { getAdminOverview } from "@/lib/db/salons";
import { AdminKPICard } from "@/components/admin/admin-kpi-card";
import { TrendingUp, Users, Zap, AlertCircle } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const [appointmentSeries, revenueSeries, adminMetrics] = await Promise.all([
    getAppointmentSeries("admin"),
    getRevenueSeries("admin"),
    getAdminOverview(),
  ]);

  const churnRate = Math.round(
    (adminMetrics.churnedSalons / adminMetrics.totalSalons) * 100
  );
  const conversionRate = Math.round(
    (adminMetrics.activeSubscriptions / (adminMetrics.activeSubscriptions + adminMetrics.trialUsers)) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Business Intelligence
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
          Analytics
        </h1>
        <p className="mt-2 text-gray-400">
          Understand MRR, churn risk, low-usage clients, failed payments, and sign-up quality.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminKPICard
          label="Churn Rate"
          value={`${churnRate}%`}
          trend={{
            value: 2,
            isPositive: false,
          }}
          icon={<AlertCircle className="h-5 w-5" />}
        />

        <AdminKPICard
          label="Trial Conversion"
          value={`${conversionRate}%`}
          trend={{
            value: 8,
            isPositive: true,
          }}
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <AdminKPICard
          label="New Signups"
          value={adminMetrics.newSignups}
          trend={{
            value: 15,
            isPositive: true,
          }}
          icon={<Users className="h-5 w-5" />}
        />

        <AdminKPICard
          label="Platform Health"
          value={`${Math.round(((adminMetrics.activeSubscriptions / adminMetrics.totalSalons) * 100))}%`}
          trend={{
            value: 5,
            isPositive: true,
          }}
          icon={<Zap className="h-5 w-5" />}
        />
      </div>

      {/* Main Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">MRR Growth</h2>
          <p className="text-sm text-gray-400 mb-4">
            12-month monthly recurring revenue trend
          </p>
          <RevenueChart data={revenueSeries} />
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Platform Activity</h2>
          <p className="text-sm text-gray-400 mb-4">
            Surface low-usage salons and engagement changes
          </p>
          <AppointmentsChart data={appointmentSeries} />
        </Card>
      </div>

      {/* Detailed Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
          <h3 className="text-lg font-semibold text-white mb-4">Growth Metrics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Salons</span>
              <span className="text-2xl font-bold text-green-400">
                {adminMetrics.totalSalons}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">New This Month</span>
              <span className="text-2xl font-bold text-green-400">
                +{adminMetrics.newSignups}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Month-over-Month</span>
              <span className="text-2xl font-bold text-green-400">
                +{Math.round((adminMetrics.newSignups / adminMetrics.totalSalons) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Active Subscriptions</span>
              <span className="text-2xl font-bold text-emerald-400">
                {adminMetrics.activeSubscriptions}
              </span>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Metrics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Churn Rate</span>
              <span className="text-2xl font-bold text-red-400">{churnRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Churned Salons</span>
              <span className="text-2xl font-bold text-red-400">
                {adminMetrics.churnedSalons}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Overdue Accounts</span>
              <span className="text-2xl font-bold text-orange-400">
                {adminMetrics.overdueSalons}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Failed Payments</span>
              <span className="text-2xl font-bold text-orange-400">
                {adminMetrics.failedPayments}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-6">Trial-to-Paid Funnel</h3>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">Signups</span>
              <span className="text-sm font-semibold text-white">
                {adminMetrics.totalSalons + adminMetrics.newSignups}
              </span>
            </div>
            <div className="h-3 rounded-full bg-gray-700">
              <div className="h-full rounded-full bg-blue-600" style={{ width: "100%" }} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">Trials Started</span>
              <span className="text-sm font-semibold text-white">
                {adminMetrics.trialUsers}
              </span>
            </div>
            <div className="h-3 rounded-full bg-gray-700">
              <div
                className="h-full rounded-full bg-purple-600"
                style={{
                  width: `${(adminMetrics.trialUsers / (adminMetrics.totalSalons + adminMetrics.newSignups)) * 100}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">Converted to Paid</span>
              <span className="text-sm font-semibold text-white">
                {adminMetrics.activeSubscriptions}
              </span>
            </div>
            <div className="h-3 rounded-full bg-gray-700">
              <div
                className="h-full rounded-full bg-green-600"
                style={{
                  width: `${(adminMetrics.activeSubscriptions / (adminMetrics.totalSalons + adminMetrics.newSignups)) * 100}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">Dropped</span>
              <span className="text-sm font-semibold text-white">
                {adminMetrics.trialUsers - adminMetrics.activeSubscriptions}
              </span>
            </div>
            <div className="h-3 rounded-full bg-gray-700">
              <div
                className="h-full rounded-full bg-red-600"
                style={{
                  width: `${((adminMetrics.trialUsers - adminMetrics.activeSubscriptions) / (adminMetrics.totalSalons + adminMetrics.newSignups)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

