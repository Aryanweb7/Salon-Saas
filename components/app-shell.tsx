
import Link from "next/link";
import { CustomSignOutButton } from "@/components/sign-out-button";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Users,
  WandSparkles,
  TrendingUp,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessionContext } from "@/lib/auth";
import { getAdminOverview } from "@/lib/db/salons";
import { formatCurrencyValue } from "@/lib/admin-utils";
import { getReadOnlyReason } from "@/lib/gating";

const ownerNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/visits", label: "Visits", icon: Sparkles },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/salons", label: "Salons", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/support", label: "Support", icon: Bell },
];

export async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionContext();
  const isAdmin = session.role === "SUPER_ADMIN";
  const navigation = isAdmin ? adminNav : ownerNav;

  // Fetch admin metrics if admin
  let adminMetrics = null;
  if (isAdmin) {
    adminMetrics = await getAdminOverview();
  }

  const readOnlyReason = session.readOnlyMode ? getReadOnlyReason(session.subscriptionStatus) : null;

  return (
    <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
      <aside className={`border-r p-5 ${isAdmin ? "bg-gray-950 border-gray-800" : "border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_72%,transparent)]"}`}>
        {/* Brand */}
        <Card className={`mb-5 ${isAdmin ? "bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700" : "bg-[linear-gradient(135deg,rgba(181,93,51,0.18),rgba(31,59,53,0.18))]"}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-2xl p-3 ${isAdmin ? "bg-blue-500/20" : "bg-[var(--foreground)]/10"}`}>
              <WandSparkles className={`h-5 w-5 ${isAdmin ? "text-blue-400" : ""}`} />
            </div>

            <div>
              <p className="text-lg font-semibold">SalonFlow</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {isAdmin ? "Platform command center" : "Run, retain, and scale every chair."}
              </p>
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className={`mb-5 space-y-1 ${isAdmin ? "bg-gray-900/30 rounded-lg p-2" : ""}`}>
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isAdmin ? "hover:bg-gray-800 text-gray-300 hover:text-white" : "hover:bg-[var(--muted)]"}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Admin Metrics Section */}
        {isAdmin && adminMetrics && (
          <Card className="mb-5 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 space-y-4">
            <div>
              <p className="text-xs uppercase font-semibold tracking-widest text-gray-500 mb-3">
                Platform Metrics
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400">Current MRR</p>
                  <p className="text-lg font-bold text-blue-400 mt-1">
                    {formatCurrencyValue(adminMetrics.mrr)}
                  </p>
                </div>
                <div className="h-px bg-gray-700" />
                <div>
                  <p className="text-xs text-gray-400">Active Clients</p>
                  <p className="text-lg font-bold text-green-400 mt-1">
                    {adminMetrics.activeSubscriptions}
                  </p>
                </div>
                <div className="h-px bg-gray-700" />
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  <div>
                    <p className="text-xs text-gray-400">Growth</p>
                    <p className="text-lg font-bold text-purple-400 mt-1">
                      +{adminMetrics.newSignups}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* User Profile */}
        <Card className={isAdmin ? "bg-gray-900 border-gray-700" : ""}>
          <div>
            <p className="font-medium">{session.user?.name}</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {session.user?.email}
            </p>
          </div>

          <Badge
            tone={
              session.role === "SUPER_ADMIN"
                ? "warning"
                : "success"
            }
          >
            {session.role === "SUPER_ADMIN"
              ? "Platform owner"
              : `Plan: ${session.planId}`}
          </Badge>

          <div className="flex gap-2">
            <ThemeToggle />

            <CustomSignOutButton />
          </div>
        </Card>
      </aside>

      <main className={`p-4 md:p-8 ${isAdmin ? "bg-gray-950" : ""}`}>
        {readOnlyReason ? (
          <Card className="mb-6 border-[var(--danger)]/30 bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--danger)]">
                  Read-only mode
                </p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">{readOnlyReason}</p>
              </div>
              <Badge tone="danger">{session.subscriptionStatus.replace("_", " ")}</Badge>
            </div>
          </Card>
        ) : null}
        {children}
      </main>
    </div>
  );
}
