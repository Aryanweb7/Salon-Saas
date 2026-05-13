import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { payments, salons } from "@/db/schema";
import { fallbackPayments } from "@/lib/fallback-data";

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
