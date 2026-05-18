"use server";

import { z } from "zod";
import { getSessionContext } from "@/lib/auth";
import { assertCanMutateCustomers, assertPlanCapacity } from "@/lib/permissions";
import { db } from "@/db";
import { messages } from "@/db/schema";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomerCountForSalon,
  listCustomerPhonesForSalon,
} from "@/lib/db/customers";
import { getMessagesSentThisMonthForSalon } from "@/lib/db/reminders";
import { sendWhatsAppMessage, WHATSAPP_PROVIDER } from "@/lib/messaging";

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

  const customerCount = await getCustomerCountForSalon(session.salonId);
  const capacity = await assertPlanCapacity({
    staffCount: 0,
    customerCount,
    remindersSent: 0,
  });

  if (!capacity.customersAllowed) {
    return { success: false, error: "Customer limit reached for your current plan." };
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

    try {
      await sendCustomerWelcomeMessage({
        salonId: session.salonId,
        salonName: session.salonName ?? "our salon",
        customerName: validated.name,
        phone: validated.phone,
      });
    } catch (error) {
      console.error("Failed to send customer welcome message:", error);
    }

    return { success: true, customerId: result?.id };
  } catch (error) {
    console.error("Failed to create customer action:", error);
    return { success: false, error: "Failed to create customer" };
  }
}

export async function sendCustomerBroadcastAction(data: { message: string }) {
  const permission = await assertCanMutateCustomers();

  if (!permission.allowed) {
    return { success: false, error: permission.message ?? "Action blocked" };
  }

  const session = permission.session ?? (await getSessionContext());

  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
  }

  const validated = broadcastSchema.parse(data);
  const customers = await listCustomerPhonesForSalon(session.salonId);

  if (!customers.length) {
    return { success: false, error: "No customer phone numbers found" };
  }

  const messagesSent = await getMessagesSentThisMonthForSalon(session.salonId);
  const capacity = await assertPlanCapacity({
    staffCount: 0,
    customerCount: 0,
    remindersSent: messagesSent + customers.length - 1,
  });

  if (!capacity.remindersAllowed) {
    return { success: false, error: "Message limit reached for your current plan." };
  }

  const templateKey = "customer-broadcast";
  const body = validated.message.replace(/\[salon name\]/gi, session.salonName ?? "our salon");
  let sent = 0;
  let failed = 0;

  for (const customer of customers) {
    try {
      const result = await sendWhatsAppMessage(WHATSAPP_PROVIDER, {
        to: customer.phone,
        templateKey,
        variables: {
          customer_name: customer.name,
          salon_name: session.salonName ?? "our salon",
          message: body,
        },
      });

      await db.insert(messages).values({
        salonId: session.salonId,
        toPhone: customer.phone,
        templateKey,
        provider: result.provider,
        status: mapMessageStatus(result.status),
        referenceId: result.referenceId,
        payload: {
          ...result.payload,
          body,
          customerId: customer.id,
        },
      });

      sent += 1;
    } catch (error) {
      await db.insert(messages).values({
        salonId: session.salonId,
        toPhone: customer.phone,
        templateKey,
        provider: WHATSAPP_PROVIDER,
        status: "failed",
        payload: {
          body,
          customerId: customer.id,
          error: error instanceof Error ? error.message : "Failed to send broadcast message",
        },
      });

      failed += 1;
    }
  }

  return { success: true, sent, failed, total: customers.length };
}

async function sendCustomerWelcomeMessage(params: {
  salonId: string;
  salonName: string;
  customerName: string;
  phone: string;
}) {
  const templateKey = "customer-welcome";

  try {
    const result = await sendWhatsAppMessage(WHATSAPP_PROVIDER, {
      to: params.phone,
      templateKey,
      variables: {
        customer_name: params.customerName,
        salon_name: params.salonName,
      },
    });

    await db.insert(messages).values({
      salonId: params.salonId,
      toPhone: params.phone,
      templateKey,
      provider: result.provider,
      status: mapMessageStatus(result.status),
      referenceId: result.referenceId,
      payload: result.payload,
    });
  } catch (error) {
    await db.insert(messages).values({
      salonId: params.salonId,
      toPhone: params.phone,
      templateKey,
      provider: WHATSAPP_PROVIDER,
      status: "failed",
      payload: {
        error: error instanceof Error ? error.message : "Failed to send welcome message",
      },
    });

    throw error;
  }
}

function mapMessageStatus(status: string): "queued" | "sent" | "failed" {
  if (status === "sent" || status === "delivered") {
    return "sent";
  }

  if (status === "failed" || status === "undelivered") {
    return "failed";
  }

  return "queued";
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
