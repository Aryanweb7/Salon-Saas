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
  title?: string;
  description?: string;
}

export function CustomerModal({
  trigger,
  customerId,
  initialData,
  title = "Add Customer",
  description = "Add a new customer to your CRM",
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
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
