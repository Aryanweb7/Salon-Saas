import { desc, eq, sql, and, or, ilike } from "drizzle-orm";

import { db } from "@/db";
import { customers, staff, visits } from "@/db/schema";
import { fallbackCustomers, fallbackOwnerStats } from "@/lib/fallback-data";

export async function listCustomersForSalon(salonId: string, search?: string) {
  try {
    const rows = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        birthday: customers.birthday,
        gender: customers.gender,
        lastVisit: customers.lastVisitAt,
        preferredStylist: staff.name,
      })
      .from(customers)
      .leftJoin(staff, eq(staff.id, customers.preferredStaffId))
      .where(search ? sql`${customers.salonId} = ${salonId} and (${customers.name} ilike ${`%${search}%`} or ${customers.phone} ilike ${`%${search}%`})` : eq(customers.salonId, salonId))
      .orderBy(desc(customers.createdAt))
      .limit(100);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      birthday: row.birthday?.toISOString().slice(0, 10) ?? "N/A",
      gender: row.gender ?? "N/A",
      lastVisit: row.lastVisit?.toISOString().slice(0, 10) ?? "N/A",
      preferredStylist: row.preferredStylist ?? "Unassigned",
    }));
  } catch {
    return fallbackCustomers;
  }
}

export async function getCustomerById(customerId: string, salonId: string) {
  try {
    const [row] = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        birthday: customers.birthday,
        gender: customers.gender,
        preferredStaffId: customers.preferredStaffId,
        notes: customers.notes,
      })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.salonId, salonId)))
      .limit(1);

    return row || null;
  } catch {
    return null;
  }
}

export async function getCustomerCountForSalon(salonId: string) {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(eq(customers.salonId, salonId));

    return Number(result?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function getCustomersCreatedThisMonthForSalon(salonId: string) {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(and(eq(customers.salonId, salonId), sql`${customers.createdAt} >= date_trunc('month', now())`));

    return Number(result?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function listCustomerPhonesForSalon(salonId: string) {
  try {
    const rows = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
      })
      .from(customers)
      .where(eq(customers.salonId, salonId))
      .orderBy(desc(customers.createdAt));

    return rows.filter((customer) => customer.phone.trim().length > 0);
  } catch {
    return [];
  }
}

export async function createCustomer(
  salonId: string,
  data: {
    name: string;
    phone: string;
    email?: string;
    birthday?: Date;
    gender?: string;
    preferredStaffId?: string;
    notes?: string;
  }
) {
  try {
    const [result] = await db
      .insert(customers)
      .values({
        salonId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        birthday: data.birthday,
        gender: data.gender,
        preferredStaffId: data.preferredStaffId,
        notes: data.notes,
      })
      .returning({ id: customers.id });

    return result;
  } catch (error) {
    console.error("Failed to create customer", error);
    throw new Error("Failed to create customer");
  }
}

export async function updateCustomer(
  customerId: string,
  salonId: string,
  data: {
    name: string;
    phone: string;
    email?: string;
    birthday?: Date;
    gender?: string;
    preferredStaffId?: string;
    notes?: string;
  }
) {
  try {
    await db
      .update(customers)
      .set({
        name: data.name,
        phone: data.phone,
        email: data.email,
        birthday: data.birthday,
        gender: data.gender,
        preferredStaffId: data.preferredStaffId,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, customerId), eq(customers.salonId, salonId)));

    return true;
  } catch {
    throw new Error("Failed to update customer");
  }
}

export async function deleteCustomer(customerId: string, salonId: string) {
  try {
    await db
      .delete(customers)
      .where(and(eq(customers.id, customerId), eq(customers.salonId, salonId)));

    return true;
  } catch {
    throw new Error("Failed to delete customer");
  }
}

export async function getCustomerStats(salonId: string) {
  try {
    const [stats] = await db
      .select({
        totalCustomers: sql<number>`count(*)`,
        returningCustomers: sql<number>`coalesce(round((count(*) filter (where ${customers.lastVisitAt} is not null) * 100.0) / nullif(count(*), 0)), 0)`,
        currentMonthCustomers: sql<number>`count(*) filter (where date_trunc('month', ${customers.createdAt}) = date_trunc('month', now()))`,
        previousMonthCustomers: sql<number>`count(*) filter (where date_trunc('month', ${customers.createdAt}) = date_trunc('month', now()) - interval '1 month')`,
        previousReturningCustomers: sql<number>`coalesce(round((count(*) filter (where ${customers.lastVisitAt} is not null and ${customers.createdAt} < date_trunc('month', now())) * 100.0) / nullif(count(*) filter (where ${customers.createdAt} < date_trunc('month', now())), 0)), 0)`,
      })
      .from(customers)
      .where(eq(customers.salonId, salonId));

    const [revenue] = await db
      .select({
        monthRevenue: sql<number>`coalesce(sum(${visits.amount}) filter (where date_trunc('month', ${visits.visitedAt}) = date_trunc('month', now())), 0)`,
        previousMonthRevenue: sql<number>`coalesce(sum(${visits.amount}) filter (where date_trunc('month', ${visits.visitedAt}) = date_trunc('month', now()) - interval '1 month'), 0)`,
      })
      .from(visits)
      .where(eq(visits.salonId, salonId));

    const currentMonthCustomers = Number(stats?.currentMonthCustomers ?? 0);
    const previousMonthCustomers = Number(stats?.previousMonthCustomers ?? 0);
    const monthRevenue = Number(revenue?.monthRevenue ?? 0);
    const previousMonthRevenue = Number(revenue?.previousMonthRevenue ?? 0);
    const returningCustomers = Number(stats?.returningCustomers ?? 0);
    const previousReturningCustomers = Number(stats?.previousReturningCustomers ?? 0);

    return {
      totalCustomers: Number(stats?.totalCustomers ?? 0),
      returningCustomers,
      monthRevenue,
      customerTrend: formatCountDelta(currentMonthCustomers, previousMonthCustomers, "vs last month"),
      revenueTrend: formatPercentDelta(monthRevenue, previousMonthRevenue, "vs last month"),
      returningTrend: formatPointDelta(returningCustomers - previousReturningCustomers, "vs last month"),
    };
  } catch {
    return {
      totalCustomers: fallbackOwnerStats.totalCustomers,
      returningCustomers: fallbackOwnerStats.returningCustomers,
      monthRevenue: fallbackOwnerStats.monthRevenue,
      customerTrend: "0 vs last month",
      revenueTrend: "0% vs last month",
      returningTrend: "0 pts vs last month",
    };
  }
}

function formatCountDelta(current: number, previous: number, suffix: string) {
  const delta = current - previous;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta} ${suffix}`;
}

function formatPercentDelta(current: number, previous: number, suffix: string) {
  if (previous === 0) {
    return current > 0 ? "+100% vs last month" : `0% ${suffix}`;
  }

  const delta = Math.round(((current - previous) / previous) * 100);
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}% ${suffix}`;
}

function formatPointDelta(delta: number, suffix: string) {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta} pts ${suffix}`;
}
