import crypto from "node:crypto";
import Razorpay from "razorpay";

export function verifyRazorpaySignature(payload: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function verifyRazorpayPaymentSignature(params: {
  subscriptionId: string;
  paymentId: string;
  signature: string;
}) {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    return false;
  }

  const body = `${params.paymentId}|${params.subscriptionId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === params.signature;
}

export function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay credentials");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export function getPlanSubscriptionPayload(planId: "basic" | "pro") {
  if (planId === "pro" && !process.env.RAZORPAY_ANNUAL_PLAN_ID) {
    throw new Error("Missing RAZORPAY_ANNUAL_PLAN_ID");
  }

  return {
    basic: { planId: "plan_SiuCLoUSjpJsbe", amount: 99900, totalCount: 12 },
    pro: { planId: process.env.RAZORPAY_ANNUAL_PLAN_ID as string, amount: 999900, totalCount: 1 },
  }[planId];
}

export interface RazorpayCheckoutOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
}

export function createCheckoutOptions(params: {
  subscriptionId: string;
  salonName: string;
  email: string;
}): RazorpayCheckoutOptions {
  return {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
    subscription_id: params.subscriptionId,
    name: "SalonFlow",
    description: `Subscribe to ${params.salonName}`,
    prefill: {
      name: params.salonName,
      email: params.email,
    },
    theme: {
      color: "#3b82f6",
    },
  };
}
