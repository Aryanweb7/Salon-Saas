"use server";

import { z } from "zod";
import { getSessionContext } from "@/lib/auth";
import {
  cancelCurrentSubscription,
  createSubscriptionRecord,
  updateSubscriptionFromRazorpay,
} from "@/lib/db/subscriptions";
import { getPlanSubscriptionPayload, getRazorpayClient, verifyRazorpayPaymentSignature } from "@/lib/razorpay";

const subscribeSchema = z.object({
  planId: z.enum(["basic", "pro"]),
});

export type SubscribeFormData = z.infer<typeof subscribeSchema>;

function getSubscriptionErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Missing Razorpay credentials")) {
    return "Razorpay credentials are not configured in this deployment.";
  }

  if (message.includes("Missing RAZORPAY_ANNUAL_PLAN_ID")) {
    return "Annual Razorpay plan id is not configured in this deployment.";
  }

  if (message.includes("DATABASE_URL")) {
    return "Database connection is not configured in this deployment.";
  }

  if (message.includes("Failed to create subscription")) {
    return "Subscription was created with Razorpay, but could not be saved. Please contact support.";
  }

  return "Failed to initiate subscription";
}

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
    const subscriptionPayload = {
      plan_id: planConfig.planId,
      total_count: planConfig.totalCount,
      quantity: 1,
      customer_notify: 1 as const,
      notes: {
        salonId: session.salonId,
        salonName: session.salonName,
        planId: validated.planId,
      },
    };
    const razorpaySubscription = await (razorpay.subscriptions.create(subscriptionPayload) as Promise<{ id: string }>);

    const subscription = await createSubscriptionRecord(session.salonId, {
      planId: validated.planId,
      amount: planConfig.amount,
      razorpaySubscriptionId: razorpaySubscription.id,
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
    };
  } catch (error) {
    console.error("Failed to initiate subscription", error);
    return { success: false, error: getSubscriptionErrorMessage(error) };
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

    const result = await updateSubscriptionFromRazorpay({
      salonId: session.salonId,
      razorpaySubscriptionId: params.subscriptionId,
      razorpayPaymentId: params.paymentId,
      status: "active",
    });

    if (result.success) {
      return { success: true, message: "Subscription activated successfully" };
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
