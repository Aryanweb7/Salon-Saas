import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { staff, visits } from "@/db/schema";
import { fallbackRevenueSeries, fallbackStaff } from "@/lib/fallback-data";

function getLastSixMonths() {
  const formatter = new Intl.DateTimeFormat("en-IN", { month: "short" });
  const current = new Date();
  current.setDate(1);
  current.setHours(0, 0, 0, 0);

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(current);
    date.setMonth(current.getMonth() - (5 - index));

    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      name: formatter.format(date),
      revenue: 0,
      visits: 0,
    };
  });
}

export async function getRevenueSeries(salonId: string) {
  if (!salonId) {
    return getLastSixMonths();
  }

  const monthKey = sql<string>`to_char(date_trunc('month', ${visits.visitedAt}), 'YYYY-MM')`;

  try {
    const rows = await db
      .select({
        month: monthKey,
        revenue: sql<string>`coalesce(sum(${visits.amount}), 0)`,
        visitCount: sql<number>`count(*)`,
      })
      .from(visits)
      .where(sql`${visits.salonId} = ${salonId} and ${visits.visitedAt} >= date_trunc('month', now()) - interval '5 months'`)
      .groupBy(monthKey)
      .orderBy(monthKey);

    const byMonth = new Map(
      rows.map((row) => [
        row.month,
        {
          revenue: Number(row.revenue ?? 0),
          visits: Number(row.visitCount ?? 0),
        },
      ]),
    );

    return getLastSixMonths().map((month) => ({
      ...month,
      revenue: byMonth.get(month.key)?.revenue ?? 0,
      visits: byMonth.get(month.key)?.visits ?? 0,
    }));
  } catch {
    return fallbackRevenueSeries;
  }
}

export async function listStaffReport(salonId: string) {
  try {
    const rows = await db
      .select({
        name: staff.name,
        role: staff.roleLabel,
        commission: staff.commissionRate,
        sales: staff.salesTotal,
      })
      .from(staff)
      .where(eq(staff.salonId, salonId))
      .orderBy(desc(staff.salesTotal));

    return rows.map((row) => ({
      name: row.name,
      role: row.role,
      commission: row.commission,
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
