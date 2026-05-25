"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CustomerForm } from "./customer-form";
import type { CustomerFormData } from "@/app/actions/customers";

interface CustomerModalProps {
  trigger: React.ReactNode;
  customerId?: string;
  initialData?: Partial<CustomerFormData>;
  staffOptions?: Array<{ id: string; name: string }>;
  title?: string;
  description?: string;
  onSuccess?: () => void | Promise<void>;
}

export function CustomerModal({
  trigger,
  customerId,
  initialData,
  staffOptions,
  title = "Add Customer",
  description = "Add a new customer to your CRM",
  onSuccess,
}: CustomerModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <CustomerForm
          customerId={customerId}
          initialData={initialData}
          staffOptions={staffOptions}
          onSuccess={async () => {
            setOpen(false);
            await onSuccess?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
