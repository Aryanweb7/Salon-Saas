import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { payments, salons, subscriptions } from "@/db/schema";
import { fallbackSalons } from "@/lib/fallback-data";

export async function getSalonSubscription(salonId: string) {
  try {
    const [row] = await db
      .select({
        planId: subscriptions.planId,
        status: subscriptions.status,
        renewalDate: subscriptions.currentPeriodEnd,
      })
      .from(subscriptions)
      .where(eq(subscriptions.salonId, salonId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    return row ?? { planId: "pro" as const, status: "active" as const, renewalDate: null };
  } catch {
    const fallback = fallbackSalons[0];
    return { planId: fallback.plan, status: fallback.status, renewalDate: new Date(fallback.renewalDate) };
  }
}

export async function listSubscriptionCards() {
  try {
    return await db
      .select({
        id: salons.id,
        name: salons.name,
        city: salons.city,
        plan: subscriptions.planId,
        status: subscriptions.status,
        renewalDate: subscriptions.currentPeriodEnd,
      })
      .from(subscriptions)
      .innerJoin(salons, eq(salons.id, subscriptions.salonId))
      .orderBy(desc(subscriptions.createdAt));
  } catch {
    return fallbackSalons.map((salon) => ({
      id: salon.id,
      name: salon.name,
      city: salon.city,
      plan: salon.plan,
      status: salon.status,
      renewalDate: new Date(salon.renewalDate),
    }));
  }
}

export async function createOrder(
  salonId: string,
  data: {
    planId: "basic" | "pro" | "premium";
    amount: string;
  }
) {
  try {
    const [result] = await db
      .insert(subscriptions)
      .values({
        salonId,
        planId: data.planId,
        status: "trial",
        currentPeriodStart: new Date(),
        currentPeriodEnd: sql`now() + interval '30 day'`,
      })
      .returning({ id: subscriptions.id });

    return result;
  } catch {
    throw new Error("Failed to create order");
  }
}

export async function updateSubscriptionFromRazorpay(params: {
  salonId: string;
  orderId: string;
  razorpayPaymentId: string;
  status: "active" | "past_due" | "overdue" | "expired" | "canceled";
}) {
  try {
    const [subscription] = await db
      .select({ id: subscriptions.id, planId: subscriptions.planId })
      .from(subscriptions)
      .where(eq(subscriptions.id, params.orderId))
      .limit(1);

    if (!subscription) {
      return { success: false };
    }

    await db
      .update(subscriptions)
      .set({
        status: params.status,
        razorpaySubscriptionId: params.razorpayPaymentId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: params.status === "active" ? sql`now() + interval '30 day'` : null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    await db
      .update(salons)
      .set({
        status: params.status,
        planId: subscription.planId,
        readOnlyMode: params.status === "overdue" || params.status === "expired",
        nextBillingDate: params.status === "active" ? sql`now() + interval '30 day'` : null,
        updatedAt: new Date(),
      })
      .where(eq(salons.id, params.salonId));

    // Record payment
    const [plan] = await db
      .select({ price: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.id, subscription.id))
      .limit(1);

    await db.insert(payments).values({
      salonId: params.salonId,
      subscriptionId: subscription.id,
      amount: "0", // Will be set by webhook with actual amount
      provider: "Razorpay",
      status: params.status === "active" ? "paid" : "failed",
      razorpayPaymentId: params.razorpayPaymentId,
      paidAt: params.status === "active" ? new Date() : null,
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateSubscriptionStatusFromPayment(params: {
  salonId: string;
  status: "active" | "past_due" | "overdue" | "expired";
  paymentId?: string;
  paidAmount?: number;
}) {
  const [subscription] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.salonId, params.salonId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!subscription) {
    return { success: false };
  }

  await db
    .update(subscriptions)
    .set({
      status: params.status,
      currentPeriodEnd: params.status === "active" ? sql`now() + interval '30 day'` : undefined,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscription.id));

  await db
    .update(salons)
    .set({
      status: params.status,
      readOnlyMode: params.status === "overdue" || params.status === "expired",
      nextBillingDate: params.status === "active" ? sql`now() + interval '30 day'` : undefined,
      updatedAt: new Date(),
    })
    .where(eq(salons.id, params.salonId));

  if (params.paymentId || params.paidAmount) {
    await db.insert(payments).values({
      salonId: params.salonId,
      subscriptionId: subscription.id,
      amount: String(params.paidAmount ?? 0),
      provider: "Razorpay",
      status: params.status === "active" ? "paid" : "failed",
      razorpayPaymentId: params.paymentId,
      paidAt: params.status === "active" ? new Date() : null,
    });
  }

  return { success: true };
}

export async function markOverdueSubscriptions() {
  await db
    .update(subscriptions)
    .set({ status: "overdue", updatedAt: new Date() })
    .where(and(eq(subscriptions.status, "past_due"), sql`${subscriptions.graceEndsAt} < now()`));
}

