import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { staff } from "@/db/schema";

export async function getStaffCountForSalon(salonId: string) {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(staff)
      .where(eq(staff.salonId, salonId));

    return Number(result?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function createStaffMember(
  salonId: string,
  data: {
    name: string;
    roleLabel: string;
    commissionRate: number;
  }
) {
  try {
    const [result] = await db
      .insert(staff)
      .values({
        salonId,
        name: data.name,
        roleLabel: data.roleLabel,
        commissionRate: data.commissionRate,
        attendanceRate: 0,
      })
      .returning({ id: staff.id });

    return result;
  } catch {
    throw new Error("Failed to create staff member");
  }
}

export async function getStaffDashboardStats(salonId: string) {
  try {
    const [result] = await db
      .select({
        totalStaff: sql<number>`count(*)`,
        newThisMonth: sql<number>`count(*) filter (where date_trunc('month', ${staff.createdAt}) = date_trunc('month', now()))`,
      })
      .from(staff)
      .where(eq(staff.salonId, salonId));

    const newThisMonth = Number(result?.newThisMonth ?? 0);

    return {
      totalStaff: Number(result?.totalStaff ?? 0),
      staffTrend: `${newThisMonth} new this month`,
    };
  } catch {
    return {
      totalStaff: 0,
      staffTrend: "0 new this month",
    };
  }
}
