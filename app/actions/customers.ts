"use server";

import { z } from "zod";
import { getSessionContext } from "@/lib/auth";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
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

export type CustomerFormData = z.infer<typeof customerSchema>;

export async function createCustomerAction(data: CustomerFormData) {
  const session = await getSessionContext();

  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
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
    return { success: false, error: "Failed to create customer" };
  }
}

export async function updateCustomerAction(
  customerId: string,
  data: CustomerFormData
) {
  const session = await getSessionContext();

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
  const session = await getSessionContext();

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
