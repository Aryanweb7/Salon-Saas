import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  Settings,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessionContext } from "@/lib/auth";
import { getReadOnlyReason } from "@/lib/gating";
import { LogoutButton } from "@/components/logout-button";

const ownerNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/visits", label: "Visits", icon: Sparkles },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionContext();
  const readOnlyReason = session.readOnlyMode ? getReadOnlyReason(session.subscriptionStatus) : null;
  const hasActivePlan = session.subscriptionStatus === "active" || session.subscriptionStatus === "past_due";

  return (
    <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_72%,transparent)] p-5">
        {/* Brand */}
        <Card className="mb-5 bg-[linear-gradient(135deg,rgba(181,93,51,0.18),rgba(31,59,53,0.18))]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--foreground)]/10 p-3">
              <WandSparkles className="h-5 w-5" />
            </div>

            <div>
              <p className="text-lg font-semibold">SalonFlow</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Run, retain, and scale every chair.
              </p>
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="mb-5 space-y-1">
          {ownerNav.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition hover:bg-[var(--muted)]"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* User Profile */}
        <Card className="space-y-3 p-5">
          <div className="min-w-0">
            <p className="truncate font-medium">{session.salonName ?? "Salon"}</p>
            <p className="truncate text-sm text-[var(--muted-foreground)]">
              {session.user?.email ?? session.email ?? ""}
            </p>
          </div>

          <Badge className="w-fit" tone={hasActivePlan ? "success" : "danger"}>
            {hasActivePlan ? `Plan: ${session.planId}` : `Subscription: ${session.subscriptionStatus.replace("_", " ")}`}
          </Badge>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <ThemeToggle />
            <LogoutButton className="h-10 px-4" />
          </div>
        </Card>
      </aside>

      <main className="p-4 md:p-8">
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
