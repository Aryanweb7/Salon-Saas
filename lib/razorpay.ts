import crypto from "node:crypto";

export function verifyRazorpaySignature(payload: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "demo-webhook-secret";
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return expected === signature;
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
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  customer_notify: number;
  notes: Record<string, string>;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
}

export function createCheckoutOptions(params: {
  orderId: string;
  amount: number;
  salonName: string;
  email: string;
  planId: string;
}): RazorpayCheckoutOptions {
  return {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
    amount: params.amount,
    currency: "INR",
    name: "SalonFlow",
    description: `Subscribe to ${params.salonName}`,
    order_id: params.orderId,
    customer_notify: 1,
    notes: {
      salonId: params.salonName,
      planId: params.planId,
    },
    prefill: {
      name: params.salonName,
      email: params.email,
    },
    theme: {
      color: "#3b82f6",
    },
  };
}

