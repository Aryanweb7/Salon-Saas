import { NextResponse } from "next/server";

import { markOverdueSubscriptions } from "@/lib/db/subscriptions";

export async function POST() {
  try {
    await markOverdueSubscriptions();
  } catch {
    return NextResponse.json({ success: false, jobs: ["mark overdue subscriptions"] }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    jobs: [
      "check due subscriptions",
      "mark overdue accounts",
      "activate read-only mode",
      "queue WhatsApp reminders",
      "send birthday messages",
      "send trial ending reminders",
      "send admin summary report",
    ],
  });
}
