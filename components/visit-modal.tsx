"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VisitForm } from "@/components/visit-form";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  birthday?: string;
  gender?: string;
  lastVisit?: string;
  preferredStylist?: string;
}

interface VisitModalProps {
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  customers: Customer[];
  onSuccess?: () => void;
}

export function VisitModal({
  trigger,
  title = "Record a Visit",
  description = "Add a new customer visit and services",
  customers,
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
        <VisitForm customers={customers} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
