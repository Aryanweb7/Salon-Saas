"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";

import { createAppointmentAction } from "@/app/actions/appointments";
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

type Option = {
  id: string;
  name: string;
  phone?: string;
  role?: string;
};

export function AppointmentBookingModal({
  customers,
  staff,
  readOnly,
}: {
  customers: Option[];
  staff: Option[];
  readOnly: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createAppointmentAction({
        customerId: String(form.get("customerId") ?? ""),
        staffId: String(form.get("staffId") ?? ""),
        serviceName: String(form.get("serviceName") ?? ""),
        date: String(form.get("date") ?? ""),
        time: String(form.get("time") ?? ""),
        durationMinutes: Number(form.get("durationMinutes") ?? 60),
        status: String(form.get("status") ?? "confirmed") as "pending" | "confirmed",
        notes: String(form.get("notes") ?? ""),
      });

      if (!result.success) {
        setError(result.error ?? "Failed to create booking");
        return;
      }

      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={readOnly}>
          <Plus className="mr-2 h-4 w-4" />
          Create Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create booking</DialogTitle>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={onSubmit}>
          {error ? (
            <div className="rounded-lg border border-[var(--danger)]/30 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select name="customerId">
                <SelectTrigger>
                  <SelectValue placeholder="Walk-in or select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}{customer.phone ? ` - ${customer.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Staff</Label>
              <Select name="staffId">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceName">Service</Label>
            <Input id="serviceName" name="serviceName" placeholder="Haircut + beard, hair spa, bridal trial..." required />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input id="time" name="time" type="time" defaultValue="10:00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration</Label>
              <Input id="durationMinutes" name="durationMinutes" type="number" min={15} step={15} defaultValue={60} required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue="confirmed">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Optional booking notes" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending}>
              {isPending ? "Creating..." : "Save booking"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
