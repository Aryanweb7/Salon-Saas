import { z } from "zod";

export const invoiceItemInputSchema = z.object({
  kind: z.enum(["service", "product"]),
  name: z.string().trim().min(1, "Item name is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Price must be zero or more"),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().trim().min(1, "Customer name is required"),
  customerPhone: z.string().trim().min(3, "Customer phone is required"),
  customerEmail: z.string().trim().email("Enter a valid email").or(z.literal("")).optional(),
  items: z.array(invoiceItemInputSchema).min(1, "Add at least one service or product"),
  discountType: z.enum(["percentage", "fixed"]).default("fixed"),
  discountValue: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(18),
  paymentMethod: z.string().trim().min(1, "Payment method is required"),
  paymentStatus: z.enum(["paid", "pending", "failed", "refunded"]).default("paid"),
  salonLogoUrl: z.string().trim().optional(),
  salonAddress: z.string().trim().optional(),
  salonContactNumber: z.string().trim().optional(),
  salonGstNumber: z.string().trim().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
