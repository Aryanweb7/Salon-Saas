import { CustomersClient } from "@/components/customers-client";
import { getSessionContext } from "@/lib/auth";
import { listCustomersForSalon, listStaffOptionsForSalon } from "@/lib/db/customers";

export default async function CustomersPage() {
  const session = await getSessionContext();
  const [customers, staffOptions] = session.salonId
    ? await Promise.all([listCustomersForSalon(session.salonId), listStaffOptionsForSalon(session.salonId)])
    : [[], []];

  return <CustomersClient initialCustomers={customers} staffOptions={staffOptions} readOnly={false} />;
}
