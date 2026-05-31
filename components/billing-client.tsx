"use client";

import { useMemo, useState } from "react";
import { Download, Eye, Mail, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { calculateInvoiceTotals, type DiscountType } from "@/lib/billing/calculations";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

type CustomerOption = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

type InvoiceItemDraft = {
  kind: "service" | "product";
  name: string;
  quantity: number | "";
  unitPrice: number | "";
};

type InvoiceLineItem = {
  kind: "service" | "product";
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customer: { name: string; phone: string; email: string };
  items: InvoiceLineItem[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  pdfUrl: string;
  emailSent: boolean;
  salon: { name: string; address?: string; contactNumber?: string; gstNumber?: string };
};

const emptyItem: InvoiceItemDraft = {
  kind: "service",
  name: "",
  quantity: 1,
  unitPrice: 0,
};

export function BillingClient({
  customers,
  initialInvoices,
  salonName,
}: {
  customers: CustomerOption[];
  initialInvoices: Invoice[];
  salonName: string;
}) {
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [items, setItems] = useState<InvoiceItemDraft[]>([{ ...emptyItem }]);
  const [discountType, setDiscountType] = useState<DiscountType>("fixed");
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [invoices, setInvoices] = useState(initialInvoices);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formMessage, setFormMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const normalizedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
      })),
    [items],
  );

  const totals = useMemo(
    () => calculateInvoiceTotals({ items: normalizedItems, discountType, discountValue, taxRate }),
    [discountType, discountValue, normalizedItems, taxRate],
  );

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const customer = customers.find((entry) => entry.id === id);

    if (customer) {
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone);
      setCustomerEmail(customer.email);
    }
  };

  const updateItem = (index: number, patch: Partial<InvoiceItemDraft>) => {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  const selectInputValue = (event: React.FocusEvent<HTMLInputElement>) => {
    event.currentTarget.select();
  };

  const addItem = (kind: "service" | "product") => {
    setItems((current) => [...current, { ...emptyItem, kind }]);
  };

  const removeItem = (index: number) => {
    setItems((current) => (current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)));
  };

  const resetBill = () => {
    setCustomerId("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setItems([{ ...emptyItem }]);
    setDiscountType("fixed");
    setDiscountValue(0);
    setTaxRate(18);
    setPaymentMethod("UPI");
  };

  const refreshInvoices = async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const response = await fetch(`/api/invoices?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to fetch invoices");
      }

      setInvoices(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch invoices");
    } finally {
      setIsRefreshing(false);
    }
  };

  const createInvoice = async () => {
    setIsSubmitting(true);
    setFormMessage(null);
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          customerName,
          customerPhone,
          customerEmail,
          items: normalizedItems,
          discountType,
          discountValue,
          taxRate,
          paymentMethod,
          paymentStatus: "paid",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create invoice");
      }

      setInvoices((current) => [data, ...current]);
      setSelectedInvoice(data);
      resetBill();
      setFormMessage({
        tone: "success",
        text: data.emailSent ? "Invoice generated and emailed." : "Invoice generated. Email was not sent because no customer email was available or email delivery failed.",
      });
      toast.success(data.emailSent ? "Invoice generated and emailed" : "Invoice generated");
    } catch (error) {
      setFormMessage({
        tone: "danger",
        text: error instanceof Error ? error.message : "Failed to create invoice",
      });
      toast.error(error instanceof Error ? error.message : "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/resend`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to resend invoice");
      }

      setInvoices((current) => current.map((invoice) => (invoice.id === invoiceId ? data : invoice)));
      toast.success("Invoice email resent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend invoice");
    }
  };

  const printInvoice = (invoice: Invoice) => {
    if (!invoice.pdfUrl) return;
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    frame.src = invoice.pdfUrl;
    document.body.appendChild(frame);
    frame.onload = () => frame.contentWindow?.print();
  };

  return (
    <div className="min-w-0 space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="min-w-0">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Billing desk</p>
          <h1 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">Invoices & payments</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">Generate customer invoices, collect payment details, and send PDF receipts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <a href="/billing/history">Invoice history</a>
          </Button>
          <Badge tone="success">{salonName}</Badge>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="space-y-5">
          <div>
            <CardTitle>Generate bill</CardTitle>
            <CardDescription>Select an existing customer, add services or retail products, then generate the invoice.</CardDescription>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Existing customer</Label>
              <select
                className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm"
                value={customerId}
                onChange={(event) => handleCustomerChange(event.target.value)}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <select
                className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option>UPI</option>
                <option>Cash</option>
                <option>Card</option>
                <option>Net Banking</option>
                <option>Wallet</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Customer name</Label>
              <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone number</Label>
              <Input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Email</Label>
              <Input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Services & products</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => addItem("service")}>
                  <Plus className="mr-2 h-4 w-4" /> Service
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addItem("product")}>
                  <Plus className="mr-2 h-4 w-4" /> Product
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-2xl border p-3 md:grid-cols-[130px_1fr_90px_120px_44px] md:items-end">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
                      value={item.kind}
                      onChange={(event) => updateItem(index, { kind: event.target.value as "service" | "product" })}
                    >
                      <option value="service">Service</option>
                      <option value="product">Product</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={item.name} onChange={(event) => updateItem(index, { name: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onFocus={selectInputValue}
                      onChange={(event) => updateItem(index, { quantity: event.target.value === "" ? "" : Number(event.target.value) || 1 })}
                      onBlur={() => {
                        if (item.quantity === "") {
                          updateItem(index, { quantity: 1 });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={item.unitPrice === 0 ? "" : item.unitPrice}
                      onFocus={selectInputValue}
                      onChange={(event) => updateItem(index, { unitPrice: event.target.value === "" ? "" : Number(event.target.value) || 0 })}
                      onBlur={() => {
                        if (item.unitPrice === "") {
                          updateItem(index, { unitPrice: 0 });
                        }
                      }}
                    />
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={() => removeItem(index)} aria-label="Remove item">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="h-fit space-y-4">
          <CardTitle>Totals</CardTitle>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="space-y-2">
              <Label>Discount value</Label>
              <div className="grid grid-cols-[1fr_auto] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
                <div className="relative min-w-0">
                  <Input
                    className="border-0 pr-10 focus:ring-0 focus:ring-offset-0"
                    type="number"
                    min={0}
                    max={discountType === "percentage" ? 100 : undefined}
                    placeholder="0"
                    value={discountValue === 0 ? "" : discountValue}
                    onFocus={selectInputValue}
                    onChange={(event) => setDiscountValue(Number(event.target.value) || 0)}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">
                    {discountType === "percentage" ? "%" : "₹"}
                  </span>
                </div>
                <select
                  className="h-11 border-l border-[var(--border)] bg-[var(--muted)] px-3 text-sm font-medium outline-none"
                  value={discountType}
                  onChange={(event) => setDiscountType(event.target.value as DiscountType)}
                  aria-label="Discount type"
                >
                  <option value="fixed">₹</option>
                  <option value="percentage">%</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>GST %</Label>
              <Input
                type="number"
                min={0}
                value={taxRate}
                onFocus={selectInputValue}
                onChange={(event) => setTaxRate(Number(event.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border p-4 text-sm">
            <SummaryRow label="Subtotal" value={formatCurrency(totals.subtotal)} />
            <SummaryRow label="Discount" value={`-${formatCurrency(totals.discountAmount)}`} />
            <SummaryRow label="GST" value={formatCurrency(totals.taxAmount)} />
            <div className="border-t pt-3">
              <SummaryRow label="Grand total" value={formatCurrency(totals.totalAmount)} strong />
            </div>
          </div>

          <Button className="w-full" onClick={createInvoice} disabled={isSubmitting}>
            {isSubmitting ? "Generating..." : "Generate invoice"}
          </Button>
          {formMessage ? (
            <div
              className={
                formMessage.tone === "success"
                  ? "rounded-2xl border border-[var(--success)]/30 bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-3 text-sm text-[var(--success)]"
                  : "rounded-2xl border border-[var(--danger)]/30 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-sm text-[var(--danger)]"
              }
            >
              {formMessage.text}
            </div>
          ) : null}
        </Card>
      </section>

      <Card className="space-y-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <CardTitle>Invoice history</CardTitle>
            <CardDescription>Search by invoice number or customer name, filter dates, and resend receipts.</CardDescription>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_150px_150px_auto]">
            <Input placeholder="Invoice or customer" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            <Button variant="outline" onClick={refreshInvoices} disabled={isRefreshing}>
              {isRefreshing ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        <Table className="min-w-[900px]">
          <THead>
            <TR>
              <TH>Invoice</TH>
              <TH>Customer</TH>
              <TH>Date</TH>
              <TH>Total</TH>
              <TH>Payment</TH>
              <TH>Email</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {invoices.length ? (
              invoices.map((invoice) => (
                <TR key={invoice.id}>
                  <TD className="font-medium">{invoice.invoiceNumber}</TD>
                  <TD>{invoice.customer.name}</TD>
                  <TD>{new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}</TD>
                  <TD>{formatCurrency(invoice.totalAmount)}</TD>
                  <TD><Badge tone={invoice.paymentStatus === "paid" ? "success" : "warning"}>{invoice.paymentMethod}</Badge></TD>
                  <TD><Badge tone={invoice.emailSent ? "success" : "default"}>{invoice.emailSent ? "Sent" : "Not sent"}</Badge></TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => setSelectedInvoice(invoice)} aria-label="View invoice">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button asChild variant="outline" size="icon" aria-label="Download invoice">
                        <a href={invoice.pdfUrl} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => printInvoice(invoice)} aria-label="Print invoice">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => resendInvoice(invoice.id)} aria-label="Resend invoice">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))
            ) : (
              <TR>
                <TD colSpan={7} className="py-6 text-center text-[var(--muted-foreground)]">
                  No invoices found.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </Card>

      {selectedInvoice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3" role="dialog" aria-modal="true">
          <Card className="max-h-[92vh] w-full max-w-3xl overflow-y-auto bg-[var(--background)]">
            <div className="flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-start">
              <div>
                <CardTitle>{selectedInvoice.invoiceNumber}</CardTitle>
                <CardDescription>{selectedInvoice.customer.name} - {formatCurrency(selectedInvoice.totalAmount)}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={selectedInvoice.pdfUrl} download><Download className="mr-2 h-4 w-4" /> Download</a>
                </Button>
                <Button variant="outline" size="sm" onClick={() => printInvoice(selectedInvoice)}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                <Button size="sm" onClick={() => setSelectedInvoice(null)}>Close</Button>
              </div>
            </div>

            <div className="space-y-5 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="font-semibold">{selectedInvoice.salon.name}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{selectedInvoice.salon.address || "Address not configured"}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{selectedInvoice.salon.contactNumber || "Contact not configured"}</p>
                  {selectedInvoice.salon.gstNumber ? <p className="text-sm text-[var(--muted-foreground)]">GST: {selectedInvoice.salon.gstNumber}</p> : null}
                </div>
                <div className="sm:text-right">
                  <p className="font-semibold">{selectedInvoice.customer.name}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{selectedInvoice.customer.phone}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{selectedInvoice.customer.email || "No email"}</p>
                </div>
              </div>

              <Table>
                <THead>
                  <TR>
                    <TH>Item</TH>
                    <TH>Type</TH>
                    <TH>Qty</TH>
                    <TH>Price</TH>
                    <TH>Total</TH>
                  </TR>
                </THead>
                <TBody>
                  {selectedInvoice.items.map((item, index) => (
                    <TR key={`${item.name}-${index}`}>
                      <TD>{item.name}</TD>
                      <TD>{item.kind}</TD>
                      <TD>{item.quantity}</TD>
                      <TD>{formatCurrency(item.unitPrice)}</TD>
                      <TD>{formatCurrency(item.total)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>

              <div className="ml-auto max-w-sm space-y-2 rounded-2xl border p-4 text-sm">
                <SummaryRow label="Subtotal" value={formatCurrency(selectedInvoice.subtotal)} />
                <SummaryRow label="Discount" value={`-${formatCurrency(selectedInvoice.discountAmount)}`} />
                <SummaryRow label="GST" value={formatCurrency(selectedInvoice.taxAmount)} />
                <SummaryRow label="Grand total" value={formatCurrency(selectedInvoice.totalAmount)} strong />
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex items-center justify-between text-base font-semibold" : "flex items-center justify-between"}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
