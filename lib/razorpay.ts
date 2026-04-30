import crypto from "node:crypto";
import Razorpay from "razorpay";

export function verifyRazorpaySignature(payload: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "demo-webhook-secret";
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return expected === signature;
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

export function getPlanSubscriptionPayload(planId: "basic" | "pro" | "premium") {
  return {
    basic: { planId: "plan_SiuEHYgpKaSr0W", amount: 99900 },
    pro: { planId: "plan_SiuDiPMGIpOtzR", amount: 199900 },
    premium: { planId: "plan_SiuCLoUSjpJsbe", amount: 399900 },
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
