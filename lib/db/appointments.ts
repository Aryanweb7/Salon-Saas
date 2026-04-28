import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { appointments, customers, reminders, staff } from "@/db/schema";
import { fallbackAppointmentSeries, fallbackAppointments, fallbackOwnerStats, fallbackReminders } from "@/lib/fallback-data";

export async function listAppointmentsForSalon(salonId: string) {
  try {
    const rows = await db
      .select({
        id: appointments.id,
        customer: customers.name,
        time: appointments.startAt,
        service: appointments.serviceName,
        staff: staff.name,
        status: appointments.status,
      })
      .from(appointments)
      .leftJoin(customers, eq(customers.id, appointments.customerId))
      .leftJoin(staff, eq(staff.id, appointments.staffId))
      .where(eq(appointments.salonId, salonId))
      .orderBy(appointments.startAt)
      .limit(20);

    return rows.map((row) => ({
      id: row.id,
      customer: row.customer ?? "Walk-in",
      time: row.time.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
      service: row.service,
      staff: row.staff ?? "Unassigned",
      status: row.status.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    }));
  } catch {
    return fallbackAppointments;
  }
}

export async function getDashboardAppointmentStats(salonId: string) {
  try {
    const [stats] = await db
      .select({
        todayAppointments: sql<number>`count(*) filter (where date(${appointments.startAt}) = current_date)`,
      })
      .from(appointments)
      .where(eq(appointments.salonId, salonId));

    const reminderRows = await db
      .select({
        template: reminders.template,
        scheduledFor: reminders.scheduledFor,
        provider: reminders.provider,
        status: reminders.status,
      })
      .from(reminders)
      .where(eq(reminders.salonId, salonId))
      .orderBy(desc(reminders.scheduledFor))
      .limit(5);

    return {
      todayAppointments: Number(stats?.todayAppointments ?? 0),
      pendingReminders: reminderRows.length,
      reminders: reminderRows.map((row) => ({
        template: row.template,
        scheduledFor: row.scheduledFor.toLocaleString("en-IN"),
        provider: row.provider,
        status: row.status.replace(/\b\w/g, (char) => char.toUpperCase()),
      })),
    };
  } catch {
    return {
      todayAppointments: fallbackOwnerStats.todayAppointments,
      pendingReminders: fallbackOwnerStats.pendingReminders,
      reminders: fallbackReminders,
    };
  }
}

export async function getAppointmentSeries(_salonId: string) {
  return fallbackAppointmentSeries;
}
