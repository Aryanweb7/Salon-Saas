import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { MarketingCampaignBuilder } from "@/components/marketing-campaign-builder";
import { getSessionContext } from "@/lib/auth";
import { getCampaignEmailsSentThisMonthForSalon } from "@/lib/db/email-campaigns";
import { PLAN_DEFINITIONS } from "@/lib/plans";

async function getAudienceStats(salonId: string) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const month = today.getMonth() + 1;
  const day = today.getDate();

  try {
    const [allCustomers, newCustomers, inactiveCustomers, birthdayCustomers] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(eq(customers.salonId, salonId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(sql`${customers.salonId} = ${salonId} and ${customers.createdAt} >= ${thirtyDaysAgo}`),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(sql`${customers.salonId} = ${salonId} and (${customers.lastVisitAt} is null or ${customers.lastVisitAt} <= ${thirtyDaysAgo})`),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(
          sql`${customers.salonId} = ${salonId} and ${customers.birthday} is not null and extract(month from ${customers.birthday}) = ${month} and extract(day from ${customers.birthday}) = ${day}`,
        ),
    ]);

    return [
      {
        id: "all" as const,
        label: "All Customers",
        count: Number(allCustomers[0]?.count ?? 0),
        description: "Every customer with a saved profile.",
      },
      {
        id: "new" as const,
        label: "New Customers",
        count: Number(newCustomers[0]?.count ?? 0),
        description: "Customers added in the last 30 days.",
      },
      {
        id: "inactive" as const,
        label: "Inactive Customers",
        count: Number(inactiveCustomers[0]?.count ?? 0),
        description: "Customers with no recent visit in 30 days.",
      },
      {
        id: "birthday" as const,
        label: "Birthday Customers",
        count: Number(birthdayCustomers[0]?.count ?? 0),
        description: "Customers whose birthday is today.",
      },
    ];
  } catch {
    return [
      { id: "all" as const, label: "All Customers", count: 0, description: "Every customer with a saved profile." },
      { id: "new" as const, label: "New Customers", count: 0, description: "Customers added in the last 30 days." },
      { id: "inactive" as const, label: "Inactive Customers", count: 0, description: "Customers with no recent visit in 30 days." },
      { id: "birthday" as const, label: "Birthday Customers", count: 0, description: "Customers whose birthday is today." },
    ];
  }
}

export default async function MarketingPage() {
  const session = await getSessionContext();
  const [audienceStats, emailsSentThisMonth] = session.salonId
    ? await Promise.all([
        getAudienceStats(session.salonId),
        getCampaignEmailsSentThisMonthForSalon(session.salonId),
      ])
    : [await getAudienceStats(""), 0];
  const currentPlan = PLAN_DEFINITIONS[session.planId];

  return (
    <MarketingCampaignBuilder
      salonName={session.salonName ?? "SalonFlow"}
      audienceStats={audienceStats}
      planName={currentPlan.name}
      planId={session.planId}
      emailLimit={currentPlan.emailLimit}
      emailsSentThisMonth={emailsSentThisMonth}
    />
  );
}
