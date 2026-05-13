import { CustomersClient } from "@/components/customers-client";
import { getSessionContext } from "@/lib/auth";
import { listCustomersForSalon } from "@/lib/db/customers";

export default async function CustomersPage() {
  const session = await getSessionContext();
  const customers = session.salonId ? await listCustomersForSalon(session.salonId) : [];

  return <CustomersClient initialCustomers={customers} />;
}
