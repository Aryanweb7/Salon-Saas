import { fallbackSession } from "@/lib/fallback-data";
import type { Role, SessionContext, SubscriptionStatus } from "@/lib/types";
import { getServerSession } from "next-auth";
import { eq, desc } from "drizzle-orm";

import { db } from "@/db";
import { salons, subscriptions, users } from "@/db/schema";
import { authOptions } from "@/lib/auth/options";

export const APP_PATHS = ["/dashboard", "/customers", "/appointments", "/visits", "/staff", "/reports", "/billing", "/settings"];

export async function getSessionContext(): Promise<SessionContext> {
  const authSession = await getServerSession(authOptions);
  if (!authSession?.user?.id) {
    return fallbackSession.salonOwner;
  }

  const [context] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      salonId: users.salonId,
      role: users.role,
      subscriptionStatus: subscriptions.status,
      planId: subscriptions.planId,
      readOnlyMode: salons.readOnlyMode,
      salonName: salons.name,
    })
    .from(users)
    .leftJoin(salons, eq(salons.id, users.salonId))
    .leftJoin(subscriptions, eq(subscriptions.salonId, users.salonId))
    .where(eq(users.id, authSession.user.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!context) {
    return fallbackSession.salonOwner;
  }

  return {
    user: { id: context.id, email: context.email, name: context.name },
    role: context.role,
    salonId: context.salonId,
    salonName: context.salonName ?? null,
    email: context.email,
    subscriptionStatus: context.subscriptionStatus ?? "trial",
    planId: context.planId ?? "basic",
    readOnlyMode: (context.readOnlyMode ?? false) || isReadOnlyStatus(context.subscriptionStatus ?? "trial"),
  };
}

export function isReadOnlyStatus(status: SubscriptionStatus) {
  return status === "overdue" || status === "expired" || status === "canceled";
}

export function assertRole(session: SessionContext, allowedRoles: Role[]) {
  return allowedRoles.includes(session.role);
}

export async function getCurrentSalonId() {
  const session = await getSessionContext();
  return session.salonId;
}
