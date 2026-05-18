import { NextResponse } from "next/server";
import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { getSessionContext } from "@/lib/auth";
import { getCampaignEmailsSentThisMonthForSalon, logCampaignEmail } from "@/lib/db/email-campaigns";
import { sendMarketingEmail } from "@/lib/email";
import { getReadOnlyReason } from "@/lib/gating";
import { PLAN_DEFINITIONS } from "@/lib/plans";

const campaignSchema = z.object({
  title: z.string().min(1, "Title is required").max(140),
  message: z.string().min(1, "Message is required").max(800),
  audience: z.enum(["all", "new", "inactive", "birthday"]),
});

function renderTemplate(value: string, variables: Record<string, string>) {
  return value.replace(/\{\{\s*(customer_name|salon_name)\s*\}\}/gi, (_, key: string) => {
    return variables[key.toLowerCase()] ?? "";
  });
}

function audienceWhere(salonId: string, audience: z.infer<typeof campaignSchema>["audience"]) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (audience === "new") {
    return and(eq(customers.salonId, salonId), gte(customers.createdAt, thirtyDaysAgo));
  }

  if (audience === "inactive") {
    return and(
      eq(customers.salonId, salonId),
      sql`(${customers.lastVisitAt} is null or ${customers.lastVisitAt} <= ${thirtyDaysAgo})`,
    );
  }

  if (audience === "birthday") {
    const month = today.getMonth() + 1;
    const day = today.getDate();

    return and(
      eq(customers.salonId, salonId),
      isNotNull(customers.birthday),
      sql`extract(month from ${customers.birthday}) = ${month}`,
      sql`extract(day from ${customers.birthday}) = ${day}`,
    );
  }

  return eq(customers.salonId, salonId);
}

export async function POST(request: Request) {
  const session = await getSessionContext();

  if (!session.salonId) {
    return NextResponse.json({ error: "No salon is attached to this account." }, { status: 403 });
  }

  if (session.readOnlyMode) {
    return NextResponse.json(
      { error: getReadOnlyReason(session.subscriptionStatus) ?? "Marketing campaigns are blocked in read-only mode." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = campaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid campaign" }, { status: 400 });
  }

  const emailLimit = PLAN_DEFINITIONS[session.planId].emailLimit;
  const emailsSentThisMonth = await getCampaignEmailsSentThisMonthForSalon(session.salonId);
  const remainingEmails = emailLimit === null ? Number.POSITIVE_INFINITY : Math.max(emailLimit - emailsSentThisMonth, 0);

  if (remainingEmails <= 0) {
    return NextResponse.json(
      {
        error: `Monthly email campaign limit reached. Your ${PLAN_DEFINITIONS[session.planId].name} plan includes ${emailLimit} campaign emails per month.`,
        upgradeRequired: session.planId === "free" || session.planId === "basic",
      },
      { status: 403 },
    );
  }

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
    })
    .from(customers)
    .where(audienceWhere(session.salonId, parsed.data.audience))
    .limit(500);

  const result = {
    total: rows.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    failedRecipients: [] as Array<{ name: string; reason: string }>,
  };

  for (const customer of rows) {
    if (result.sent >= remainingEmails) {
      result.skipped += 1;
      continue;
    }

    const variables = {
      customer_name: customer.name,
      salon_name: session.salonName ?? "our salon",
    };
    const title = renderTemplate(parsed.data.title, variables);
    const message = renderTemplate(parsed.data.message, variables);

    try {
      if (!customer.email?.trim()) {
        result.skipped += 1;
        continue;
      }

      await sendMarketingEmail({
        to: customer.email,
        customerName: customer.name,
        salonName: session.salonName ?? "our salon",
        title,
        message,
      });

      await logCampaignEmail({
        salonId: session.salonId,
        customerId: customer.id,
        email: customer.email,
        title,
        audience: parsed.data.audience,
        status: "sent",
      });

      result.sent += 1;
    } catch (error) {
      if (customer.email?.trim()) {
        await logCampaignEmail({
          salonId: session.salonId,
          customerId: customer.id,
          email: customer.email,
          title,
          audience: parsed.data.audience,
          status: "failed",
          error: error instanceof Error ? error.message : "Failed to send campaign",
        }).catch(() => null);
      }

      result.failed += 1;
      result.failedRecipients.push({
        name: customer.name,
        reason: error instanceof Error ? error.message : "Failed to send campaign",
      });
    }
  }

  return NextResponse.json(result);
}
