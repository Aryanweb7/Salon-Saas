import { NextResponse } from "next/server";

import { initiateSubscriptionAction } from "@/app/actions/subscriptions";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const planId = body.planId ?? body.plan ?? "basic";
    const result = await initiateSubscriptionAction({ planId });

    return NextResponse.json({
      ...result,
      subscription_id: result.subscriptionId,
    }, { status: result.success ? 200 : 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to initiate subscription" }, { status: 500 });
  }
}
