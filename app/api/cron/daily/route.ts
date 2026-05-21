import { NextResponse } from "next/server";

import { markOverdueSubscriptions } from "@/lib/db/subscriptions";

export async function POST() {
  try {
    await markOverdueSubscriptions();

    return NextResponse.json({
      success: true,
      jobs: [
        "check due subscriptions",
        "downgrade overdue paid accounts to Free",
        "run billing health checks",
      ],
    });
  } catch {
    return NextResponse.json({ success: false, jobs: ["mark overdue subscriptions"] }, { status: 500 });
  }
}
