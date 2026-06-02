import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { salons, subscriptions, users } from "@/db/schema";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getFreeTrialEndDate() {
  const trialEnd = new Date();
  trialEnd.setMonth(trialEnd.getMonth() + 1);
  return trialEnd;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | {
        salonName?: string;
        ownerName?: string;
        email?: string;
        password?: string;
        phone?: string;
        city?: string;
      }
    | null;

  const salonName = body?.salonName?.trim();
  const ownerName = body?.ownerName?.trim();
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  const phone = body?.phone?.trim() ?? null;
  const city = body?.city?.trim() ?? null;

  if (!salonName || !ownerName || !email || password.length < 6) {
    return NextResponse.json({ error: "Invalid registration details" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const baseSlug = slugify(salonName);
  const slug = baseSlug ? `${baseSlug}-${Math.random().toString(36).slice(2, 6)}` : `salon-${Math.random().toString(36).slice(2, 8)}`;

  const passwordHash = await bcrypt.hash(password, 10);
  const freeTrialEnd = getFreeTrialEndDate();

  const [salon] = await db
    .insert(salons)
    .values({
      name: salonName,
      slug,
      city,
      planId: "free",
      status: "active",
      readOnlyMode: false,
      nextBillingDate: freeTrialEnd,
    })
    .returning({ id: salons.id, name: salons.name });

  const [user] = await db
    .insert(users)
    .values({
      clerkUserId: `local:${crypto.randomUUID()}`,
      salonId: salon.id,
      email,
      name: ownerName,
      phone,
      role: "SALON_OWNER",
      passwordHash,
    })
    .returning({ id: users.id, email: users.email, role: users.role });

  await db
    .update(salons)
    .set({ ownerUserId: user.id })
    .where(eq(salons.id, salon.id));

  await db.insert(subscriptions).values({
    salonId: salon.id,
    planId: "free",
    status: "active",
    currentPeriodStart: new Date(),
    currentPeriodEnd: freeTrialEnd,
  });

  return NextResponse.json({ ok: true, redirectTo: "/dashboard", email });
}
