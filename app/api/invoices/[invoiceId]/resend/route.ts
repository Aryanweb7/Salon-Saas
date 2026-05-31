import { getSessionContext } from "@/lib/auth";
import { resendInvoiceForSalon } from "@/lib/db/invoices";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  try {
    const session = await getSessionContext();
    const { invoiceId } = await params;

    if (!session.salonId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await resendInvoiceForSalon(session.salonId, invoiceId);
    return Response.json(invoice);
  } catch (error) {
    console.error("Failed to resend invoice", error);
    return Response.json({ error: error instanceof Error ? error.message : "Failed to resend invoice" }, { status: 500 });
  }
}
