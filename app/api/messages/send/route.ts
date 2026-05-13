import { NextResponse } from "next/server";

import { getSessionContext } from "@/lib/auth";
import { dispatchQueuedReminders } from "@/lib/db/reminders";
import { assertCanSendCampaign } from "@/lib/permissions";

export async function POST() {
  const permission = await assertCanSendCampaign();
  if (!permission.allowed) {
    return NextResponse.json({ error: permission.message ?? "Reminders are blocked" }, { status: 403 });
  }

  const session = permission.session ?? (await getSessionContext());
  const result = await dispatchQueuedReminders();

  return NextResponse.json({ salonId: session.salonId, ...result });
}
