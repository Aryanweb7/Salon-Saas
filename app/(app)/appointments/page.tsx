import { CalendarRange, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessionContext } from "@/lib/auth";
import { listAppointmentsForSalon } from "@/lib/db/appointments";

export default async function AppointmentsPage() {
  const session = await getSessionContext();
  const appointments = await listAppointmentsForSalon(session.salonId ?? "");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-semibold">Appointments</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">List and calendar views, walk-ins, reschedules, and staff assignment all live here.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline"><CalendarRange className="mr-2 h-4 w-4" /> Calendar View</Button>
          <Button><Plus className="mr-2 h-4 w-4" /> Create Booking</Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {appointments.map((appointment) => (
          <Card key={`${appointment.customer}-${appointment.time}`} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{appointment.customer}</h2>
                <p className="text-sm text-[var(--muted-foreground)]">{appointment.service}</p>
              </div>
              <Badge tone={appointment.status === "Pending" ? "warning" : "success"}>{appointment.status}</Badge>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">{appointment.time} - Assigned to {appointment.staff}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Reschedule</Button>
              <Button variant="ghost" size="sm">Cancel</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
