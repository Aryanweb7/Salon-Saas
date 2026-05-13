"use client";

import { useState } from "react";
import { toast } from "sonner";

import { getVisitsForSalonAction } from "@/app/actions/visits";
import { VisitModal } from "@/components/visit-modal";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  birthday?: string;
  gender?: string;
  lastVisit?: string;
  preferredStylist?: string;
}

interface Visit {
  id: string;
  service: string;
  amount: number;
  staff: string;
  date: string;
  paymentMethod: string;
  notes: string;
}

export function VisitsClient({
  initialCustomers,
  initialVisits,
}: {
  initialCustomers: Customer[];
  initialVisits: Visit[];
}) {
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadVisits = async () => {
    setIsRefreshing(true);
    try {
      const data = await getVisitsForSalonAction();
      setVisits(data);
    } catch {
      toast.error("Failed to load visits");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleVisitAdded = async () => {
    await loadVisits();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-semibold">Visit history & billing</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">Track every service sold, payment method used, and team member attached to revenue.</p>
        </div>
        {initialCustomers.length > 0 ? (
          <VisitModal
            trigger={<Button>Record Visit</Button>}
            title="Record a Visit"
            description="Add a new customer visit and services"
            customers={initialCustomers}
            onSuccess={handleVisitAdded}
          />
        ) : null}
      </div>

      <Card className="overflow-x-auto">
        <CardTitle className="mb-2">Recent visits</CardTitle>
        <CardDescription className="mb-4">
          {visits.length} visit{visits.length !== 1 ? "s" : ""}
        </CardDescription>
        <Table>
          <THead>
            <TR>
              <TH>Service</TH>
              <TH>Amount</TH>
              <TH>Staff</TH>
              <TH>Date</TH>
              <TH>Payment Method</TH>
              <TH>Notes</TH>
            </TR>
          </THead>
          <TBody>
            {isRefreshing ? (
              <TR>
                <TD colSpan={6} className="py-4 text-center">
                  Refreshing visits...
                </TD>
              </TR>
            ) : visits.length === 0 ? (
              <TR>
                <TD colSpan={6} className="py-4 text-center">
                  No visits recorded yet
                </TD>
              </TR>
            ) : (
              visits.map((visit) => (
                <TR key={visit.id}>
                  <TD className="font-medium">{visit.service}</TD>
                  <TD>{formatCurrency(visit.amount)}</TD>
                  <TD>{visit.staff}</TD>
                  <TD>{visit.date}</TD>
                  <TD>{visit.paymentMethod}</TD>
                  <TD>{visit.notes}</TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
