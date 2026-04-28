import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { listSubscriptionCards } from "@/lib/db/subscriptions";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import { formatCurrency } from "@/lib/utils";
import { AdminMetricOverview } from "@/components/admin/admin-metric-overview";
import { Clock, CheckCircle2, AlertCircle, XCircle, Pause } from "lucide-react";

export default async function AdminSubscriptionsPage() {
  const salons = await listSubscriptionCards();

  // Calculate status counts
  const statusCounts = {
    active: salons.filter((s) => s.status === "active").length,
    trial: salons.filter((s) => s.status === "trial").length,
    pastDue: salons.filter((s) => s.status === "past_due").length,
    overdue: salons.filter((s) => s.status === "overdue").length,
    canceled: salons.filter((s) => s.status === "canceled").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Billing Operations
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
          Subscriptions
        </h1>
        <p className="mt-2 text-gray-400">
          Monitor trial, active, past due, overdue, expired, canceled, and paused accounts.
        </p>
      </div>

      {/* Status Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <AdminMetricOverview
          label="Active"
          value={statusCounts.active}
          color="green"
          icon={<CheckCircle2 />}
        />
        <AdminMetricOverview
          label="Trial"
          value={statusCounts.trial}
          color="blue"
          icon={<Clock />}
        />
        <AdminMetricOverview
          label="Past Due"
          value={statusCounts.pastDue}
          color="yellow"
          icon={<AlertCircle />}
        />
        <AdminMetricOverview
          label="Overdue"
          value={statusCounts.overdue}
          color="red"
          icon={<AlertCircle />}
        />
        <AdminMetricOverview
          label="Canceled"
          value={statusCounts.canceled}
          color="red"
          icon={<XCircle />}
        />
      </div>

      {/* Subscriptions Table */}
      <Card className="overflow-x-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Subscription Details</h2>
          <p className="mt-1 text-sm text-gray-400">
            Manage and monitor all active and inactive subscriptions
          </p>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Salon</TH>
              <TH>Plan</TH>
              <TH>Renewal Date</TH>
              <TH>Amount</TH>
              <TH>Status</TH>
              <TH>Action</TH>
            </TR>
          </THead>
          <TBody>
            {salons.map((salon) => {
              const planPrice = PLAN_DEFINITIONS[salon.plan]?.price || 0;
              const isAtRisk =
                salon.status === "past_due" ||
                salon.status === "overdue";

              return (
                <TR
                  key={salon.id}
                  className={isAtRisk ? "bg-red-500/5" : "hover:bg-gray-900/50"}
                >
                  <TD className="font-semibold text-white">{salon.name}</TD>
                  <TD className="text-gray-400">{salon.plan}</TD>
                  <TD className="text-sm text-gray-400">
                    {salon.renewalDate
                      ? new Date(salon.renewalDate).toISOString().slice(0, 10)
                      : "N/A"}
                  </TD>
                  <TD className="font-semibold text-white">
                    {formatCurrency(planPrice)}
                  </TD>
                  <TD>
                    <Badge
                      tone={
                        salon.status === "active"
                          ? "success"
                          : salon.status === "trial"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {salon.status}
                    </Badge>
                  </TD>
                  <TD>
                    {isAtRisk && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        Retry Payment
                      </Button>
                    )}
                    {!isAtRisk && (
                      <Button variant="ghost" size="sm" disabled>
                        —
                      </Button>
                    )}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>

      {/* Status Legend */}
      <Card className="bg-gray-900/30">
        <h3 className="text-sm font-semibold text-white mb-4">Subscription Status Reference</h3>
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div className="flex gap-2">
            <Badge tone="success">Active</Badge>
            <span className="text-gray-400">Subscription is valid and billing</span>
          </div>
          <div className="flex gap-2">
            <Badge tone="warning">Trial</Badge>
            <span className="text-gray-400">Free trial period running</span>
          </div>
          <div className="flex gap-2">
            <Badge tone="warning">Past Due</Badge>
            <span className="text-gray-400">Payment failed, in grace period</span>
          </div>
          <div className="flex gap-2">
            <Badge tone="danger">Overdue</Badge>
            <span className="text-gray-400">Grace period expired, read-only mode</span>
          </div>
          <div className="flex gap-2">
            <Badge tone="danger">Canceled</Badge>
            <span className="text-gray-400">Subscription ended, no access</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

