"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateBusinessProfileAction } from "@/app/actions/settings";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { SalonSettingsConfig } from "@/lib/db/settings";

export function BusinessProfileSettings({
  salonName,
  city,
  config,
  brandingEnabled,
  readOnly,
}: {
  salonName: string;
  city: string;
  config: SalonSettingsConfig;
  brandingEnabled: boolean;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(brandingEnabled);
  const [taxBehavior, setTaxBehavior] = useState(config.taxBehavior ?? "inclusive");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateBusinessProfileAction({
        salonName: String(form.get("salonName") ?? ""),
        city: String(form.get("city") ?? ""),
        gstNumber: String(form.get("gstNumber") ?? ""),
        taxBehavior: taxBehavior as "inclusive" | "exclusive" | "not_applicable",
        receiptIdentity: String(form.get("receiptIdentity") ?? ""),
        brandingEnabled: enabled,
      });

      if (!result.success) {
        setMessage(result.error ?? "Failed to update profile");
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={readOnly}>Edit profile</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Business profile</DialogTitle>
          <DialogDescription>Update receipt identity, tax behavior, and salon details.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={onSubmit}>
          {message ? <FormMessage>{message}</FormMessage> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Salon name" id="salonName">
              <Input id="salonName" name="salonName" defaultValue={salonName} required />
            </Field>
            <Field label="City" id="city">
              <Input id="city" name="city" defaultValue={city ?? ""} />
            </Field>
            <Field label="GST number" id="gstNumber">
              <Input id="gstNumber" name="gstNumber" defaultValue={config.gstNumber ?? ""} placeholder="Optional" />
            </Field>
            <Field label="Tax behavior" id="taxBehavior">
              <Select value={taxBehavior} onValueChange={setTaxBehavior}>
                <SelectTrigger id="taxBehavior">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inclusive">Tax inclusive</SelectItem>
                  <SelectItem value="exclusive">Tax exclusive</SelectItem>
                  <SelectItem value="not_applicable">Not applicable</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Receipt identity" id="receiptIdentity">
            <Input id="receiptIdentity" name="receiptIdentity" defaultValue={config.receiptIdentity ?? salonName} />
          </Field>
          <div className="flex items-center justify-between rounded-2xl border p-4">
            <div>
              <p className="font-medium">Branding enabled</p>
              <p className="text-sm text-[var(--muted-foreground)]">Use the saved receipt identity across customer receipts.</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <DialogActions isPending={isPending} pendingLabel="Saving..." label="Save profile" onCancel={() => setOpen(false)} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function FormMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--danger)]/30 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--danger)]">
      {children}
    </div>
  );
}

function DialogActions({
  isPending,
  pendingLabel,
  label,
  onCancel,
  disabled,
}: {
  isPending: boolean;
  pendingLabel: string;
  label: string;
  onCancel: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button disabled={isPending || disabled}>
        {isPending ? pendingLabel : label}
      </Button>
    </div>
  );
}
