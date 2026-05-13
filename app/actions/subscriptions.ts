"use server";

import { z } from "zod";
import { getSessionContext } from "@/lib/auth";
import {
  activatePremiumForTesting,
  cancelCurrentSubscription,
  createSubscriptionRecord,
  getSubscriptionCheckoutState,
  updateSubscriptionFromRazorpay,
} from "@/lib/db/subscriptions";
import { getPlanSubscriptionPayload, getRazorpayClient, verifyRazorpayPaymentSignature } from "@/lib/razorpay";

const TRIAL_DAYS = 14;

const subscribeSchema = z.object({
  planId: z.enum(["basic", "pro", "premium"]),
});

export type SubscribeFormData = z.infer<typeof subscribeSchema>;

export async function initiateSubscriptionAction(data: SubscribeFormData) {
  const session = await getSessionContext();

  if (!session.salonId || !session.salonName) {
    return { success: false, error: "Salon not found" };
  }

  if (!session.email) {
    return { success: false, error: "Email not found" };
  }

  const validated = subscribeSchema.parse(data);
  try {
    const razorpay = getRazorpayClient();
    const planConfig = getPlanSubscriptionPayload(validated.planId);
    const isFreeTrial = validated.planId === "pro";
    const trialStartDate = new Date();
    const startAt = Math.floor(Date.now() / 1000) + TRIAL_DAYS * 24 * 60 * 60;
    const trialEndDate = new Date(startAt * 1000);
    const subscriptionPayload = {
      plan_id: planConfig.planId,
      total_count: 12,
      quantity: 1,
      customer_notify: 1 as const,
      ...(isFreeTrial ? { start_at: startAt } : {}),
      notes: {
        salonId: session.salonId,
        salonName: session.salonName,
        planId: validated.planId,
        trialDays: isFreeTrial ? String(TRIAL_DAYS) : "0",
      },
    };
    const razorpaySubscription = await (razorpay.subscriptions.create(subscriptionPayload) as Promise<{ id: string }>);

    const subscription = await createSubscriptionRecord(session.salonId, {
      planId: validated.planId,
      amount: planConfig.amount,
      razorpaySubscriptionId: razorpaySubscription.id,
      trialStartDate: isFreeTrial ? trialStartDate : undefined,
      trialEndDate: isFreeTrial ? trialEndDate : undefined,
    });

    if (!subscription) {
      return { success: false, error: "Failed to create subscription" };
    }

    return {
      success: true,
      subscriptionId: razorpaySubscription.id,
      salonName: session.salonName,
      email: session.email,
      planId: validated.planId,
      trialEndDate: isFreeTrial ? trialEndDate.toISOString() : null,
      startAt: isFreeTrial ? startAt : null,
    };
  } catch (error) {
    return { success: false, error: "Failed to initiate subscription" };
  }
}

export async function verifySubscriptionPaymentAction(params: {
  subscriptionId: string;
  paymentId: string;
  signature: string;
}) {
  const session = await getSessionContext();

  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
  }

  try {
    const isValid = verifyRazorpayPaymentSignature({
      subscriptionId: params.subscriptionId,
      paymentId: params.paymentId,
      signature: params.signature,
    });

    if (!isValid) {
      return { success: false, error: "Invalid payment signature" };
    }

    const subscription = await getSubscriptionCheckoutState(params.subscriptionId);
    const keepTrial =
      subscription?.planId === "pro" &&
      subscription.trialEndDate instanceof Date &&
      subscription.trialEndDate.getTime() > Date.now();

    const result = await updateSubscriptionFromRazorpay({
      salonId: session.salonId,
      razorpaySubscriptionId: params.subscriptionId,
      razorpayPaymentId: params.paymentId,
      status: keepTrial ? "trial" : "active",
    });

    if (result.success) {
      return { success: true, message: keepTrial ? "Trial started successfully" : "Subscription activated successfully" };
    }

    return { success: false, error: "Failed to activate subscription" };
  } catch (error) {
    return { success: false, error: "Failed to verify payment" };
  }
}

export async function cancelSubscriptionAction() {
  const session = await getSessionContext();

  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
  }

  try {
    const result = await cancelCurrentSubscription(session.salonId);

    if (!result.success) {
      return { success: false, error: "No active subscription found" };
    }

    if (result.razorpaySubscriptionId) {
      try {
        const razorpay = getRazorpayClient();
        await razorpay.subscriptions.cancel(result.razorpaySubscriptionId, true);
      } catch {
        return {
          success: true,
          warning: "Subscription was canceled locally, but remote Razorpay cancellation could not be confirmed.",
        };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to cancel subscription" };
  }
}

export async function activatePremiumForTestingAction() {
  const session = await getSessionContext();

  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
  }

  try {
    await activatePremiumForTesting(session.salonId);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to activate Premium for testing" };
  }
}
