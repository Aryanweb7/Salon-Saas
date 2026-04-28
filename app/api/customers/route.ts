import { getSessionContext } from "@/lib/auth";
import { listCustomersForSalon } from "@/lib/db/customers";

export async function GET(request: Request) {
  try {
    const session = await getSessionContext();

    if (!session.salonId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search");

    const customers = await listCustomersForSalon(session.salonId, search || undefined);

    return Response.json(customers);
  } catch (error) {
    return Response.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
