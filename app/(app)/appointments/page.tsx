import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AppointmentBookingModal } from "@/components/appointment-booking-modal";
import { AppointmentCardActions } from "@/components/appointment-card-actions";
import { AppointmentsCalendar } from "@/components/appointments-calendar";
import { getSessionContext } from "@/lib/auth";
import { listAppointmentFormOptions, listAppointmentsForSalon } from "@/lib/db/appointments";

export default async function AppointmentsPage() {
  const session = await getSessionContext();
  const salonId = session.salonId ?? "";
  const [appointments, options] = await Promise.all([
    listAppointmentsForSalon(salonId),
    listAppointmentFormOptions(salonId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-semibold">Appointments</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">List and calendar views, walk-ins, reschedules, and staff assignment all live here.</p>
        </div>
        <AppointmentBookingModal customers={options.customers} staff={options.staff} readOnly={false} />
      </div>

      <AppointmentsCalendar appointments={appointments} />

      <div className="grid gap-4 lg:grid-cols-2">
        {appointments.map((appointment) => (
          <Card key={appointment.id} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{appointment.customer}</h2>
                <p className="text-sm text-[var(--muted-foreground)]">{appointment.service}</p>
              </div>
              <Badge tone={appointment.status === "Pending" ? "warning" : "success"}>{appointment.status}</Badge>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">{appointment.time} - Assigned to {appointment.staff}</p>
            {appointment.notes ? <p className="text-sm text-[var(--muted-foreground)]">{appointment.notes}</p> : null}
            <AppointmentCardActions appointment={appointment} staff={options.staff} readOnly={false} />
          </Card>
        ))}
      </div>
    </div>
  );
}
