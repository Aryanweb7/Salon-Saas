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
          subscription_id?: string;
          notes?: { salonId?: string; planId?: string };
        };
      };
      invoice?: {
        entity?: {
          id?: string;
          amount_paid?: number;
          subscription_id?: string;
          notes?: { salonId?: string; planId?: string };
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

  const subscriptionId =
    event.payload?.invoice?.entity?.subscription_id ||
    event.payload?.payment?.entity?.subscription_id ||
    event.payload?.subscription?.entity?.id;
  const salonId =
    event.payload?.payment?.entity?.notes?.salonId ||
    event.payload?.invoice?.entity?.notes?.salonId ||
    event.payload?.subscription?.entity?.notes?.salonId;

  if (!salonId && !subscriptionId) {
    return NextResponse.json({ error: "No salon or subscription ID found" }, { status: 400 });
  }

  try {
    if (event.event === "invoice.paid" || event.event === "payment.captured") {
      await updateSubscriptionStatusFromPayment({
        salonId: salonId ?? "",
        status: "active",
        paymentId: event.payload?.payment?.entity?.id ?? event.payload?.invoice?.entity?.id,
        paidAmount: ((event.payload?.payment?.entity?.amount ?? event.payload?.invoice?.entity?.amount_paid) ?? 0) / 100,
        razorpaySubscriptionId: subscriptionId,
      });
    }

    if (event.event === "payment.failed") {
      await updateSubscriptionStatusFromPayment({
        salonId: salonId ?? "",
        status: "past_due",
        paymentId: event.payload?.payment?.entity?.id,
        razorpaySubscriptionId: subscriptionId,
      });
    }

    if (event.event === "subscription.activated" || event.event === "subscription.charged") {
      await updateSubscriptionStatusFromPayment({
        salonId: salonId ?? "",
        status: "active",
        paymentId: event.payload?.subscription?.entity?.id,
        razorpaySubscriptionId: subscriptionId,
      });
    }

    if (event.event === "subscription.failed" || event.event === "subscription.halted") {
      await updateSubscriptionStatusFromPayment({
        salonId: salonId ?? "",
        status: "past_due",
        paymentId: event.payload?.subscription?.entity?.id,
        razorpaySubscriptionId: subscriptionId,
      });
    }

    if (event.event === "subscription.cancelled") {
      await updateSubscriptionStatusFromPayment({
        salonId: salonId ?? "",
        status: "canceled",
        paymentId: event.payload?.subscription?.entity?.id,
        razorpaySubscriptionId: subscriptionId,
      });
    }

    return NextResponse.json({
      success: true,
      event: event.event,
      workflow: [
        "invoice.paid/payment.captured -> active",
        "payment.failed -> past_due",
        "subscription.activated -> active",
        "subscription.failed -> past_due",
        "subscription.cancelled -> downgrade to Free",
        "cron after 3 days -> downgrade overdue paid plans to Free",
      ],
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
