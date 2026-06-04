"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Menu,
  Megaphone,
  Settings,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const mobileNav = [
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

export function MobileAppNav({
  salonName,
  email,
  planName,
  hasPaidPlan,
}: {
  salonName: string;
  email: string;
  planName: string;
  hasPaidPlan: boolean;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-[var(--background)]/95 px-3 py-3 backdrop-blur lg:hidden">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--foreground)]/10">
            <WandSparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-tight">SalonFlow</p>
            <p className="truncate text-xs text-[var(--muted-foreground)]">{salonName}</p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[min(88vw,22rem)] flex-col overflow-y-auto p-4">
              <SheetHeader className="pr-8 text-left">
                <SheetTitle className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--foreground)]/10">
                    <WandSparkles className="h-4 w-4" />
                  </span>
                  SalonFlow
                </SheetTitle>
                <SheetDescription className="truncate">{email}</SheetDescription>
              </SheetHeader>

              <nav className="mt-5 grid gap-1">
                {mobileNav.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;

                  return (
                    <SheetClose key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium",
                          active ? "bg-[var(--muted)] text-[var(--foreground)]" : "text-[var(--muted-foreground)]",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>

              <div className="mt-auto space-y-3 border-t pt-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{salonName}</p>
                  <p className="truncate text-xs text-[var(--muted-foreground)]">{email}</p>
                </div>
                <Badge className="w-fit" tone={hasPaidPlan ? "success" : "default"}>
                  Plan: {planName}
                </Badge>
                <LogoutButton className="h-11 w-full" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
