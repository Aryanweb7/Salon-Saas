import { unstable_noStore as noStore } from "next/cache";

import { BillingClient } from "@/components/billing-client";
import { getSessionContext } from "@/lib/auth";
import { listCustomersForSalon } from "@/lib/db/customers";
import { listInvoicesForSalon } from "@/lib/db/invoices";
import { getSettingsSnapshot } from "@/lib/db/settings";

export default async function BillingPage() {
  noStore();

  const session = await getSessionContext();

  if (!session.salonId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">Billing</h1>
        <p className="text-[var(--muted-foreground)]">No salon is attached to this account.</p>
      </div>
    );
  }

  const [customers, invoices, settings] = await Promise.all([
    listCustomersForSalon(session.salonId),
    listInvoicesForSalon(session.salonId).catch(() => []),
    getSettingsSnapshot(session.salonId).catch(() => null),
  ]);

  return (
    <BillingClient
      customers={customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      }))}
      initialInvoices={invoices}
      salonName={settings?.salonName ?? session.salonName ?? "Salon"}
    />
  );
}
