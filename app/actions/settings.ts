"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionContext } from "@/lib/auth";
import { updateBusinessProfile } from "@/lib/db/settings";
import { assertCanMutateWorkspace } from "@/lib/permissions";

const businessProfileSchema = z.object({
  salonName: z.string().min(1, "Salon name is required").max(160),
  city: z.string().max(120).optional().or(z.literal("")),
  gstNumber: z.string().max(40).optional().or(z.literal("")),
  contactNumber: z.string().max(32).optional().or(z.literal("")),
  taxBehavior: z.enum(["inclusive", "exclusive", "not_applicable"]),
  receiptIdentity: z.string().max(160).optional().or(z.literal("")),
  brandingEnabled: z.boolean(),
});

export type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;

export async function updateBusinessProfileAction(data: BusinessProfileFormData) {
  const permission = await assertCanMutateWorkspace();

  if (!permission.allowed) {
    return { success: false, error: permission.message ?? "Action blocked" };
  }

  const session = permission.session ?? (await getSessionContext());

  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
  }

  const validated = businessProfileSchema.parse(data);

  try {
    await updateBusinessProfile(session.salonId, validated);
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update business profile" };
  }
}
