import { NextResponse } from "next/server";

import { runDailyReminderAutomation } from "@/lib/db/reminders";
import { markOverdueSubscriptions } from "@/lib/db/subscriptions";

export async function POST() {
  try {
    await markOverdueSubscriptions();
    const reminders = await runDailyReminderAutomation();

    return NextResponse.json({
      success: true,
      jobs: [
        "check due subscriptions",
        "mark overdue accounts",
        "activate read-only mode",
        "queue WhatsApp reminders",
        "send birthday messages",
        "run billing health checks",
      ],
      reminders,
    });
  } catch {
    return NextResponse.json({ success: false, jobs: ["mark overdue subscriptions"] }, { status: 500 });
  }
}
