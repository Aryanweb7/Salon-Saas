import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { customers, messages, users } from "@/db/schema";
import { authOptions } from "@/lib/auth/options";
import { sendWhatsAppMessage, WHATSAPP_PROVIDER } from "@/lib/messaging";

const campaignSchema = z.object({
  message: z.string().min(1, "Message is required").max(500, "Message must be 500 characters or less"),
  filter: z.enum(["all", "birthday"]).default("all"),
});

const CAMPAIGN_DELAY_MS = 350;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBirthdayToday(value: Date | null) {
  if (!value) return false;
  const today = new Date();
  return value.getDate() === today.getDate() && value.getMonth() === today.getMonth();
}

function renderMessage(template: string, customerName: string) {
  return template
    .replace(/\{\{\s*customer_name\s*\}\}/gi, customerName)
    .replace(/\[customer name\]/gi, customerName);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to send WhatsApp message";
}

async function getRequiredSalonContext() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const [user] = await db
    .select({
      salonId: users.salonId,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.salonId) return null;

  return {
    salonId: user.salonId,
  };
}

export async function POST(request: Request) {
  const context = await getRequiredSalonContext();

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { salonId } = context;

  const body = await request.json().catch(() => null);
  const parsed = campaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid campaign" }, { status: 400 });
  }

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      birthday: customers.birthday,
      lastVisitAt: customers.lastVisitAt,
    })
    .from(customers)
    .where(eq(customers.salonId, salonId));

  const filtered = rows.filter((customer) => {
    if (!customer.phone?.trim()) return false;
    if (parsed.data.filter === "birthday") return isBirthdayToday(customer.birthday);
    return true;
  });

  const result = {
    total: filtered.length,
    sent: 0,
    failed: 0,
    skipped: rows.length - filtered.length,
    failedRecipients: [] as Array<{ name: string; phone: string; reason: string }>,
  };

  for (const customer of filtered) {
    const message = renderMessage(parsed.data.message, customer.name);

    if (!customer.phone?.trim()) {
      await db.insert(messages).values({
        salonId,
        toPhone: customer.phone,
        templateKey: "offer-campaign",
        provider: WHATSAPP_PROVIDER,
        status: "failed",
        payload: {
          body: message,
          customerId: customer.id,
          error: "Customer phone number is required",
        },
      });

      result.failed += 1;
      result.failedRecipients.push({
        name: customer.name,
        phone: customer.phone,
        reason: "Customer phone number is required.",
      });
      continue;
    }

    try {
      const sent = await sendWhatsAppMessage(WHATSAPP_PROVIDER, {
        to: customer.phone,
        templateKey: "offer-campaign",
        variables: {
          customer_name: customer.name,
          message,
        },
      });

      await db.insert(messages).values({
        salonId,
        toPhone: customer.phone,
        templateKey: "offer-campaign",
        provider: sent.provider,
        status: "sent",
        referenceId: sent.referenceId,
        payload: {
          ...sent.payload,
          body: message,
          customerId: customer.id,
        },
      });

      result.sent += 1;
    } catch (error) {
      const reason = getErrorMessage(error);

      console.error("Failed to send WhatsApp campaign message", {
        customerId: customer.id,
        phone: customer.phone,
        reason,
      });

      await db.insert(messages).values({
        salonId,
        toPhone: customer.phone,
        templateKey: "offer-campaign",
        provider: WHATSAPP_PROVIDER,
        status: "failed",
        payload: {
          body: message,
          customerId: customer.id,
          error: reason,
        },
      });

      result.failed += 1;
      result.failedRecipients.push({
        name: customer.name,
        phone: customer.phone,
        reason,
      });
    }

    await wait(CAMPAIGN_DELAY_MS);
  }

  return NextResponse.json(result);
}
