import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { emailCampaignLogs } from "@/db/schema";

export async function getCampaignEmailsSentThisMonthForSalon(salonId: string) {
  try {
    const [result] = await db
      .select({
        count: sql<number>`count(*) filter (where ${emailCampaignLogs.status} = 'sent' and ${emailCampaignLogs.createdAt} >= date_trunc('month', now()))`,
      })
      .from(emailCampaignLogs)
      .where(eq(emailCampaignLogs.salonId, salonId));

    return Number(result?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function logCampaignEmail(params: {
  salonId: string;
  customerId?: string;
  email: string;
  title: string;
  audience: string;
  status: "sent" | "failed";
  error?: string;
}) {
  await db.insert(emailCampaignLogs).values({
    salonId: params.salonId,
    customerId: params.customerId,
    email: params.email,
    title: params.title,
    audience: params.audience,
    status: params.status,
    error: params.error,
  });
}
