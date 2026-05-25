import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { emailCampaignLogs } from "@/db/schema";

export async function getCampaignSendsThisMonthForSalon(salonId: string) {
  try {
    const [result] = await db
      .select({
        count: sql<number>`count(distinct ${emailCampaignLogs.campaignId}) filter (where ${emailCampaignLogs.campaignId} is not null and ${emailCampaignLogs.status} = 'sent' and ${emailCampaignLogs.createdAt} >= date_trunc('month', now()))`,
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
  campaignId?: string;
  email: string;
  title: string;
  audience: string;
  status: "sent" | "failed";
  error?: string;
}) {
  await db.insert(emailCampaignLogs).values({
    salonId: params.salonId,
    customerId: params.customerId,
    campaignId: params.campaignId,
    email: params.email,
    title: params.title,
    audience: params.audience,
    status: params.status,
    error: params.error,
  });
}
