import { getSessionContext } from "@/lib/auth";
import { getInvoiceForSalon } from "@/lib/db/invoices";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  try {
    const session = await getSessionContext();
    const { invoiceId } = await params;

    if (!session.salonId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await getInvoiceForSalon(session.salonId, invoiceId);

    if (!invoice) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    return Response.json(invoice);
  } catch (error) {
    console.error("Failed to fetch invoice", error);
    return Response.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}
