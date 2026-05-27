"use server";

import { z } from "zod";
import { getSessionContext } from "@/lib/auth";
import { createCustomer, getCustomersCreatedThisMonthForSalon } from "@/lib/db/customers";
import { createVisit, getVisitsByCustomer } from "@/lib/db/visits";
import { listVisitsForSalon } from "@/lib/db/reports";
import { assertCanMutateWorkspace, assertPlanCapacity } from "@/lib/permissions";

const visitSchema = z.object({
  customerId: z.string().optional().or(z.literal("")),
  customerName: z.string().optional().or(z.literal("")),
  customerPhone: z.string().optional().or(z.literal("")),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerBirthday: z.string().optional().or(z.literal("")),
  customerGender: z.string().optional().or(z.literal("")),
  preferredStaffId: z.string().uuid("Select a valid preferred stylist").optional().or(z.literal("")),
  customerNotes: z.string().optional().or(z.literal("")),
  services: z.array(z.string()).min(1, "At least one service is required"),
  amount: z.string().min(1, "Amount is required"),
  visitedAt: z.string().min(1, "Date is required"),
  staffId: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type VisitFormData = z.infer<typeof visitSchema>;

export async function createVisitAction(data: VisitFormData) {
  const permission = await assertCanMutateWorkspace();

  if (!permission.allowed) {
    return { success: false, error: permission.message ?? "Action blocked" };
  }

  const session = permission.session ?? (await getSessionContext());

  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
  }

  const validated = visitSchema.parse(data);

  try {
    let customerId = validated.customerId;

    if (!customerId) {
      if (!validated.customerName?.trim() || !validated.customerPhone?.trim()) {
        return { success: false, error: "Customer name and phone are required" };
      }

      const customerCount = await getCustomersCreatedThisMonthForSalon(session.salonId);
      const capacity = await assertPlanCapacity({
        staffCount: 0,
        customerCount,
        remindersSent: 0,
      });

      if (!capacity.customersAllowed) {
        return { success: false, error: "Monthly customer limit reached for your current plan." };
      }

      const customer = await createCustomer(session.salonId, {
        name: validated.customerName,
        phone: validated.customerPhone,
        email: validated.customerEmail || undefined,
        birthday: validated.customerBirthday ? new Date(validated.customerBirthday) : undefined,
        gender: validated.customerGender || undefined,
        preferredStaffId: validated.preferredStaffId || undefined,
        notes: validated.customerNotes || undefined,
      });

      customerId = customer?.id;
    }

    if (!customerId) {
      return { success: false, error: "Customer is required" };
    }

    const result = await createVisit(session.salonId, {
      customerId,
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

