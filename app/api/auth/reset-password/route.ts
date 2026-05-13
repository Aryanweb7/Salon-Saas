import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { hashPasswordResetToken } from "@/lib/auth/password-reset";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          token?: string;
          password?: string;
        }
      | null;

    const token = body?.token?.trim();
    const password = body?.password ?? "";

    if (!token || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const tokenHash = hashPasswordResetToken(token);
    const [resetToken] = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
      })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!resetToken) {
      return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetToken.userId));

    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date(), updatedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));

    return NextResponse.json({ ok: true, redirectTo: "/login" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reset password";

    if (message.includes("password_reset_tokens")) {
      return NextResponse.json(
        { error: "Password reset table is missing. Run the database migration first." },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
