import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";

import { db } from "@/db";
import { salons, subscriptions, users } from "@/db/schema";
import { fallbackSession } from "@/lib/fallback-data";
import type { Role, SessionContext, SubscriptionStatus } from "@/lib/types";

export const ADMIN_PATHS = ["/admin"];
export const APP_PATHS = ["/dashboard", "/customers", "/appointments", "/visits", "/staff", "/reports", "/billing", "/settings", "/admin"];

export async function getSessionContext(): Promise<SessionContext> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return fallbackSession.salonOwner;
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        salonId: users.salonId,
      })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (!user) {
      return fallbackSession.salonOwner;
    }

    if (user.role === "SUPER_ADMIN") {
      return {
        user: { id: user.id, email: user.email, name: user.name },
        role: user.role,
        salonId: null,
        subscriptionStatus: "active",
        planId: "premium",
        readOnlyMode: false,
      };
    }

    const [subscription] = await db
      .select({
        status: subscriptions.status,
        planId: subscriptions.planId,
        readOnlyMode: salons.readOnlyMode,
      })
      .from(subscriptions)
      .innerJoin(salons, eq(salons.id, subscriptions.salonId))
      .where(eq(subscriptions.salonId, user.salonId!))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      role: user.role,
      salonId: user.salonId,
      subscriptionStatus: subscription?.status ?? "trial",
      planId: subscription?.planId ?? "basic",
      readOnlyMode: subscription?.readOnlyMode ?? false,
    };
  } catch {
    return fallbackSession.salonOwner;
  }
}

export function isReadOnlyStatus(status: SubscriptionStatus) {
  return status === "overdue" || status === "expired" || status === "canceled" || status === "paused";
}

export function assertRole(session: SessionContext, allowedRoles: Role[]) {
  return allowedRoles.includes(session.role);
}

export async function getCurrentSalonId() {
  const session = await getSessionContext();
  return session.salonId;
}
