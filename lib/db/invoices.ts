import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { customers, invoiceItems, invoices } from "@/db/schema";
import { calculateInvoiceTotals } from "@/lib/billing/calculations";
import { generateInvoicePdf, readInvoicePdfAsBase64, type InvoicePdfData } from "@/lib/billing/pdf";
import type { CreateInvoiceInput } from "@/lib/billing/validation";
import { sendInvoiceEmail } from "@/lib/email";

export type InvoiceListFilters = {
  search?: string;
  from?: string;
  to?: string;
};

export type SerializedInvoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customer: {
    customerId: string;
    name: string;
    phone: string;
    email: string;
  };
  items: Array<{
    kind: "service" | "product";
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  pdfUrl: string;
  emailSent: boolean;
  salon: {
    name: string;
    logoUrl: string;
    address: string;
    contactNumber: string;
    gstNumber: string;
  };
  createdAt: string;
};

type InvoiceRow = typeof invoices.$inferSelect;
type InvoiceItemRow = typeof invoiceItems.$inferSelect;

function toNumber(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

function normalizeKind(value: string): "service" | "product" {
  return value === "product" ? "product" : "service";
}

function toPdfData(invoice: SerializedInvoice): InvoicePdfData {
  return {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: new Date(invoice.invoiceDate),
    salon: invoice.salon,
    customer: invoice.customer,
    items: invoice.items,
    subtotal: invoice.subtotal,
    discountAmount: invoice.discountAmount,
    taxRate: invoice.taxRate,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    paymentStatus: invoice.paymentStatus,
    paymentMethod: invoice.paymentMethod,
  };
}

function serializeInvoice(row: InvoiceRow, items: InvoiceItemRow[] = []): SerializedInvoice {
  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    invoiceDate: row.invoiceDate.toISOString(),
    customer: {
      customerId: row.customerId ?? "",
      name: row.customerName,
      phone: row.customerPhone,
      email: row.customerEmail,
    },
    items: items.map((item) => ({
      kind: normalizeKind(item.kind),
      name: item.name,
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice),
      total: toNumber(item.total),
    })),
    subtotal: toNumber(row.subtotal),
    discountType: row.discountType === "percentage" ? "percentage" : "fixed",
    discountValue: toNumber(row.discountValue),
    discountAmount: toNumber(row.discountAmount),
    taxRate: toNumber(row.taxRate),
    taxAmount: toNumber(row.taxAmount),
    totalAmount: toNumber(row.totalAmount),
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    pdfUrl: row.pdfUrl,
    emailSent: row.emailSent,
    salon: {
      name: row.salonName,
      logoUrl: row.salonLogoUrl,
      address: row.salonAddress,
      contactNumber: row.salonContactNumber,
      gstNumber: row.salonGstNumber,
    },
    createdAt: row.createdAt.toISOString(),
  };
}

async function getNextInvoiceNumber(salonId: string, date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = `INV-${year}${month}`;

  const [lastInvoice] = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(and(eq(invoices.salonId, salonId), ilike(invoices.invoiceNumber, `${prefix}-%`)))
    .orderBy(desc(invoices.invoiceNumber))
    .limit(1);

  const lastSequence = lastInvoice?.invoiceNumber ? Number(lastInvoice.invoiceNumber.split("-").at(-1)) : 0;
  return `${prefix}-${String((Number.isFinite(lastSequence) ? lastSequence : 0) + 1).padStart(5, "0")}`;
}

export async function createInvoiceForSalon(
  salonId: string,
  salonName: string,
  input: CreateInvoiceInput,
) {
  const totals = calculateInvoiceTotals({
    items: input.items,
    discountType: input.discountType,
    discountValue: input.discountValue,
    taxRate: input.taxRate,
  });

  const invoiceNumber = await getNextInvoiceNumber(salonId);
  const invoiceDate = new Date();
  const customerId = input.customerId || null;
  const customerEmail = input.customerEmail ?? "";
  const draftInvoice: SerializedInvoice = {
    id: "",
    invoiceNumber,
    invoiceDate: invoiceDate.toISOString(),
    customer: {
      customerId: customerId ?? "",
      name: input.customerName,
      phone: input.customerPhone,
      email: customerEmail,
    },
    items: totals.items,
    subtotal: totals.subtotal,
    discountType: input.discountType,
    discountValue: input.discountValue,
    discountAmount: totals.discountAmount,
    taxRate: input.taxRate,
    taxAmount: totals.taxAmount,
    totalAmount: totals.totalAmount,
    paymentStatus: input.paymentStatus,
    paymentMethod: input.paymentMethod,
    pdfUrl: "",
    emailSent: false,
    salon: {
      name: salonName,
      logoUrl: input.salonLogoUrl ?? "",
      address: input.salonAddress ?? "",
      contactNumber: input.salonContactNumber ?? "",
      gstNumber: input.salonGstNumber ?? "",
    },
    createdAt: invoiceDate.toISOString(),
  };
  const pdf = await generateInvoicePdf(toPdfData(draftInvoice));

  if (customerId) {
    await db
      .update(customers)
      .set({
        name: input.customerName,
        phone: input.customerPhone,
        email: customerEmail || null,
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, customerId), eq(customers.salonId, salonId)));
  }

  const [created] = await db
    .insert(invoices)
    .values({
      salonId,
      invoiceNumber,
      invoiceDate,
      salonName,
      salonLogoUrl: input.salonLogoUrl ?? "",
      salonAddress: input.salonAddress ?? "",
      salonContactNumber: input.salonContactNumber ?? "",
      salonGstNumber: input.salonGstNumber ?? "",
      customerId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail,
      subtotal: String(totals.subtotal),
      discountType: input.discountType,
      discountValue: String(input.discountValue),
      discountAmount: String(totals.discountAmount),
      taxRate: String(input.taxRate),
      taxAmount: String(totals.taxAmount),
      totalAmount: String(totals.totalAmount),
      paymentStatus: input.paymentStatus,
      paymentMethod: input.paymentMethod,
      pdfUrl: pdf.pdfUrl,
      pdfPath: pdf.pdfPath,
    })
    .returning();

  const insertedItems = await db
    .insert(invoiceItems)
    .values(
      totals.items.map((item) => ({
        salonId,
        invoiceId: created.id,
        kind: item.kind,
        name: item.name,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice),
        total: String(item.total),
      })),
    )
    .returning();

  let invoice = serializeInvoice(created, insertedItems);

  if (invoice.paymentStatus === "paid" && customerEmail) {
    try {
      const pdfBase64 = await readInvoicePdfAsBase64(pdf.pdfPath);
      await sendInvoiceEmail({
        to: customerEmail,
        customerName: invoice.customer.name,
        salonName: invoice.salon.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.totalAmount,
        pdfBase64,
        pdfFileName: `${invoice.invoiceNumber}.pdf`,
      });

      const [emailed] = await db
        .update(invoices)
        .set({ emailSent: true, emailSentAt: new Date(), updatedAt: new Date() })
        .where(eq(invoices.id, created.id))
        .returning();

      invoice = serializeInvoice(emailed, insertedItems);
    } catch (error) {
      console.error("Failed to email invoice", error);
    }
  }

  return invoice;
}

export async function listInvoicesForSalon(salonId: string, filters: InvoiceListFilters = {}) {
  const conditions = [eq(invoices.salonId, salonId)];

  if (filters.search) {
    const search = `%${filters.search.trim()}%`;
    conditions.push(or(ilike(invoices.invoiceNumber, search), ilike(invoices.customerName, search))!);
  }

  if (filters.from) {
    conditions.push(gte(invoices.invoiceDate, new Date(`${filters.from}T00:00:00.000Z`)));
  }

  if (filters.to) {
    conditions.push(lte(invoices.invoiceDate, new Date(`${filters.to}T23:59:59.999Z`)));
  }

  const rows = await db
    .select()
    .from(invoices)
    .where(and(...conditions))
    .orderBy(desc(invoices.invoiceDate))
    .limit(100);

  if (!rows.length) return [];

  const itemRows = await db
    .select()
    .from(invoiceItems)
    .where(inArray(invoiceItems.invoiceId, rows.map((row) => row.id)));

  const itemsByInvoice = new Map<string, InvoiceItemRow[]>();
  itemRows.forEach((item) => {
    const existing = itemsByInvoice.get(item.invoiceId) ?? [];
    existing.push(item);
    itemsByInvoice.set(item.invoiceId, existing);
  });

  return rows.map((row) => serializeInvoice(row, itemsByInvoice.get(row.id) ?? []));
}

export async function getInvoiceForSalon(salonId: string, invoiceId: string) {
  const [row] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.salonId, salonId)))
    .limit(1);

  if (!row) return null;

  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, row.id));
  return serializeInvoice(row, items);
}

export async function resendInvoiceForSalon(salonId: string, invoiceId: string) {
  const invoice = await getInvoiceForSalon(salonId, invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (!invoice.customer.email) {
    throw new Error("Customer email is missing");
  }

  const [row] = await db.select({ pdfPath: invoices.pdfPath }).from(invoices).where(eq(invoices.id, invoiceId)).limit(1);

  const pdfBase64 = await readInvoicePdfAsBase64(row.pdfPath);
  await sendInvoiceEmail({
    to: invoice.customer.email,
    customerName: invoice.customer.name,
    salonName: invoice.salon.name,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.totalAmount,
    pdfBase64,
    pdfFileName: `${invoice.invoiceNumber}.pdf`,
  });

  await db
    .update(invoices)
    .set({ emailSent: true, emailSentAt: new Date(), updatedAt: new Date() })
    .where(and(eq(invoices.id, invoiceId), eq(invoices.salonId, salonId)));

  return getInvoiceForSalon(salonId, invoiceId);
}

export async function getBillingAnalyticsForSalon(salonId: string) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [summary] = await db
    .select({
      todaysRevenue: sql<number>`coalesce(sum(${invoices.totalAmount}) filter (where ${invoices.invoiceDate} >= ${todayStart}), 0)`,
      monthlyRevenue: sql<number>`coalesce(sum(${invoices.totalAmount}) filter (where ${invoices.invoiceDate} >= ${monthStart}), 0)`,
      totalInvoices: sql<number>`count(*)`,
      totalRevenue: sql<number>`coalesce(sum(${invoices.totalAmount}), 0)`,
    })
    .from(invoices)
    .where(and(eq(invoices.salonId, salonId), eq(invoices.paymentStatus, "paid")));

  const topServices = await db
    .select({
      name: invoiceItems.name,
      revenue: sql<number>`coalesce(sum(${invoiceItems.total}), 0)`,
      quantity: sql<number>`coalesce(sum(${invoiceItems.quantity}), 0)`,
    })
    .from(invoiceItems)
    .innerJoin(invoices, eq(invoices.id, invoiceItems.invoiceId))
    .where(and(eq(invoices.salonId, salonId), eq(invoices.paymentStatus, "paid"), eq(invoiceItems.kind, "service")))
    .groupBy(invoiceItems.name)
    .orderBy(desc(sql<number>`coalesce(sum(${invoiceItems.total}), 0)`))
    .limit(5);

  const totalInvoices = Number(summary?.totalInvoices ?? 0);

  return {
    todaysRevenue: Number(summary?.todaysRevenue ?? 0),
    monthlyRevenue: Number(summary?.monthlyRevenue ?? 0),
    totalInvoices,
    averageTicketSize: totalInvoices ? Number(summary?.totalRevenue ?? 0) / totalInvoices : 0,
    topServices: topServices.map((service) => ({
      name: service.name,
      revenue: Number(service.revenue ?? 0),
      quantity: Number(service.quantity ?? 0),
    })),
  };
}
