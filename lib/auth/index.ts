import { fallbackSession } from "@/lib/fallback-data";
import type { Role, SessionContext, SubscriptionStatus } from "@/lib/types";
import { getServerSession } from "next-auth";
import { eq, desc } from "drizzle-orm";

import { db } from "@/db";
import { salons, subscriptions, users } from "@/db/schema";
import { authOptions } from "@/lib/auth/options";

export const APP_PATHS = ["/dashboard", "/customers", "/appointments", "/visits", "/marketing", "/staff", "/reports", "/billing", "/settings"];

export async function getSessionContext(): Promise<SessionContext> {
  const authSession = await getServerSession(authOptions);
  if (!authSession?.user?.id) {
    return fallbackSession.salonOwner;
  }
  const sessionUser = authSession.user as typeof authSession.user & {
    role?: Role;
    salonId?: string | null;
  };

  let context:
    | {
        id: string;
        email: string;
        name: string;
        salonId: string | null;
        role: Role;
        subscriptionStatus: SubscriptionStatus | null;
        planId: "free" | "basic" | "pro" | null;
        readOnlyMode: boolean | null;
        salonName: string | null;
      }
    | undefined;

  try {
    [context] = await db
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
  } catch {
    console.warn("Could not refresh session context from the database. Using the signed-in session fallback.");

    return {
      user: {
        id: authSession.user.id,
        email: authSession.user.email ?? "",
        name: authSession.user.name ?? "Salon owner",
      },
      role: sessionUser.role ?? "SALON_OWNER",
      salonId: sessionUser.salonId ?? null,
      salonName: null,
      email: authSession.user.email ?? null,
      subscriptionStatus: "paused",
      planId: "free",
      readOnlyMode: true,
    };
  }

  if (!context) {
    return fallbackSession.salonOwner;
  }

  const subscriptionStatus = context.subscriptionStatus ?? "active";
  const planId = context.planId ?? "free";
  const billingReadOnly = isReadOnlyStatus(subscriptionStatus);
  const manualReadOnly = subscriptionStatus === "active" || subscriptionStatus === "past_due"
    ? false
    : (context.readOnlyMode ?? false);

  return {
    user: { id: context.id, email: context.email, name: context.name },
    role: context.role,
    salonId: context.salonId,
    salonName: context.salonName ?? null,
    email: context.email,
    subscriptionStatus,
    planId,
    readOnlyMode: manualReadOnly || billingReadOnly,
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
