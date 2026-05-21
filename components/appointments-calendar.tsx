"use client";

import { CalendarRange } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Appointment = {
  id: string;
  customer: string;
  startAt: string;
  time: string;
  service: string;
  staff: string;
  status: string;
};

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function AppointmentsCalendar({ appointments }: { appointments: Appointment[] }) {
  const [calendarOpen, setCalendarOpen] = useState(true);
  const days = useMemo(() => {
    const weekStart = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return date;
    });
  }, []);

  const appointmentsByDay = useMemo(() => {
    return appointments.reduce<Record<string, Appointment[]>>((acc, appointment) => {
      const key = appointment.startAt.slice(0, 10);
      acc[key] = acc[key] ?? [];
      acc[key].push(appointment);
      return acc;
    }, {});
  }, [appointments]);

  return (
    <section className="space-y-3">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold">Calendar</h2>
          <p className="text-sm text-[var(--muted-foreground)]">This week&apos;s bookings grouped by day.</p>
        </div>
        <Button className="w-full sm:w-auto" variant="outline" onClick={() => setCalendarOpen((value) => !value)}>
          <CalendarRange className="mr-2 h-4 w-4" />
          {calendarOpen ? "Hide Calendar" : "Calendar View"}
        </Button>
      </div>

      {calendarOpen ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          {days.map((day) => {
            const key = formatDayKey(day);
            const dayAppointments = appointmentsByDay[key] ?? [];

            return (
              <Card key={key} className="min-h-48 space-y-3 p-4">
                <div>
                  <p className="text-sm font-semibold">{day.toLocaleDateString("en-IN", { weekday: "short" })}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{day.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                </div>

                <div className="space-y-2">
                  {dayAppointments.length ? (
                    dayAppointments.map((appointment) => (
                      <div key={appointment.id} className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 p-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold">{appointment.time}</p>
                          <Badge tone={appointment.status === "Pending" ? "warning" : "success"}>{appointment.status}</Badge>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium">{appointment.customer}</p>
                        <p className="truncate text-xs text-[var(--muted-foreground)]">{appointment.service}</p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg border border-dashed border-[var(--border)] p-3 text-xs text-[var(--muted-foreground)]">
                      No bookings
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
