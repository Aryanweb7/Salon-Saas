import { NextResponse } from "next/server";

import { verifySubscriptionPaymentAction } from "@/app/actions/subscriptions";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await verifySubscriptionPaymentAction({
      subscriptionId: body.subscriptionId ?? body.razorpay_subscription_id,
      paymentId: body.paymentId ?? body.razorpay_payment_id,
      signature: body.signature ?? body.razorpay_signature,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to verify payment" }, { status: 500 });
  }
}
