import { and, desc, eq, gte, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { appointments, customers, reminders, staff } from "@/db/schema";
import { fallbackAppointmentSeries, fallbackAppointments, fallbackOwnerStats, fallbackReminders } from "@/lib/fallback-data";

export async function listAppointmentsForSalon(salonId: string) {
  try {
    const rows = await db
      .select({
        id: appointments.id,
        customer: customers.name,
        customerId: appointments.customerId,
        time: appointments.startAt,
        endAt: appointments.endAt,
        service: appointments.serviceName,
        staff: staff.name,
        staffId: appointments.staffId,
        status: appointments.status,
        notes: appointments.notes,
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
      customerId: row.customerId,
      startAt: row.time.toISOString(),
      endAt: row.endAt?.toISOString() ?? null,
      time: row.time.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
      service: row.service,
      staff: row.staff ?? "Unassigned",
      staffId: row.staffId,
      notes: row.notes ?? "",
      statusRaw: row.status,
      status: row.status.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    }));
  } catch {
    const today = new Date();
    return fallbackAppointments.map((appointment, index) => {
      const startAt = new Date(today);
      startAt.setHours(10 + index * 2, index % 2 === 0 ? 30 : 0, 0, 0);

      return {
        ...appointment,
        id: `fallback-${index}`,
        customerId: null,
        staffId: null,
        startAt: startAt.toISOString(),
        endAt: null,
        notes: "",
        statusRaw: appointment.status.toLowerCase() as "pending",
      };
    });
  }
}

export async function listAppointmentFormOptions(salonId: string) {
  try {
    const [customerRows, staffRows] = await Promise.all([
      db
        .select({
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
        })
        .from(customers)
        .where(eq(customers.salonId, salonId))
        .orderBy(customers.name)
        .limit(100),
      db
        .select({
          id: staff.id,
          name: staff.name,
          role: staff.roleLabel,
        })
        .from(staff)
        .where(eq(staff.salonId, salonId))
        .orderBy(staff.name)
        .limit(50),
    ]);

    return {
      customers: customerRows,
      staff: staffRows,
    };
  } catch {
    return {
      customers: [],
      staff: [],
    };
  }
}

export async function createAppointment(
  salonId: string,
  data: {
    customerId?: string;
    staffId?: string;
    serviceName: string;
    startAt: Date;
    durationMinutes: number;
    status: "pending" | "confirmed";
    notes?: string;
  },
) {
  const endAt = new Date(data.startAt.getTime() + data.durationMinutes * 60_000);

  const [result] = await db
    .insert(appointments)
    .values({
      salonId,
      customerId: data.customerId,
      staffId: data.staffId,
      serviceName: data.serviceName,
      startAt: data.startAt,
      endAt,
      status: data.status,
      notes: data.notes,
    })
    .returning({ id: appointments.id });

  return result;
}

export async function rescheduleAppointment(
  appointmentId: string,
  salonId: string,
  data: {
    startAt: Date;
    durationMinutes: number;
    staffId?: string;
    notes?: string;
  },
) {
  const endAt = new Date(data.startAt.getTime() + data.durationMinutes * 60_000);

  await db
    .update(appointments)
    .set({
      startAt: data.startAt,
      endAt,
      staffId: data.staffId,
      notes: data.notes,
      status: "confirmed",
      updatedAt: new Date(),
    })
    .where(and(eq(appointments.id, appointmentId), eq(appointments.salonId, salonId)));
}

export async function cancelAppointment(appointmentId: string, salonId: string) {
  await db
    .update(appointments)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(and(eq(appointments.id, appointmentId), eq(appointments.salonId, salonId)));
}

export async function getDashboardAppointmentStats(salonId: string) {
  try {
    const [stats] = await db
      .select({
        todayAppointments: sql<number>`count(*) filter (where date(${appointments.startAt}) = current_date)`,
        yesterdayAppointments: sql<number>`count(*) filter (where date(${appointments.startAt}) = current_date - interval '1 day')`,
      })
      .from(appointments)
      .where(eq(appointments.salonId, salonId));

    const [reminderStats] = await db
      .select({
        pendingReminders: sql<number>`count(*) filter (where ${reminders.status} = 'queued')`,
        sentReminders: sql<number>`count(*) filter (where ${reminders.status} = 'sent')`,
        failedReminders: sql<number>`count(*) filter (where ${reminders.status} = 'failed')`,
      })
      .from(reminders)
      .where(eq(reminders.salonId, salonId));

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

    const todayAppointments = Number(stats?.todayAppointments ?? 0);
    const yesterdayAppointments = Number(stats?.yesterdayAppointments ?? 0);
    const sentReminders = Number(reminderStats?.sentReminders ?? 0);
    const failedReminders = Number(reminderStats?.failedReminders ?? 0);
    const deliveredTotal = sentReminders + failedReminders;

    return {
      todayAppointments,
      pendingReminders: Number(reminderStats?.pendingReminders ?? 0),
      appointmentTrend: formatCountDelta(todayAppointments, yesterdayAppointments, "vs yesterday"),
      reminderTrend: `${deliveredTotal ? Math.round((sentReminders / deliveredTotal) * 100) : 0}% delivery rate`,
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
      appointmentTrend: "0 vs yesterday",
      reminderTrend: "0% delivery rate",
      reminders: fallbackReminders,
    };
  }
}

function formatCountDelta(current: number, previous: number, suffix: string) {
  const delta = current - previous;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta} ${suffix}`;
}

function getCurrentWeekDays() {
  const formatter = new Intl.DateTimeFormat("en-IN", { weekday: "short" });
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      key: date.toISOString().slice(0, 10),
      day: formatter.format(date),
      bookings: 0,
    };
  });
}

export async function getAppointmentSeries(salonId: string) {
  const weekDays = getCurrentWeekDays();

  if (!salonId) {
    return weekDays;
  }

  const start = new Date(weekDays[0].key);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  const dateKey = sql<string>`to_char(date(${appointments.startAt}), 'YYYY-MM-DD')`;

  try {
    const rows = await db
      .select({
        date: dateKey,
        bookings: sql<number>`count(*)`,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.salonId, salonId),
          gte(appointments.startAt, start),
          lt(appointments.startAt, end),
        ),
      )
      .groupBy(dateKey)
      .orderBy(dateKey);

    const byDate = new Map(rows.map((row) => [row.date, Number(row.bookings ?? 0)]));

    return weekDays.map((day) => ({
      ...day,
      bookings: byDate.get(day.key) ?? 0,
    }));
  } catch {
    return fallbackAppointmentSeries;
  }
}
