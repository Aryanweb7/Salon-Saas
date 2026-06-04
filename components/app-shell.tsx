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

import { MobileAppNav } from "@/components/mobile-app-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessionContext } from "@/lib/auth";
import { PLAN_DEFINITIONS } from "@/lib/plans";
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
  const hasPaidPlan = session.planId !== "free";
  const planName = PLAN_DEFINITIONS[session.planId].name;

  return (
    <div className="min-h-screen min-w-0 lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <MobileAppNav
        salonName={session.salonName ?? "Salon"}
        email={session.user?.email ?? session.email ?? ""}
        planName={planName}
        hasPaidPlan={hasPaidPlan}
      />
      <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-[var(--border)] bg-[var(--background)] p-5 lg:block">
        {/* Brand */}
        <Card className="mb-4 lg:mb-5">
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-2xl bg-[var(--foreground)]/10 p-3">
              <WandSparkles className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-lg font-semibold">SalonFlow</p>
              <p className="truncate text-sm text-[var(--muted-foreground)]">
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
                className="flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* User Profile */}
        <Card className="space-y-3 p-4 lg:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start">
            <div className="min-w-0">
              <p className="truncate font-medium">{session.salonName ?? "Salon"}</p>
              <p className="truncate text-sm text-[var(--muted-foreground)]">
                {session.user?.email ?? session.email ?? ""}
              </p>
            </div>

            <Badge className="w-fit" tone={hasPaidPlan ? "success" : "default"}>
              Plan: {planName}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <ThemeToggle />
            <LogoutButton className="h-10 px-4" />
          </div>
        </Card>
      </aside>

      <main className="min-w-0 overflow-x-hidden px-3 py-4 sm:px-4 md:px-6 md:py-6 xl:px-8 xl:py-8">
        {children}
      </main>
    </div>
  );
}
