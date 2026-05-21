import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Offer messaging is not enabled in this app." }, { status: 410 });
}
