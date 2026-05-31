# Billing & Invoice Management Integration

## Folder Structure

- `app/(app)/billing/page.tsx` - bill generation workspace and invoice history entry point
- `app/(app)/billing/history/page.tsx` - dedicated invoice history page
- `app/api/invoices/route.ts` - create and list invoices
- `app/api/invoices/[invoiceId]/route.ts` - fetch one invoice
- `app/api/invoices/[invoiceId]/resend/route.ts` - resend invoice email
- `components/billing-client.tsx` - responsive billing form, totals, invoice preview, download, print, resend
- `components/invoice-history-client.tsx` - searchable invoice history
- `db/schema.ts` - Drizzle/Neon invoice and invoice item table definitions
- `drizzle/0012_add_invoice_management.sql` - Neon/Postgres migration
- `lib/db/invoices.ts` - Neon invoice persistence, PDF generation, email, analytics
- `lib/billing/calculations.ts` - subtotal, discount, GST, grand total calculations
- `lib/billing/pdf.ts` - PDFKit invoice renderer and local PDF storage
- `lib/billing/validation.ts` - Zod validation for invoice creation
- `lib/email.ts` - Resend invoice email with PDF attachment

## Environment Variables

Add these values in `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:password@host/database?sslmode=require
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=SalonFlow <billing@yourdomain.com>
```

`EMAIL_FROM` must use a verified Resend sending domain.

## Neon Tables

`invoices` stores salon identity, customer details, invoice number/date, subtotal, discount, GST, grand total, payment status/method, PDF URL/path, email sent status, and timestamps.

`invoice_items` stores each service/product line item for invoice rendering and service revenue reporting.

Existing `customers` rows are reused when a customer is selected during billing.

## API Routes

- `GET /api/invoices?search=&from=&to=` lists invoices by invoice number, customer name, and date range.
- `POST /api/invoices` validates input, creates the Neon invoice rows, generates the PDF, stores it under `public/invoices`, and sends the PDF by email when the invoice is paid and the customer has an email.
- `GET /api/invoices/:invoiceId` returns a single invoice.
- `POST /api/invoices/:invoiceId/resend` emails the stored PDF again.

## PDF Storage

PDFs are generated with PDFKit and stored locally in `public/invoices`.

For production on serverless hosting, replace local storage with S3, Cloudflare R2, UploadThing, or another durable object store, then persist the public URL in `pdfUrl`.

## Dashboard Analytics

The dashboard now includes:

- Today's billing revenue
- Invoice monthly revenue
- Total invoices
- Average ticket size
- Top services by revenue

These values are calculated from paid Neon invoices.

## Setup Steps

1. Install dependencies: `npm install pdfkit @types/pdfkit`
2. Run the migration: `npx drizzle-kit migrate`
3. Add `RESEND_API_KEY` and `EMAIL_FROM` to `.env.local`.
4. Restart the Next.js dev server.
5. Open `/billing`.
6. Select an existing customer, add services/products, apply discount and GST, then generate the invoice.
7. Use `/billing/history` to search, view, download, print, or resend invoices.
