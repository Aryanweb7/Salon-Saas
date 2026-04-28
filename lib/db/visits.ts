import { desc, eq, and } from "drizzle-orm";

import { db } from "@/db";
import { visits, customers } from "@/db/schema";

export async function createVisit(
  salonId: string,
  data: {
    customerId: string;
    services: string[];
    amount: string;
    visitedAt: Date;
    staffId?: string;
    paymentMethod?: string;
    notes?: string;
  }
) {
  try {
    const serviceName = data.services.join(", ");
    
    const [result] = await db
      .insert(visits)
      .values({
        salonId,
        customerId: data.customerId,
        serviceName,
        amount: data.amount,
        staffId: data.staffId,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        visitedAt: data.visitedAt,
      })
      .returning({ id: visits.id });

    // Update customer's lastVisitAt
    await db
      .update(customers)
      .set({ lastVisitAt: data.visitedAt })
      .where(eq(customers.id, data.customerId));

    return result;
  } catch {
    throw new Error("Failed to create visit");
  }
}

export async function getVisitsByCustomer(customerId: string, salonId: string) {
  try {
    const rows = await db
      .select({
        id: visits.id,
        serviceName: visits.serviceName,
        amount: visits.amount,
        paymentMethod: visits.paymentMethod,
        notes: visits.notes,
        visitedAt: visits.visitedAt,
      })
      .from(visits)
      .where(and(eq(visits.customerId, customerId), eq(visits.salonId, salonId)))
      .orderBy(desc(visits.visitedAt));

    return rows.map((row) => ({
      id: row.id,
      service: row.serviceName,
      amount: Number(row.amount),
      paymentMethod: row.paymentMethod ?? "N/A",
      notes: row.notes ?? "",
      date: row.visitedAt.toISOString().slice(0, 10),
    }));
  } catch {
    return [];
  }
}
