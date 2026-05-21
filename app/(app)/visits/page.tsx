import { VisitsClient } from "@/components/visits-client";
import { getSessionContext } from "@/lib/auth";
import { listCustomersForSalon } from "@/lib/db/customers";
import { listVisitsForSalon } from "@/lib/db/reports";

export default async function VisitsPage() {
  const session = await getSessionContext();
  const salonId = session.salonId ?? "";
  const [customers, visits] = salonId
    ? await Promise.all([
        listCustomersForSalon(salonId),
        listVisitsForSalon(salonId),
      ])
    : [[], []];

  return <VisitsClient initialCustomers={customers} initialVisits={visits} readOnly={false} />;
}
