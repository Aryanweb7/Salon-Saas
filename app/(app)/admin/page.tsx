import { Activity, TrendingUp, Users, AlertCircle, CreditCard, Clock } from "lucide-react";

import { AdminKPICard } from "@/components/admin/admin-kpi-card";
import { AdminDateFilter } from "@/components/admin/admin-date-filter";
import { AdminHealthBadge } from "@/components/admin/admin-health-badge";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getAdminOverview, listRecentPayments, listSalons } from "@/lib/db/salons";
import {
  formatCurrencyValue,
  formatMetricTrend,
  calculateChurnRate,
  calculateClientHealth,
  daysSinceDate,
  getSubscriptionStatusColor,
} from "@/lib/admin-utils";
import { getRevenueSeries } from "@/lib/db/reports";
import { formatCurrency } from "@/lib/utils";

export default async function AdminPage() {
  const [adminMetrics, payments, salons, revenueSeries] = await Promise.all([
    getAdminOverview(),
    listRecentPayments(),
    listSalons(),
    getRevenueSeries("admin"),
  ]);

  // Calculate metrics
  const mrrTrend = formatMetricTrend(
    adminMetrics.mrr,
    Math.round(adminMetrics.mrr * 0.92)
  );
  const churnRate = calculateChurnRate(
    adminMetrics.totalSalons,
    adminMetrics.churnedSalons
  );
  const trialExpiringSoon = adminMetrics.trialUsers;

  // Calculate client health distribution
  const clientHealthStats = salons.reduce(
    (acc, salon) => {
      const health = calculateClientHealth(
        salon.status,
        daysSinceDate(new Date(salon.lastLogin ?? new Date().toISOString()))
      );
      acc[health]++;
      return acc;
    },
    { green: 0, yellow: 0, red: 0 }
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Platform Overview
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
            Command Center
          </h1>
          <p className="mt-2 text-gray-400">
            Track revenue, subscriptions, client health, and growth metrics.
          </p>
        </div>
        <AdminDateFilter />
      </div>

      {/* KPI Cards Grid - 6 Premium Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AdminKPICard
          label="Monthly Recurring Revenue"
          value={formatCurrencyValue(adminMetrics.mrr)}
          trend={mrrTrend}
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <AdminKPICard
          label="Active Salons"
          value={adminMetrics.activeSubscriptions}
          trend={{
            value: adminMetrics.newSignups,
            isPositive: true,
          }}
          icon={<Users className="h-5 w-5" />}
        />

        <AdminKPICard
          label="Trial Users"
          value={adminMetrics.trialUsers}
          trend={{
            value: trialExpiringSoon,
            isPositive: false,
          }}
          icon={<Clock className="h-5 w-5" />}
        />

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
          label="Failed Payments"
          value={adminMetrics.failedPayments}
          trend={{
            value: 1,
            isPositive: false,
          }}
          icon={<CreditCard className="h-5 w-5" />}
        />

        <AdminKPICard
          label="Overdue Accounts"
          value={adminMetrics.overdueSalons}
          trend={{
            value: Math.round((adminMetrics.overdueSalons / adminMetrics.totalSalons) * 100),
            isPositive: false,
          }}
          icon={<AlertCircle className="h-5 w-5" />}
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* MRR Growth Chart - Large */}
        <Card className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">MRR Growth</h2>
            <p className="mt-1 text-sm text-gray-400">
              12-month recurring revenue trend
            </p>
          </div>
          <RevenueChart data={revenueSeries} />
        </Card>

        {/* Plan Distribution */}
        <Card className="flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Plan Distribution</h2>
            <p className="mt-1 text-sm text-gray-400">Active subscriptions by plan</p>
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Basic</span>
              <span className="text-lg font-semibold text-white">
                {Math.round(
                  salons.filter((s) => s.plan === "basic").length / salons.length * 100
                )}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-700">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: `${
                    salons.filter((s) => s.plan === "basic").length / salons.length * 100
                  }%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-400">Pro</span>
              <span className="text-lg font-semibold text-white">
                {Math.round(
                  salons.filter((s) => s.plan === "pro").length / salons.length * 100
                )}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-700">
              <div
                className="h-full rounded-full bg-purple-600"
                style={{
                  width: `${
                    salons.filter((s) => s.plan === "pro").length / salons.length * 100
                  }%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-400">Premium</span>
              <span className="text-lg font-semibold text-white">
                {Math.round(
                  salons.filter((s) => s.plan === "premium").length / salons.length * 100
                )}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-700">
              <div
                className="h-full rounded-full bg-amber-600"
                style={{
                  width: `${
                    salons.filter((s) => s.plan === "premium").length / salons.length * 100
                  }%`,
                }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Health & Payments Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Client Health Monitor */}
        <Card>
          <h2 className="text-lg font-semibold text-white">Client Health</h2>
          <p className="mt-1 text-sm text-gray-400 mb-6">Status distribution</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <AdminHealthBadge status="green" label="Active & Engaged" />
              <span className="text-lg font-semibold text-green-400">
                {clientHealthStats.green}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <AdminHealthBadge status="yellow" label="Low Usage" />
              <span className="text-lg font-semibold text-yellow-400">
                {clientHealthStats.yellow}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <AdminHealthBadge status="red" label="At Risk" />
              <span className="text-lg font-semibold text-red-400">
                {clientHealthStats.red}
              </span>
            </div>
          </div>
        </Card>

        {/* Recent Payments Table - 2 cols */}
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-white">Recent Payments</h2>
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Salon</TH>
                  <TH>Plan</TH>
                  <TH>Amount</TH>
                  <TH>Date</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {payments.slice(0, 5).map((payment) => (
                  <TR key={`${payment.salon}-${payment.date}`}>
                    <TD className="font-medium text-white">{payment.salon}</TD>
                    <TD className="text-gray-400">{payment.method}</TD>
                    <TD className="font-semibold text-white">
                      {formatCurrency(payment.amount)}
                    </TD>
                    <TD className="text-gray-400 text-sm">{payment.date}</TD>
                    <TD>
                      <Badge
                        tone={
                          payment.status === "Paid" ? "success" : "danger"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* All Salons Overview */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-white">All Salons Overview</h2>
        <p className="mb-4 text-sm text-gray-400">Quick health scan across clients</p>
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Salon</TH>
                <TH>Owner</TH>
                <TH>City</TH>
                <TH>Plan</TH>
                <TH>Status</TH>
                <TH>Renewal</TH>
                <TH>Last Login</TH>
              </TR>
            </THead>
            <TBody>
              {salons.slice(0, 10).map((salon) => (
                <TR key={salon.id}>
                  <TD className="font-medium text-white">{salon.name}</TD>
                  <TD className="text-gray-400">{salon.owner}</TD>
                  <TD className="text-gray-400">{salon.city}</TD>
                  <TD>
                    <Badge>{salon.plan}</Badge>
                  </TD>
                  <TD>
                    <Badge
                      tone={
                        salon.status === "active"
                          ? "success"
                          : salon.status === "overdue"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {salon.status}
                    </Badge>
                  </TD>
                  <TD className="text-sm text-gray-400">{salon.renewalDate}</TD>
                  <TD className="text-sm text-gray-400">{salon.lastLogin}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
