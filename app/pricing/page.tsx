import { PlanCard } from "@/components/plan-card";

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-4xl font-bold">Pricing built for local salons and growing chains</h1>
        <p className="mt-3 text-[var(--muted-foreground)]">All plans include a 14-day free trial, recurring monthly billing, and tenant-safe infrastructure.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <PlanCard planId="basic" />
        <PlanCard planId="pro" />
        <PlanCard planId="premium" />
      </div>
    </main>
  );
}
