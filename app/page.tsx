import Link from "next/link";
import { ArrowRight, CalendarSync, CreditCard, MessageCircleMore, ShieldCheck, Sparkles, Users } from "lucide-react";

import { PlanCard } from "@/components/plan-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  { title: "Salon CRM", icon: Users, description: "Customer profiles, birthdays, notes, visit history, and preferred stylists in one shared timeline." },
  { title: "Smart Scheduling", icon: CalendarSync, description: "Calendar booking, walk-ins, reschedules, staff assignment, and front-desk visibility." },
  { title: "WhatsApp Automations", icon: MessageCircleMore, description: "Appointment reminders, revisit nudges, birthday offers, thank-you notes, and delivery tracking." },
  { title: "Recurring Billing", icon: CreditCard, description: "Razorpay subscription lifecycle with trial, renewal, grace period, failed payments, and read-only downgrade." },
  { title: "Role + Tenant Security", icon: ShieldCheck, description: "Salon-isolated data, server checks, middleware gating, and admin-only platform analytics." },
  { title: "Premium Experience", icon: Sparkles, description: "A polished SaaS cockpit for owners, receptionists, staff members, and your internal super admin team." },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-14">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Badge tone="warning">Built for salons, barbershops, beauty parlors, and grooming studios</Badge>
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
            SalonFlow keeps every chair booked, every customer remembered, and every subscription in control.
          </h1>
          <p className="max-w-2xl text-lg text-[var(--muted-foreground)]">
            A production-minded full-stack SaaS starter with multi-tenant isolation, owner dashboards, staff workflows, admin revenue intelligence, and WhatsApp automation hooks.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register"><Button size="lg">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/pricing"><Button variant="outline" size="lg">View Pricing</Button></Link>
            <Link href="/login"><Button variant="ghost" size="lg">Demo Login</Button></Link>
          </div>
        </div>
        <Card className="overflow-hidden bg-[linear-gradient(180deg,rgba(255,248,240,0.96),rgba(242,230,214,0.92))] text-[var(--foreground)]">
          <div className="space-y-4">
            <Badge className="bg-[var(--foreground)]/8 text-[var(--foreground)]">Live SaaS snapshot</Badge>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["MRR", "₹2.14L"],
                ["Active salons", "91"],
                ["Messages", "8,142"],
                ["Trials ending", "11"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-[var(--border)] bg-white/40 p-4">
                  <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
                  <p className="mt-2 text-3xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-white/40 p-5">
              <p className="text-sm text-[var(--muted-foreground)]">Automation coverage</p>
              <p className="mt-2 text-2xl font-semibold">Appointment reminders, birthday offers, revisit nudges, payment recovery.</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="space-y-4">
              <div className="inline-flex rounded-2xl bg-[var(--muted)] p-3">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">{feature.title}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{feature.description}</p>
            </Card>
          );
        })}
      </section>

      <section className="mt-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Pricing</p>
            <h2 className="text-3xl font-semibold">Simple monthly plans for every growth stage</h2>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <PlanCard planId="basic" />
          <PlanCard planId="pro" />
          <PlanCard planId="premium" />
        </div>
      </section>
    </main>
  );
}
