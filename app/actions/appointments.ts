"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionContext } from "@/lib/auth";
import { cancelAppointment, createAppointment, rescheduleAppointment } from "@/lib/db/appointments";
import { assertCanMutateWorkspace } from "@/lib/permissions";

const appointmentSchema = z.object({
  customerId: z.string().optional().or(z.literal("")),
  staffId: z.string().optional().or(z.literal("")),
  serviceName: z.string().min(1, "Service is required").max(180),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  durationMinutes: z.coerce.number().int().min(15).max(480),
  status: z.enum(["pending", "confirmed"]),
  notes: z.string().optional().or(z.literal("")),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

export async function createAppointmentAction(data: AppointmentFormData) {
  const permission = await assertCanMutateWorkspace();

  if (!permission.allowed) {
    return { success: false, error: permission.message ?? "Action blocked" };
  }

  const session = permission.session ?? (await getSessionContext());
  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
  }

  const validated = appointmentSchema.parse(data);
  const startAt = new Date(`${validated.date}T${validated.time}:00`);

  if (Number.isNaN(startAt.getTime())) {
    return { success: false, error: "Invalid appointment date or time" };
  }

  try {
    const appointment = await createAppointment(session.salonId, {
      customerId: validated.customerId || undefined,
      staffId: validated.staffId || undefined,
      serviceName: validated.serviceName,
      startAt,
      durationMinutes: validated.durationMinutes,
      status: validated.status,
      notes: validated.notes || undefined,
    });

    revalidatePath("/appointments");
    revalidatePath("/dashboard");

    return { success: true, appointmentId: appointment.id };
  } catch {
    return { success: false, error: "Failed to create booking" };
  }
}

const rescheduleSchema = z.object({
  appointmentId: z.string().min(1, "Appointment is required"),
  staffId: z.string().optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  durationMinutes: z.coerce.number().int().min(15).max(480),
  notes: z.string().optional().or(z.literal("")),
});

export type RescheduleAppointmentFormData = z.infer<typeof rescheduleSchema>;

export async function rescheduleAppointmentAction(data: RescheduleAppointmentFormData) {
  const permission = await assertCanMutateWorkspace();

  if (!permission.allowed) {
    return { success: false, error: permission.message ?? "Action blocked" };
  }

  const session = permission.session ?? (await getSessionContext());
  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
  }

  const validated = rescheduleSchema.parse(data);
  const startAt = new Date(`${validated.date}T${validated.time}:00`);

  if (Number.isNaN(startAt.getTime())) {
    return { success: false, error: "Invalid appointment date or time" };
  }

  try {
    await rescheduleAppointment(validated.appointmentId, session.salonId, {
      startAt,
      durationMinutes: validated.durationMinutes,
      staffId: validated.staffId || undefined,
      notes: validated.notes || undefined,
    });

    revalidatePath("/appointments");
    revalidatePath("/dashboard");

    return { success: true };
  } catch {
    return { success: false, error: "Failed to reschedule appointment" };
  }
}

export async function cancelAppointmentAction(appointmentId: string) {
  const permission = await assertCanMutateWorkspace();

  if (!permission.allowed) {
    return { success: false, error: permission.message ?? "Action blocked" };
  }

  const session = permission.session ?? (await getSessionContext());
  if (!session.salonId) {
    return { success: false, error: "Salon not found" };
  }

  try {
    await cancelAppointment(appointmentId, session.salonId);

    revalidatePath("/appointments");
    revalidatePath("/dashboard");

    return { success: true };
  } catch {
    return { success: false, error: "Failed to cancel appointment" };
  }
}
