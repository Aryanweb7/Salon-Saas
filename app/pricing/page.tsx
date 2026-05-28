import { PlanCard } from "@/components/plan-card";

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <div className="mb-6 max-w-2xl sm:mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">Pricing built for local salons and growing chains</h1>
        <p className="mt-3 text-[var(--muted-foreground)]">Monthly subscriptions with recurring billing, tenant-safe infrastructure, and cancel-anytime flexibility.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        <PlanCard planId="free" />
        <PlanCard planId="basic" />
        <PlanCard planId="pro" />
      </div>
    </main>
  );
}
