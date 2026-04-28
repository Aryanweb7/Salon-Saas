import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { updateSubscriptionStatusFromPayment } from "@/lib/db/subscriptions";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = (await headers()).get("x-razorpay-signature") ?? "";

  if (!verifyRazorpaySignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(payload) as {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          amount?: number;
          notes?: { salonId?: string };
        };
      };
      subscription?: {
        entity?: {
          id?: string;
          status?: string;
          customer_notify?: number;
          notes?: { salonId?: string };
        };
      };
    };
  };

  const salonId = event.payload?.payment?.entity?.notes?.salonId || event.payload?.subscription?.entity?.notes?.salonId;

  if (!salonId) {
    return NextResponse.json({ error: "No salon ID found" }, { status: 400 });
  }

  try {
    // Handle payment events
    if (event.event === "payment.captured") {
      await updateSubscriptionStatusFromPayment({
        salonId,
        status: "active",
        paymentId: event.payload?.payment?.entity?.id,
        paidAmount: (event.payload?.payment?.entity?.amount ?? 0) / 100,
      });
    }

    if (event.event === "payment.failed") {
      await updateSubscriptionStatusFromPayment({
        salonId,
        status: "past_due",
        paymentId: event.payload?.payment?.entity?.id,
      });
    }

    // Handle subscription events
    if (event.event === "subscription.activated" || event.event === "subscription.charged") {
      await updateSubscriptionStatusFromPayment({
        salonId,
        status: "active",
        paymentId: event.payload?.subscription?.entity?.id,
      });
    }

    if (event.event === "subscription.failed" || event.event === "subscription.halted") {
      await updateSubscriptionStatusFromPayment({
        salonId,
        status: "past_due",
        paymentId: event.payload?.subscription?.entity?.id,
      });
    }

    if (event.event === "subscription.cancelled") {
      await updateSubscriptionStatusFromPayment({
        salonId,
        status: "expired",
        paymentId: event.payload?.subscription?.entity?.id,
      });
    }

    return NextResponse.json({
      success: true,
      event: event.event,
      workflow: [
        "payment.captured -> active",
        "payment.failed -> past_due",
        "subscription.activated -> active",
        "subscription.failed -> past_due",
        "subscription.cancelled -> expired",
        "cron after 3 days -> overdue + read-only",
      ],
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
