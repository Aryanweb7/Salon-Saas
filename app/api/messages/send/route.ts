import { NextResponse } from "next/server";

import { getCurrentSalonId } from "@/lib/auth";
import { sendWhatsAppMessage } from "@/lib/messaging";

export async function POST() {
  const salonId = await getCurrentSalonId();
  const result = await sendWhatsAppMessage("twilio", {
    to: "+919999999999",
    templateKey: "appointment-reminder",
    variables: {
      customer_name: "Rahul",
      time: "5 PM",
    },
  });

  return NextResponse.json({ salonId, ...result });
}
