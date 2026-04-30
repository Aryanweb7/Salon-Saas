import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { payments, reminders, salons, subscriptions, users } from "@/db/schema";
import { fallbackAdminMetrics, fallbackPayments, fallbackSalons } from "@/lib/fallback-data";

export async function getAdminOverview() {
  try {
    const [metrics] = await db
      .select({
        totalSalons: sql<number>`count(*)`,
        activeSubscriptions: sql<number>`count(*) filter (where ${subscriptions.status} = 'active')`,
        trialUsers: sql<number>`count(*) filter (where ${subscriptions.status} = 'trial')`,
        overdueSalons: sql<number>`count(*) filter (where ${subscriptions.status} in ('overdue', 'expired'))`,
        mrr: sql<number>`coalesce(sum(${salons.mrr}), 0)`,
        revenueThisMonth: sql<number>`coalesce(sum(${payments.amount}) filter (where date_trunc('month', ${payments.createdAt}) = date_trunc('month', now())), 0)`,
        churnedSalons: sql<number>`count(*) filter (where ${subscriptions.status} = 'canceled')`,
        newSignups: sql<number>`count(*) filter (where date_trunc('month', ${salons.createdAt}) = date_trunc('month', now()))`,
        remindersSent: sql<number>`count(*) filter (where ${reminders.status} = 'sent')`,
        failedPayments: sql<number>`count(*) filter (where ${payments.status} = 'failed')`,
      })
      .from(salons)
      .leftJoin(subscriptions, eq(subscriptions.salonId, salons.id))
      .leftJoin(payments, eq(payments.salonId, salons.id))
      .leftJoin(reminders, eq(reminders.salonId, salons.id));

    return metrics
      ? {
          totalSalons: Number(metrics.totalSalons ?? 0),
          activeSubscriptions: Number(metrics.activeSubscriptions ?? 0),
          trialUsers: Number(metrics.trialUsers ?? 0),
          overdueSalons: Number(metrics.overdueSalons ?? 0),
          mrr: Number(metrics.mrr ?? 0),
          revenueThisMonth: Number(metrics.revenueThisMonth ?? 0),
          churnedSalons: Number(metrics.churnedSalons ?? 0),
          newSignups: Number(metrics.newSignups ?? 0),
          remindersSent: Number(metrics.remindersSent ?? 0),
          failedPayments: Number(metrics.failedPayments ?? 0),
        }
      : fallbackAdminMetrics;
  } catch {
    return fallbackAdminMetrics;
  }
}

export async function listSalons() {
  try {
    const rows = await db
      .select({
        id: salons.id,
        name: salons.name,
        owner: users.name,
        city: salons.city,
        plan: salons.planId,
        status: salons.status,
        renewalDate: subscriptions.currentPeriodEnd,
        lastLogin: salons.lastLoginAt,
        mrr: salons.mrr,
      })
      .from(salons)
      .leftJoin(users, eq(users.id, salons.ownerUserId))
      .leftJoin(subscriptions, eq(subscriptions.salonId, salons.id))
      .orderBy(desc(salons.createdAt));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      owner: row.owner ?? "Unassigned",
      city: row.city ?? "Unknown",
      plan: row.plan,
      status: row.status,
      renewalDate: row.renewalDate?.toISOString().slice(0, 10) ?? "N/A",
      lastLogin: row.lastLogin?.toISOString().slice(0, 10) ?? "Never",
      mrr: Number(row.mrr ?? 0),
    }));
  } catch {
    return fallbackSalons.map((salon) => ({ ...salon }));
  }
}

export async function listRecentPayments() {
  try {
    const rows = await db
      .select({
        salon: salons.name,
        amount: payments.amount,
        status: payments.status,
        date: payments.paidAt,
        method: payments.provider,
      })
      .from(payments)
      .leftJoin(salons, eq(salons.id, payments.salonId))
      .orderBy(desc(payments.createdAt))
      .limit(12);

    return rows.map((row) => ({
      salon: row.salon ?? "Unknown salon",
      amount: Number(row.amount),
      status: row.status === "paid" ? "Paid" : row.status === "failed" ? "Failed" : row.status,
      date: row.date?.toISOString().slice(0, 10) ?? "Pending",
      method: row.method,
    }));
  } catch {
    return fallbackPayments;
  }
}

export async function listRecentPaymentsForSalon(salonId: string) {
  try {
    const rows = await db
      .select({
        salon: salons.name,
        amount: payments.amount,
        status: payments.status,
        date: payments.paidAt,
        method: payments.provider,
      })
      .from(payments)
      .leftJoin(salons, eq(salons.id, payments.salonId))
      .where(eq(payments.salonId, salonId))
      .orderBy(desc(payments.createdAt))
      .limit(12);

    return rows.map((row) => ({
      salon: row.salon ?? "Unknown salon",
      amount: Number(row.amount),
      status: row.status === "paid" ? "Paid" : row.status === "failed" ? "Failed" : row.status,
      date: row.date?.toISOString().slice(0, 10) ?? "Pending",
      method: row.method,
    }));
  } catch {
    return fallbackPayments;
  }
}
