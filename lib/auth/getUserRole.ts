import { eq, or } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import type { Role } from "@/lib/types";

type GetUserRoleParams = {
  clerkUserId?: string | null;
  email?: string | null;
};

export async function getUserRole(params?: string | GetUserRoleParams | null): Promise<Role | null> {
  const email = typeof params === "string" ? params : params?.email;
  const clerkUserId = typeof params === "string" ? null : params?.clerkUserId;
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedClerkUserId = clerkUserId?.trim();

  if (!normalizedEmail && !normalizedClerkUserId) {
    return null;
  }

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(
      normalizedClerkUserId && normalizedEmail
        ? or(eq(users.clerkUserId, normalizedClerkUserId), eq(users.email, normalizedEmail))
        : normalizedClerkUserId
          ? eq(users.clerkUserId, normalizedClerkUserId)
          : eq(users.email, normalizedEmail!)
    )
    .limit(1);

  if (!user) {
    return null;
  }

  if (user.role === "SALON_OWNER" || user.role === "STAFF_MEMBER" || user.role === "RECEPTIONIST") {
    return user.role;
  }

  return null;
}
