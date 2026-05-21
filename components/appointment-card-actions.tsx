"use client";

import { useState, useTransition } from "react";

import { cancelAppointmentAction, rescheduleAppointmentAction } from "@/app/actions/appointments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getIndiaDateKey, getIndiaTimeInputValue } from "@/lib/india-time";

type StaffOption = {
  id: string;
  name: string;
  role?: string;
};

type AppointmentActionData = {
  id: string;
  startAt: string;
  endAt: string | null;
  staffId: string | null;
  notes: string;
  statusRaw: string;
};

function dateValue(startAt: string) {
  return getIndiaDateKey(new Date(startAt));
}

function timeValue(startAt: string) {
  return getIndiaTimeInputValue(new Date(startAt));
}

function durationValue(startAt: string, endAt: string | null) {
  if (!endAt) return 60;
  const duration = Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000);
  return Number.isFinite(duration) && duration > 0 ? duration : 60;
}

export function AppointmentCardActions({
  appointment,
  staff,
  readOnly,
}: {
  appointment: AppointmentActionData;
  staff: StaffOption[];
  readOnly: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isLocked = appointment.statusRaw === "cancelled" || appointment.statusRaw === "completed";

  function onReschedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await rescheduleAppointmentAction({
        appointmentId: appointment.id,
        staffId: String(form.get("staffId") ?? ""),
        date: String(form.get("date") ?? ""),
        time: String(form.get("time") ?? ""),
        durationMinutes: Number(form.get("durationMinutes") ?? 60),
        notes: String(form.get("notes") ?? ""),
      });

      if (!result.success) {
        setError(result.error ?? "Failed to reschedule appointment");
        return;
      }

      setOpen(false);
    });
  }

  function onCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelAppointmentAction(appointment.id);

      if (!result.success) {
        setError(result.error ?? "Failed to cancel appointment");
      }
    });
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" variant="outline" size="sm" disabled={readOnly || isLocked}>
              Reschedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reschedule appointment</DialogTitle>
            </DialogHeader>

            <form className="grid gap-4" onSubmit={onReschedule}>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor={`date-${appointment.id}`}>Date</Label>
                  <Input id={`date-${appointment.id}`} name="date" type="date" defaultValue={dateValue(appointment.startAt)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`time-${appointment.id}`}>Time</Label>
                  <Input id={`time-${appointment.id}`} name="time" type="time" defaultValue={timeValue(appointment.startAt)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`duration-${appointment.id}`}>Duration</Label>
                  <Input
                    id={`duration-${appointment.id}`}
                    name="durationMinutes"
                    type="number"
                    min={15}
                    step={15}
                    defaultValue={durationValue(appointment.startAt, appointment.endAt)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Staff</Label>
                <Select name="staffId" defaultValue={appointment.staffId ?? undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}{member.role ? ` - ${member.role}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`notes-${appointment.id}`}>Notes</Label>
                <Textarea id={`notes-${appointment.id}`} name="notes" defaultValue={appointment.notes} />
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button className="w-full sm:w-auto" disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Button className="w-full sm:w-auto" variant="ghost" size="sm" disabled={readOnly || isPending || isLocked} onClick={onCancel}>
          {isPending ? "Working..." : "Cancel"}
        </Button>
      </div>
    </div>
  );
}
