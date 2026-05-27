"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VisitForm } from "@/components/visit-form";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birthday?: string;
  gender?: string;
  preferredStaffId?: string;
  lastVisit?: string;
  preferredStylist?: string;
  notes?: string;
}

interface VisitModalProps {
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  customers: Customer[];
  staffOptions?: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

export function VisitModal({
  trigger,
  title = "Record a Visit",
  description = "Add a new customer visit and services",
  customers,
  staffOptions = [],
  onSuccess,
}: VisitModalProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <VisitForm customers={customers} staffOptions={staffOptions} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
