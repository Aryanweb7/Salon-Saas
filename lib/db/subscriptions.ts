import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { payments, salons, subscriptions } from "@/db/schema";

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

    return row ?? { planId: "free" as const, status: "active" as const, renewalDate: null };
  } catch {
    return { planId: "free" as const, status: "active" as const, renewalDate: null };
  }
}

export async function getBillingSnapshot(salonId: string) {
  try {
    const [row] = await db
      .select({
        subscriptionId: subscriptions.id,
        planId: subscriptions.planId,
        status: subscriptions.status,
        renewalDate: subscriptions.currentPeriodEnd,
        graceEndsAt: subscriptions.graceEndsAt,
        razorpaySubscriptionId: subscriptions.razorpaySubscriptionId,
        readOnlyMode: salons.readOnlyMode,
        nextBillingDate: salons.nextBillingDate,
      })
      .from(subscriptions)
      .innerJoin(salons, eq(salons.id, subscriptions.salonId))
      .where(eq(subscriptions.salonId, salonId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    return row ?? null;
  } catch {
    return null;
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
    return [];
  }
}

export async function createSubscriptionRecord(
  salonId: string,
  data: {
    planId: "basic" | "pro";
    amount: number;
    razorpaySubscriptionId: string;
  }
) {
  try {
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        salonId,
        planId: data.planId,
        status: "paused",
        razorpaySubscriptionId: data.razorpaySubscriptionId,
      })
      .returning({ id: subscriptions.id });

    await db
      .update(salons)
      .set({
        planId: data.planId,
        status: "paused",
        readOnlyMode: true,
        nextBillingDate: null,
        updatedAt: new Date(),
      })
      .where(eq(salons.id, salonId));

    const [payment] = await db
      .insert(payments)
      .values({
        salonId,
        subscriptionId: subscription.id,
        amount: String(data.amount / 100),
        status: "created",
        provider: "Razorpay",
        metadata: {
          razorpaySubscriptionId: data.razorpaySubscriptionId,
          planId: data.planId,
        },
      })
      .returning({ id: payments.id });

    return {
      id: subscription.id,
      paymentId: payment.id,
    };
  } catch {
    throw new Error("Failed to create subscription");
  }
}

export async function updateSubscriptionFromRazorpay(params: {
  salonId: string;
  razorpaySubscriptionId: string;
  razorpayPaymentId: string;
  status: "active" | "past_due" | "overdue" | "expired" | "canceled";
}) {
  try {
    const [subscription] = await db
      .select({
        id: subscriptions.id,
        planId: subscriptions.planId,
      })
      .from(subscriptions)
      .where(eq(subscriptions.razorpaySubscriptionId, params.razorpaySubscriptionId))
      .limit(1);

    if (!subscription) {
      return { success: false };
    }

    await db
      .update(subscriptions)
      .set({
        status: params.status,
        currentPeriodStart: params.status === "active" ? new Date() : undefined,
        currentPeriodEnd: params.status === "active" ? sql`now() + interval '30 day'` : undefined,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    await db
      .update(salons)
      .set({
        status: params.status,
        planId: subscription.planId,
        readOnlyMode: params.status === "overdue" || params.status === "expired" || params.status === "canceled",
        nextBillingDate: params.status === "active" ? sql`now() + interval '30 day'` : undefined,
        updatedAt: new Date(),
      })
      .where(eq(salons.id, params.salonId));

    await db
      .insert(payments)
      .values({
        salonId: params.salonId,
        subscriptionId: subscription.id,
        amount: "0",
        provider: "Razorpay",
        status: params.status === "active" ? "paid" : "failed",
        razorpayPaymentId: params.razorpayPaymentId,
        paidAt: params.status === "active" ? new Date() : null,
        metadata: {
          razorpaySubscriptionId: params.razorpaySubscriptionId,
        },
      });

    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateSubscriptionStatusFromPayment(params: {
  salonId: string;
  status: "active" | "past_due" | "overdue" | "expired" | "canceled";
  paymentId?: string;
  paidAmount?: number;
  razorpaySubscriptionId?: string;
}) {
  const [subscription] = await db
    .select({ id: subscriptions.id, salonId: subscriptions.salonId })
    .from(subscriptions)
    .where(
      params.razorpaySubscriptionId
        ? eq(subscriptions.razorpaySubscriptionId, params.razorpaySubscriptionId)
        : eq(subscriptions.salonId, params.salonId)
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!subscription) {
    return { success: false };
  }

  const salonId = subscription.salonId ?? params.salonId;

  await db
    .update(subscriptions)
    .set({
      status: params.status,
      currentPeriodStart: params.status === "active" ? new Date() : undefined,
      currentPeriodEnd: params.status === "active" ? sql`now() + interval '30 day'` : undefined,
      graceEndsAt: params.status === "past_due" ? sql`now() + interval '3 day'` : params.status === "active" ? null : undefined,
      canceledAt: params.status === "canceled" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscription.id));

  await db
    .update(salons)
    .set({
      status: params.status,
      readOnlyMode: params.status === "overdue" || params.status === "expired" || params.status === "canceled",
      nextBillingDate: params.status === "active" ? sql`now() + interval '30 day'` : null,
      updatedAt: new Date(),
    })
    .where(eq(salons.id, salonId));

  if (params.paymentId || params.paidAmount) {
    await db.insert(payments).values({
      salonId,
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
    .set({
      status: "past_due",
      graceEndsAt: sql`now() + interval '3 day'`,
      updatedAt: new Date(),
    })
    .where(and(eq(subscriptions.status, "active"), sql`${subscriptions.currentPeriodEnd} < now()`));

  await db
    .update(salons)
    .set({
      status: "past_due",
      nextBillingDate: null,
      updatedAt: new Date(),
    })
    .where(and(eq(salons.status, "active"), sql`${salons.nextBillingDate} < now()`));

  await db
    .update(subscriptions)
    .set({ status: "overdue", updatedAt: new Date() })
    .where(and(eq(subscriptions.status, "past_due"), sql`${subscriptions.graceEndsAt} < now()`));

  await db
    .update(salons)
    .set({
      status: "overdue",
      readOnlyMode: true,
      updatedAt: new Date(),
    })
    .where(and(eq(salons.status, "past_due"), sql`${salons.updatedAt} < now() - interval '3 day'`));
}

export async function cancelCurrentSubscription(salonId: string) {
  const [subscription] = await db
    .select({
      id: subscriptions.id,
      razorpaySubscriptionId: subscriptions.razorpaySubscriptionId,
      planId: subscriptions.planId,
    })
    .from(subscriptions)
    .where(eq(subscriptions.salonId, salonId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!subscription) {
    return { success: false, razorpaySubscriptionId: null };
  }

  await db
    .update(subscriptions)
    .set({
      status: "canceled",
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscription.id));

  await db
    .update(salons)
    .set({
      status: "canceled",
      readOnlyMode: true,
      planId: subscription.planId,
      nextBillingDate: null,
      updatedAt: new Date(),
    })
    .where(eq(salons.id, salonId));

  return { success: true, razorpaySubscriptionId: subscription.razorpaySubscriptionId ?? null };
}
