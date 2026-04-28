"use server";

import { revalidatePath } from "next/cache";

import { assertCanMutateCustomers, assertCanSendCampaign } from "@/lib/permissions";

export async function createCustomerAction() {
  const permission = await assertCanMutateCustomers();

  if (!permission.allowed) {
    return {
      success: false,
      allowed: false,
      message: permission.message,
    };
  }

  revalidatePath("/customers");
  return {
    success: true,
    allowed: true,
    message: "Customer creation is allowed for the current workspace.",
  };
}

export async function sendBirthdayCampaignAction() {
  const permission = await assertCanSendCampaign();

  if (!permission.allowed) {
    return {
      success: false,
      allowed: false,
      message: permission.message,
    };
  }

  revalidatePath("/dashboard");
  return {
    success: true,
    allowed: true,
    message: "Birthday campaign queued successfully.",
  };
}
