import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { createPasswordResetToken, getPasswordResetExpiry, hashPasswordResetToken } from "@/lib/auth/password-reset";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { email?: string } | null;
    const email = body?.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const token = createPasswordResetToken();
    const tokenHash = hashPasswordResetToken(token);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt: getPasswordResetExpiry(),
    });

    const resetUrl = new URL("/reset-password", request.url);
    resetUrl.searchParams.set("token", token);

    return NextResponse.json({
      ok: true,
      resetUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl.toString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create reset link";

    if (message.includes("password_reset_tokens")) {
      return NextResponse.json(
        { error: "Password reset table is missing. Run the database migration first." },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
