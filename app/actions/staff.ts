"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionContext } from "@/lib/auth";
import { createStaffMember, getStaffCountForSalon } from "@/lib/db/staff";
import { assertCanMutateWorkspace, assertPlanCapacity } from "@/lib/permissions";

const staffSchema = z.object({
  name: z.string().min(1, "Name is required").max(160),
  roleLabel: z.string().min(1, "Role is required").max(120),
  commissionRate: z.coerce.number().int().min(0).max(100),
  attendanceRate: z.coerce.number().int().min(0).max(100),
});

export type StaffFormData = z.infer<typeof staffSchema>;

export async function createStaffAction(data: StaffFormData) {
  const permission = await assertCanMutateWorkspace();

  if (!permission.allowed) {
    return { success: false, error: permission.message ?? "Action blocked" };
  }

  const session = permission.session ?? (await getSessionContext());

  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
  }

  const staffCount = await getStaffCountForSalon(session.salonId);
  const capacity = await assertPlanCapacity({
    staffCount,
    customerCount: 0,
    remindersSent: 0,
  });

  if (!capacity.staffAllowed) {
    return { success: false, error: "Staff limit reached for your current plan." };
  }

  const validated = staffSchema.parse(data);

  try {
    const result = await createStaffMember(session.salonId, validated);
    revalidatePath("/staff");
    revalidatePath("/appointments");
    revalidatePath("/reports");
    revalidatePath("/dashboard");

    return { success: true, staffId: result?.id };
  } catch {
    return { success: false, error: "Failed to create staff member" };
  }
}
