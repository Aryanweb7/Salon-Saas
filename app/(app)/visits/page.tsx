import { VisitsClient } from "@/components/visits-client";
import { getSessionContext } from "@/lib/auth";
import { listCustomersForSalon, listStaffOptionsForSalon } from "@/lib/db/customers";
import { listVisitsForSalon } from "@/lib/db/reports";

export default async function VisitsPage() {
  const session = await getSessionContext();
  const salonId = session.salonId ?? "";
  const [customers, visits, staffOptions] = salonId
    ? await Promise.all([
        listCustomersForSalon(salonId),
        listVisitsForSalon(salonId),
        listStaffOptionsForSalon(salonId),
      ])
    : [[], [], []];

  return <VisitsClient initialCustomers={customers} initialVisits={visits} staffOptions={staffOptions} readOnly={false} />;
}
