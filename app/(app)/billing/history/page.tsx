import { unstable_noStore as noStore } from "next/cache";

import { InvoiceHistoryClient } from "@/components/invoice-history-client";
import { getSessionContext } from "@/lib/auth";
import { listInvoicesForSalon } from "@/lib/db/invoices";

export default async function InvoiceHistoryPage() {
  noStore();

  const session = await getSessionContext();

  if (!session.salonId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">Invoice History</h1>
        <p className="text-[var(--muted-foreground)]">No salon is attached to this account.</p>
      </div>
    );
  }

  const invoices = await listInvoicesForSalon(session.salonId).catch(() => []);

  return <InvoiceHistoryClient initialInvoices={invoices} />;
}
