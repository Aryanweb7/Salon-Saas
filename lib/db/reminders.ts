import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { appointments, customers, messages, reminders, visits } from "@/db/schema";
import { sendWhatsAppMessage, WHATSAPP_PROVIDER } from "@/lib/messaging";

const REMINDER_TEMPLATES = {
  appointment: "appointment-reminder",
  revisit: "revisit-30-day",
  birthday: "birthday-offer",
} as const;

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function insertReminderIfMissing(params: {
  salonId: string;
  customerId: string;
  template: string;
  provider: string;
  scheduledFor: Date;
}) {
  const existing = await db
    .select({ id: reminders.id })
    .from(reminders)
    .where(
      and(
        eq(reminders.salonId, params.salonId),
        eq(reminders.customerId, params.customerId),
        eq(reminders.template, params.template),
        eq(reminders.scheduledFor, params.scheduledFor),
      ),
    )
    .limit(1);

  if (existing.length) {
    return false;
  }

  await db.insert(reminders).values({
    salonId: params.salonId,
    customerId: params.customerId,
    template: params.template,
    provider: params.provider,
    status: "queued",
    scheduledFor: params.scheduledFor,
  });

  return true;
}

export async function queueAppointmentReminders() {
  const from = addHours(new Date(), 23);
  const to = addHours(new Date(), 25);

  const rows = await db
    .select({
      salonId: appointments.salonId,
      customerId: customers.id,
      startAt: appointments.startAt,
    })
    .from(appointments)
    .innerJoin(customers, eq(customers.id, appointments.customerId))
    .where(
      and(
        gte(appointments.startAt, from),
        lte(appointments.startAt, to),
      ),
    );

  let queued = 0;

  for (const row of rows) {
    if (!row.customerId) {
      continue;
    }

    const inserted = await insertReminderIfMissing({
      salonId: row.salonId,
      customerId: row.customerId,
      template: REMINDER_TEMPLATES.appointment,
      provider: WHATSAPP_PROVIDER,
      scheduledFor: addHours(row.startAt, -2),
    });

    if (inserted) {
      queued += 1;
    }
  }

  return queued;
}

export async function queueRevisitReminders() {
  const cutoff = addDays(startOfToday(), -30);

  const rows = await db
    .select({
      salonId: customers.salonId,
      customerId: customers.id,
      lastVisitAt: customers.lastVisitAt,
    })
    .from(customers)
    .where(lte(customers.lastVisitAt, cutoff));

  let queued = 0;

  for (const row of rows) {
    if (!row.lastVisitAt) {
      continue;
    }

    const scheduledFor = addDays(new Date(row.lastVisitAt), 30);
    const inserted = await insertReminderIfMissing({
      salonId: row.salonId,
      customerId: row.customerId,
      template: REMINDER_TEMPLATES.revisit,
      provider: WHATSAPP_PROVIDER,
      scheduledFor,
    });

    if (inserted) {
      queued += 1;
    }
  }

  return queued;
}

export async function queueBirthdayReminders() {
  const today = startOfToday();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const rows = await db
    .select({
      salonId: customers.salonId,
      customerId: customers.id,
      birthday: customers.birthday,
    })
    .from(customers)
    .where(
      sql`extract(month from ${customers.birthday}) = ${month} and extract(day from ${customers.birthday}) = ${day}`,
    );

  let queued = 0;

  for (const row of rows) {
    if (!row.birthday) {
      continue;
    }

    const scheduledFor = new Date(today);
    scheduledFor.setHours(9, 0, 0, 0);

    const inserted = await insertReminderIfMissing({
      salonId: row.salonId,
      customerId: row.customerId,
      template: REMINDER_TEMPLATES.birthday,
      provider: WHATSAPP_PROVIDER,
      scheduledFor,
    });

    if (inserted) {
      queued += 1;
    }
  }

  return queued;
}

export async function dispatchQueuedReminders() {
  const rows = await db
    .select({
      reminderId: reminders.id,
      salonId: reminders.salonId,
      customerId: reminders.customerId,
      template: reminders.template,
      provider: reminders.provider,
      scheduledFor: reminders.scheduledFor,
      customerName: customers.name,
      phone: customers.phone,
      birthday: customers.birthday,
      lastVisitAt: customers.lastVisitAt,
      nextAppointmentAt: sql<Date | null>`(
        select min(${appointments.startAt})
        from ${appointments}
        where ${appointments.customerId} = ${customers.id}
          and ${appointments.salonId} = ${reminders.salonId}
          and ${appointments.startAt} >= now()
      )`,
      recentService: sql<string | null>`(
        select ${visits.serviceName}
        from ${visits}
        where ${visits.customerId} = ${customers.id}
          and ${visits.salonId} = ${reminders.salonId}
        order by ${visits.visitedAt} desc
        limit 1
      )`,
    })
    .from(reminders)
    .innerJoin(customers, eq(customers.id, reminders.customerId))
    .where(and(eq(reminders.status, "queued"), lte(reminders.scheduledFor, new Date())))
    .orderBy(desc(reminders.createdAt))
    .limit(50);

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const result = await sendWhatsAppMessage(WHATSAPP_PROVIDER, {
        to: row.phone,
        templateKey: row.template,
        variables: {
          customer_name: row.customerName,
          appointment_time: row.nextAppointmentAt?.toLocaleString("en-IN") ?? "",
          last_service: row.recentService ?? "",
          birthday_date: row.birthday?.toISOString().slice(5, 10) ?? "",
        },
      });

      await db.insert(messages).values({
        salonId: row.salonId,
        reminderId: row.reminderId,
        toPhone: row.phone,
        templateKey: row.template,
        provider: result.provider,
        status: "sent",
        referenceId: result.referenceId,
        payload: result.payload as unknown as Record<string, unknown>,
      });

      await db
        .update(reminders)
        .set({
          status: "sent",
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(reminders.id, row.reminderId));

      sent += 1;
    } catch {
      await db
        .update(reminders)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(reminders.id, row.reminderId));

      failed += 1;
    }
  }

  return { sent, failed };
}

export async function runDailyReminderAutomation() {
  const appointmentQueued = await queueAppointmentReminders();
  const revisitQueued = await queueRevisitReminders();
  const birthdayQueued = await queueBirthdayReminders();
  const delivery = await dispatchQueuedReminders();

  return {
    appointmentQueued,
    revisitQueued,
    birthdayQueued,
    sent: delivery.sent,
    failed: delivery.failed,
  };
}

export async function getMessagesSentThisMonthForSalon(salonId: string) {
  try {
    const [result] = await db
      .select({
        count: sql<number>`count(*) filter (where ${messages.createdAt} >= date_trunc('month', now()))`,
      })
      .from(messages)
      .where(eq(messages.salonId, salonId));

    return Number(result?.count ?? 0);
  } catch {
    return 0;
  }
}
