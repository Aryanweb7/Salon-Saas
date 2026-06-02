import { getSessionContext } from "@/lib/auth";
import { createInvoiceForSalon, listInvoicesForSalon } from "@/lib/db/invoices";
import { createInvoiceSchema } from "@/lib/billing/validation";
import { getSettingsSnapshot } from "@/lib/db/settings";

export async function GET(request: Request) {
  try {
    const session = await getSessionContext();

    if (!session.salonId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const invoices = await listInvoicesForSalon(session.salonId, {
      search: url.searchParams.get("search") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });

    return Response.json(invoices);
  } catch (error) {
    console.error("Failed to fetch invoices", error);
    return Response.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionContext();

    if (!session.salonId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.readOnlyMode) {
      return Response.json({ error: "Your free trial has ended. Upgrade to a plan to continue using all features." }, { status: 403 });
    }

    const payload = createInvoiceSchema.safeParse(await request.json());

    if (!payload.success) {
      return Response.json({ error: payload.error.issues[0]?.message ?? "Invalid invoice data" }, { status: 400 });
    }

    const settings = await getSettingsSnapshot(session.salonId).catch(() => null);
    const config = settings?.config ?? {};
    const salonName = settings?.salonName || session.salonName || "Salon";

    const invoice = await createInvoiceForSalon(
      session.salonId,
      salonName,
      {
        ...payload.data,
        salonAddress: payload.data.salonAddress || settings?.city || "",
        salonContactNumber: payload.data.salonContactNumber || config.contactNumber || "",
        salonGstNumber: payload.data.salonGstNumber || config.gstNumber || "",
      },
    );

    return Response.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Failed to create invoice", error);
    return Response.json({ error: error instanceof Error ? error.message : "Failed to create invoice" }, { status: 500 });
  }
}
