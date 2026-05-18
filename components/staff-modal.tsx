"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";

import { createStaffAction } from "@/app/actions/staff";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StaffModal({ readOnly }: { readOnly: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const formElement = event.currentTarget;

    startTransition(async () => {
      const result = await createStaffAction({
        name: String(form.get("name") ?? ""),
        roleLabel: String(form.get("roleLabel") ?? ""),
        commissionRate: Number(form.get("commissionRate") ?? 0),
      });

      if (!result.success) {
        setError(result.error ?? "Failed to add staff member");
        return;
      }

      formElement.reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={readOnly}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add staff member</DialogTitle>
          <DialogDescription>
            Add a team member to scheduling, reports, and commission tracking.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={onSubmit}>
          {error ? (
            <div className="rounded-lg border border-[var(--danger)]/30 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Staff name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleLabel">Role</Label>
              <Input id="roleLabel" name="roleLabel" placeholder="Stylist, receptionist..." required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commissionRate">Commission %</Label>
            <Input id="commissionRate" name="commissionRate" type="number" min={0} max={100} defaultValue={0} required />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending}>{isPending ? "Adding..." : "Add staff"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
