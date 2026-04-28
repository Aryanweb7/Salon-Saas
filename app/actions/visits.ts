"use server";

import { z } from "zod";
import { getSessionContext } from "@/lib/auth";
import { createVisit, getVisitsByCustomer } from "@/lib/db/visits";
import { listVisitsForSalon } from "@/lib/db/reports";

const visitSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  services: z.array(z.string()).min(1, "At least one service is required"),
  amount: z.string().min(1, "Amount is required"),
  visitedAt: z.string().min(1, "Date is required"),
  staffId: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type VisitFormData = z.infer<typeof visitSchema>;

export async function createVisitAction(data: VisitFormData) {
  const session = await getSessionContext();

  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
  }

  const validated = visitSchema.parse(data);

  try {
    const result = await createVisit(session.salonId, {
      customerId: validated.customerId,
      services: validated.services,
      amount: validated.amount,
      visitedAt: new Date(validated.visitedAt),
      staffId: validated.staffId || undefined,
      paymentMethod: validated.paymentMethod || undefined,
      notes: validated.notes || undefined,
    });

    return { success: true, visitId: result?.id };
  } catch (error) {
    return { success: false, error: "Failed to create visit" };
  }
}

export async function getCustomerVisitsAction(customerId: string) {
  const session = await getSessionContext();

  if (!session.salonId) {
    return [];
  }

  return getVisitsByCustomer(customerId, session.salonId);
}

export async function getVisitsForSalonAction() {
  const session = await getSessionContext();

  if (!session.salonId) {
    return [];
  }

  return listVisitsForSalon(session.salonId);
}

