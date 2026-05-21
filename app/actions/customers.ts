"use server";

import { z } from "zod";
import { getSessionContext } from "@/lib/auth";
import { assertCanMutateCustomers, assertPlanCapacity } from "@/lib/permissions";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomersCreatedThisMonthForSalon,
} from "@/lib/db/customers";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required").max(160),
  phone: z.string().min(1, "Phone is required").max(32),
  email: z.string().email().optional().or(z.literal("")),
  birthday: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  preferredStaffId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

const broadcastSchema = z.object({
  message: z.string().min(1, "Message is required").max(500, "Message must be 500 characters or less"),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export async function createCustomerAction(data: CustomerFormData) {
  const permission = await assertCanMutateCustomers();

  if (!permission.allowed) {
    return { success: false, error: permission.message ?? "Action blocked" };
  }

  const session = permission.session ?? (await getSessionContext());

  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
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

  const validated = customerSchema.parse(data);

  try {
    const result = await createCustomer(session.salonId, {
      name: validated.name,
      phone: validated.phone,
      email: validated.email || undefined,
      birthday: validated.birthday ? new Date(validated.birthday) : undefined,
      gender: validated.gender || undefined,
      preferredStaffId: validated.preferredStaffId || undefined,
      notes: validated.notes || undefined,
    });

    return { success: true, customerId: result?.id };
  } catch (error) {
    console.error("Failed to create customer action:", error);
    return { success: false, error: "Failed to create customer" };
  }
}

export async function sendCustomerBroadcastAction(data: { message: string }) {
  broadcastSchema.parse(data);
  return { success: false, error: "Broadcast messaging is not enabled in this app." };
}

export async function updateCustomerAction(
  customerId: string,
  data: CustomerFormData
) {
  const permission = await assertCanMutateCustomers();

  if (!permission.allowed) {
    return { success: false, error: permission.message ?? "Action blocked" };
  }

  const session = permission.session ?? (await getSessionContext());

  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
  }

  const validated = customerSchema.parse(data);

  try {
    await updateCustomer(customerId, session.salonId, {
      name: validated.name,
      phone: validated.phone,
      email: validated.email || undefined,
      birthday: validated.birthday ? new Date(validated.birthday) : undefined,
      gender: validated.gender || undefined,
      preferredStaffId: validated.preferredStaffId || undefined,
      notes: validated.notes || undefined,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update customer" };
  }
}

export async function deleteCustomerAction(customerId: string) {
  const permission = await assertCanMutateCustomers();

  if (!permission.allowed) {
    return { success: false, error: permission.message ?? "Action blocked" };
  }

  const session = permission.session ?? (await getSessionContext());

  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
  }

  try {
    await deleteCustomer(customerId, session.salonId);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete customer" };
  }
}

export async function getCustomerAction(customerId: string) {
  const session = await getSessionContext();

  if (!session.salonId) {
    return null;
  }

  return getCustomerById(customerId, session.salonId);
}
