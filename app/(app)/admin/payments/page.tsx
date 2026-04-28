import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { listRecentPayments } from "@/lib/db/salons";
import { formatCurrency } from "@/lib/utils";
import { AdminKPICard } from "@/components/admin/admin-kpi-card";
import { CreditCard, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";

export default async function AdminPaymentsPage() {
  const payments = await listRecentPayments();

  // Calculate metrics
  const collectedThisMonth = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const failedThisMonth = payments
    .filter((p) => p.status === "Failed")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalRefunds = 0; // TODO: Get from database if available
  const averagePlanValue =
    collectedThisMonth > 0
      ? Math.round(collectedThisMonth / Math.max(payments.length, 1))
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Finance & Payments
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
          Payments
        </h1>
        <p className="mt-2 text-gray-400">
          Track successful renewals, failed captures, and webhook event processing.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminKPICard
          label="Collected This Month"
          value={formatCurrency(collectedThisMonth)}
          trend={{
            value: 12,
            isPositive: true,
          }}
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <AdminKPICard
          label="Failed This Month"
          value={formatCurrency(failedThisMonth)}
          trend={{
            value: 3,
            isPositive: false,
          }}
          icon={<AlertCircle className="h-5 w-5" />}
        />

        <AdminKPICard
          label="Total Refunds"
          value={formatCurrency(totalRefunds)}
          trend={{
            value: 0,
            isPositive: true,
          }}
          icon={<RefreshCw className="h-5 w-5" />}
        />

        <AdminKPICard
          label="Average Plan Value"
          value={formatCurrency(averagePlanValue)}
          trend={{
            value: 5,
            isPositive: true,
          }}
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      {/* Transactions Table */}
      <Card className="overflow-x-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
          <p className="mt-1 text-sm text-gray-400">
            Payment and subscription transaction history
          </p>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Salon</TH>
              <TH>Amount</TH>
              <TH>Method</TH>
              <TH>Date</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {payments.map((payment) => (
              <TR
                key={`${payment.salon}-${payment.date}`}
                className={
                  payment.status === "Failed"
                    ? "bg-red-500/5 hover:bg-red-500/10"
                    : "hover:bg-gray-900/50"
                }
              >
                <TD className="font-semibold text-white">{payment.salon}</TD>
                <TD className="font-semibold text-white">
                  {formatCurrency(payment.amount)}
                </TD>
                <TD className="text-sm text-gray-400">{payment.method}</TD>
                <TD className="text-sm text-gray-400">{payment.date}</TD>
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
      </Card>

      {/* Payment Insights */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10">
        <h2 className="text-lg font-semibold text-white mb-4">Payment Health</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-gray-400">Success Rate</p>
            <p className="mt-2 text-3xl font-bold text-green-400">
              {Math.round(
                (payments.filter((p) => p.status === "Paid").length / payments.length) *
                  100
              )}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Failed Payments</p>
            <p className="mt-2 text-3xl font-bold text-red-400">
              {payments.filter((p) => p.status === "Failed").length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Transactions</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">
              {payments.length}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

