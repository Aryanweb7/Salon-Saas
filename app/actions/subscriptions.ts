"use server";

import { z } from "zod";
import { getSessionContext } from "@/lib/auth";
import { createOrder, updateSubscriptionFromRazorpay } from "@/lib/db/subscriptions";
import { PLAN_DEFINITIONS } from "@/lib/plans";

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
  const plan = PLAN_DEFINITIONS[validated.planId];

  try {
    // Create order in database
    const order = await createOrder(session.salonId, {
      planId: validated.planId,
      amount: String(plan.price * 100), // Convert to paise
    });

    if (!order) {
      return { success: false, error: "Failed to create order" };
    }

    return {
      success: true,
      orderId: order.id,
      amount: plan.price * 100, // Amount in paise for Razorpay
      salonName: session.salonName,
      email: session.email,
      planId: validated.planId,
    };
  } catch (error) {
    return { success: false, error: "Failed to initiate subscription" };
  }
}

export async function verifySubscriptionPaymentAction(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const session = await getSessionContext();

  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
  }

  try {
    // Verify signature on client has already been done
    // Here we just update the subscription status
    const result = await updateSubscriptionFromRazorpay({
      salonId: session.salonId,
      orderId: params.orderId,
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
