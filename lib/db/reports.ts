import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { staff, visits } from "@/db/schema";
import { fallbackRevenueSeries, fallbackStaff } from "@/lib/fallback-data";

export async function getRevenueSeries(_salonId: string) {
  return fallbackRevenueSeries;
}

export async function listStaffReport(salonId: string) {
  try {
    const rows = await db
      .select({
        name: staff.name,
        role: staff.roleLabel,
        commission: staff.commissionRate,
        attendance: staff.attendanceRate,
        sales: staff.salesTotal,
      })
      .from(staff)
      .where(eq(staff.salonId, salonId))
      .orderBy(desc(staff.salesTotal));

    return rows.map((row) => ({
      name: row.name,
      role: row.role,
      commission: row.commission,
      attendance: `${row.attendance}%`,
      sales: row.sales,
    }));
  } catch {
    return fallbackStaff;
  }
}

export async function listVisitsForSalon(salonId: string) {
  try {
    const rows = await db
      .select({
        id: visits.id,
        service: visits.serviceName,
        amount: visits.amount,
        staff: staff.name,
        date: visits.visitedAt,
        paymentMethod: visits.paymentMethod,
        notes: visits.notes,
      })
      .from(visits)
      .leftJoin(staff, eq(staff.id, visits.staffId))
      .where(eq(visits.salonId, salonId))
      .orderBy(desc(visits.visitedAt))
      .limit(20);

    return rows.map((row) => ({
      id: row.id,
      service: row.service,
      amount: Number(row.amount),
      staff: row.staff ?? "Unassigned",
      date: row.date.toISOString().slice(0, 10),
      paymentMethod: row.paymentMethod ?? "Unknown",
      notes: row.notes ?? "",
    }));
  } catch {
    return fallbackStaff.map((member, index) => ({
      id: `fallback-${index}`,
      service: ["Haircut", "Color", "Hair Spa", "Beard Groom"][index],
      amount: [900, 2400, 1800, 600][index],
      staff: member.name,
      date: `2026-04-${(19 + index).toString().padStart(2, "0")}`,
      paymentMethod: ["UPI", "Card", "Cash", "UPI"][index],
      notes: ["Upsold serum", "First-time client", "Membership pitch", "Walk-in"][index],
    }));
  }
}
