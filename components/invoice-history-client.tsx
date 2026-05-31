"use client";

import { useState } from "react";
import { Download, Eye, Mail, Printer } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

type Invoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customer: { name: string; phone: string; email: string };
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  pdfUrl: string;
  emailSent: boolean;
};

export function InvoiceHistoryClient({ initialInvoices }: { initialInvoices: Invoice[] }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshInvoices = async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const response = await fetch(`/api/invoices?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Failed to fetch invoices");
      setInvoices(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch invoices");
    } finally {
      setIsRefreshing(false);
    }
  };

  const resendInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/resend`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Failed to resend invoice");
      setInvoices((current) => current.map((invoice) => (invoice.id === invoiceId ? data : invoice)));
      toast.success("Invoice email resent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend invoice");
    }
  };

  const printInvoice = (pdfUrl: string) => {
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    frame.src = pdfUrl;
    document.body.appendChild(frame);
    frame.onload = () => frame.contentWindow?.print();
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="min-w-0">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Billing history</p>
        <h1 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">Invoice History</h1>
      </div>

      <Card className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_150px_150px_auto]">
          <Input placeholder="Invoice number or customer" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          <Button variant="outline" onClick={refreshInvoices} disabled={isRefreshing}>{isRefreshing ? "Searching..." : "Search"}</Button>
        </div>

        <CardTitle>Invoices</CardTitle>
        <CardDescription>View, download, print, or resend any stored invoice.</CardDescription>

        <Table className="min-w-[840px]">
          <THead>
            <TR>
              <TH>Invoice</TH>
              <TH>Customer</TH>
              <TH>Date</TH>
              <TH>Total</TH>
              <TH>Status</TH>
              <TH>Email</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {invoices.length ? invoices.map((invoice) => (
              <TR key={invoice.id}>
                <TD className="font-medium">{invoice.invoiceNumber}</TD>
                <TD>{invoice.customer.name}</TD>
                <TD>{new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}</TD>
                <TD>{formatCurrency(invoice.totalAmount)}</TD>
                <TD><Badge tone={invoice.paymentStatus === "paid" ? "success" : "warning"}>{invoice.paymentStatus}</Badge></TD>
                <TD><Badge tone={invoice.emailSent ? "success" : "default"}>{invoice.emailSent ? "Sent" : "Not sent"}</Badge></TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="icon" aria-label="View invoice"><a href={invoice.pdfUrl} target="_blank"><Eye className="h-4 w-4" /></a></Button>
                    <Button asChild variant="outline" size="icon" aria-label="Download invoice"><a href={invoice.pdfUrl} download><Download className="h-4 w-4" /></a></Button>
                    <Button variant="outline" size="icon" onClick={() => printInvoice(invoice.pdfUrl)} aria-label="Print invoice"><Printer className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => resendInvoice(invoice.id)} aria-label="Resend invoice"><Mail className="h-4 w-4" /></Button>
                  </div>
                </TD>
              </TR>
            )) : (
              <TR>
                <TD colSpan={7} className="py-6 text-center text-[var(--muted-foreground)]">No invoices found.</TD>
              </TR>
            )}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
