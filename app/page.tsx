import Link from "next/link";
import {
  ArrowRight,
  CalendarSync,
  CreditCard,
  Mail,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    title: "Customer CRM",
    icon: Users,
    description: "Save searchable customer profiles with phone numbers, emails, birthdays, notes, preferred staff, and visit history.",
  },
  {
    title: "Appointments",
    icon: CalendarSync,
    description: "Create bookings with searchable customer selection, send confirmation emails, and auto-complete old appointments.",
  },
  {
    title: "Email Campaigns",
    icon: Megaphone,
    description: "Build polished email campaigns with templates, audience targeting, live preview, and monthly plan limits.",
  },
  {
    title: "Billing Plans",
    icon: CreditCard,
    description: "Use Free, Basic, or Pro plans with Razorpay subscriptions for paid upgrades.",
  },
  {
    title: "Reports",
    icon: ShieldCheck,
    description: "Track revenue, returning customers, booking demand, and salon growth without clutter.",
  },
  {
    title: "Automated Email",
    icon: Mail,
    description: "Send appointment confirmation emails and control monthly email usage by Free, Basic, and Pro plans.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 md:px-8 md:py-12">
      <section className="grid items-center gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
        <div className="space-y-5 sm:space-y-6">
          <Badge tone="warning">Built for salons, barbershops, beauty parlors, and grooming studios</Badge>
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
            SalonFlow helps salon owners manage bookings, customers, visits, and email campaigns.
          </h1>
          <p className="max-w-2xl text-base text-[var(--muted-foreground)] sm:text-lg">
            Run daily salon operations from one focused workspace: searchable customer records, appointment
            confirmations, visit billing, staff management, reports, and plan-based email marketing.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link className="w-full sm:w-auto" href="/register">
              <Button className="w-full sm:w-auto" size="lg">
                Signup <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link className="w-full sm:w-auto" href="/login">
              <Button className="w-full sm:w-auto" variant="outline" size="lg">
                Login
              </Button>
            </Link>
          </div>
        </div>

        <Card className="overflow-hidden text-[var(--foreground)]">
          <div className="space-y-4">
            <Badge className="bg-[var(--foreground)]/8 text-[var(--foreground)]">Salon owner toolkit</Badge>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Plans", "Free, Basic, Pro"],
                ["Customers", "Search + history"],
                ["Emails", "5 / 10 / 20 monthly"],
                ["Billing", "Razorpay"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[var(--border)] bg-white/40 p-4 sm:rounded-3xl">
                  <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
                  <p className="mt-2 break-words text-2xl font-semibold sm:text-3xl">{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/40 p-5 sm:rounded-3xl">
              <p className="text-sm text-[var(--muted-foreground)]">Daily operations</p>
              <p className="mt-2 text-xl font-semibold sm:text-2xl">
                Appointments, visit records, staff, reports, email campaigns, and subscription billing.
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="space-y-4">
              <div className="inline-flex rounded-2xl bg-[var(--muted)] p-3">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold sm:text-xl">{feature.title}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{feature.description}</p>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
