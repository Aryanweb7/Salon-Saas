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
  } catch {
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
      })
      .from(customers)
      .where(eq(customers.salonId, salonId));

    const [revenue] = await db
      .select({
        monthRevenue: sql<number>`coalesce(sum(${visits.amount}) filter (where date_trunc('month', ${visits.visitedAt}) = date_trunc('month', now())), 0)`,
      })
      .from(visits)
      .where(eq(visits.salonId, salonId));

    return {
      totalCustomers: Number(stats?.totalCustomers ?? 0),
      returningCustomers: Number(stats?.returningCustomers ?? 0),
      monthRevenue: Number(revenue?.monthRevenue ?? 0),
    };
  } catch {
    return {
      totalCustomers: fallbackOwnerStats.totalCustomers,
      returningCustomers: fallbackOwnerStats.returningCustomers,
      monthRevenue: fallbackOwnerStats.monthRevenue,
    };
  }
}
