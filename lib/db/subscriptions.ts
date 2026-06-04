import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { payments, salons, subscriptions } from "@/db/schema";

function getFreeTrialEndDate() {
  const trialEnd = new Date();
  trialEnd.setMonth(trialEnd.getMonth() + 1);
  return trialEnd;
}

async function downgradeSalonToFree(salonId: string) {
  const freeTrialEnd = getFreeTrialEndDate();

  await db
    .update(salons)
    .set({
      planId: "free",
      status: "active",
      readOnlyMode: false,
      nextBillingDate: freeTrialEnd,
      updatedAt: new Date(),
    })
    .where(eq(salons.id, salonId));

  const [latestSubscription] = await db
    .select({ planId: subscriptions.planId, status: subscriptions.status })
    .from(subscriptions)
    .where(eq(subscriptions.salonId, salonId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (latestSubscription?.planId === "free" && latestSubscription.status === "active") {
    return;
  }

  await db.insert(subscriptions).values({
    salonId,
    planId: "free",
    status: "active",
    currentPeriodStart: new Date(),
    currentPeriodEnd: freeTrialEnd,
  });
}

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
      .orderBy(sql`case when ${subscriptions.status} = 'paused' then 1 else 0 end`, desc(subscriptions.createdAt))
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
        periodStartDate: subscriptions.currentPeriodStart,
        subscriptionCreatedAt: subscriptions.createdAt,
        graceEndsAt: subscriptions.graceEndsAt,
        razorpaySubscriptionId: subscriptions.razorpaySubscriptionId,
        nextBillingDate: salons.nextBillingDate,
      })
      .from(subscriptions)
      .innerJoin(salons, eq(salons.id, subscriptions.salonId))
      .where(eq(subscriptions.salonId, salonId))
      .orderBy(sql`case when ${subscriptions.status} = 'paused' then 1 else 0 end`, desc(subscriptions.createdAt))
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
        salonId: subscriptions.salonId,
      })
      .from(subscriptions)
      .where(and(eq(subscriptions.razorpaySubscriptionId, params.razorpaySubscriptionId), eq(subscriptions.salonId, params.salonId)))
      .limit(1);

    if (!subscription) {
      return { success: false };
    }

    const paidPeriodEnd = subscription.planId === "pro" ? sql`now() + interval '1 year'` : sql`now() + interval '30 day'`;

    await db
      .update(subscriptions)
      .set({
        status: params.status,
        currentPeriodStart: params.status === "active" ? new Date() : undefined,
        currentPeriodEnd: params.status === "active" ? paidPeriodEnd : undefined,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    if (params.status === "overdue" || params.status === "expired" || params.status === "canceled") {
      await downgradeSalonToFree(subscription.salonId);
    } else {
      await db
        .update(salons)
        .set({
          status: params.status,
          planId: subscription.planId,
          readOnlyMode: false,
          nextBillingDate: params.status === "active" ? paidPeriodEnd : undefined,
          updatedAt: new Date(),
        })
        .where(eq(salons.id, subscription.salonId));
    }

    await db
      .insert(payments)
      .values({
        salonId: subscription.salonId,
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
    .select({ id: subscriptions.id, salonId: subscriptions.salonId, planId: subscriptions.planId })
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
  const paidPeriodEnd = subscription.planId === "pro" ? sql`now() + interval '1 year'` : sql`now() + interval '30 day'`;

  await db
    .update(subscriptions)
    .set({
      status: params.status,
      currentPeriodStart: params.status === "active" ? new Date() : undefined,
      currentPeriodEnd: params.status === "active" ? paidPeriodEnd : undefined,
      graceEndsAt: params.status === "past_due" ? sql`now() + interval '3 day'` : params.status === "active" ? null : undefined,
      canceledAt: params.status === "canceled" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscription.id));

  if (params.status === "overdue" || params.status === "expired" || params.status === "canceled") {
    await downgradeSalonToFree(salonId);
  } else {
    const [updatedSubscription] = await db
      .select({ planId: subscriptions.planId })
      .from(subscriptions)
      .where(eq(subscriptions.id, subscription.id))
      .limit(1);

    await db
      .update(salons)
      .set({
        status: params.status,
        planId: params.status === "active" ? updatedSubscription?.planId : undefined,
        readOnlyMode: false,
        nextBillingDate: params.status === "active" ? paidPeriodEnd : null,
        updatedAt: new Date(),
      })
      .where(eq(salons.id, salonId));
  }

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
  const expiredFreeRows = await db
    .select({ salonId: subscriptions.salonId })
    .from(subscriptions)
    .where(and(eq(subscriptions.status, "active"), eq(subscriptions.planId, "free"), sql`${subscriptions.currentPeriodEnd} < now()`));

  await db
    .update(subscriptions)
    .set({
      status: "expired",
      updatedAt: new Date(),
    })
    .where(and(eq(subscriptions.status, "active"), eq(subscriptions.planId, "free"), sql`${subscriptions.currentPeriodEnd} < now()`));

  for (const row of expiredFreeRows) {
    await db
      .update(salons)
      .set({
        status: "expired",
        readOnlyMode: true,
        nextBillingDate: null,
        updatedAt: new Date(),
      })
      .where(eq(salons.id, row.salonId));
  }

  await db
    .update(subscriptions)
    .set({
      status: "past_due",
      graceEndsAt: sql`now() + interval '3 day'`,
      updatedAt: new Date(),
    })
    .where(and(eq(subscriptions.status, "active"), sql`${subscriptions.planId} <> 'free'`, sql`${subscriptions.currentPeriodEnd} < now()`));

  await db
    .update(salons)
    .set({
      status: "past_due",
      nextBillingDate: null,
      updatedAt: new Date(),
    })
    .where(and(eq(salons.status, "active"), sql`${salons.nextBillingDate} < now()`));

  const overdueRows = await db
    .select({ id: subscriptions.id, salonId: subscriptions.salonId })
    .from(subscriptions)
    .where(and(eq(subscriptions.status, "past_due"), sql`${subscriptions.graceEndsAt} < now()`));

  for (const row of overdueRows) {
    await db
      .update(subscriptions)
      .set({ status: "overdue", updatedAt: new Date() })
      .where(eq(subscriptions.id, row.id));

    await downgradeSalonToFree(row.salonId);
  }
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

  await downgradeSalonToFree(salonId);

  return { success: true, razorpaySubscriptionId: subscription.razorpaySubscriptionId ?? null };
}
