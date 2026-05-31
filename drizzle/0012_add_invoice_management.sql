CREATE TABLE IF NOT EXISTS "invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "salon_id" uuid NOT NULL,
  "invoice_number" varchar(60) NOT NULL,
  "invoice_date" timestamp with time zone DEFAULT now() NOT NULL,
  "salon_name" varchar(160) NOT NULL,
  "salon_logo_url" text DEFAULT '' NOT NULL,
  "salon_address" text DEFAULT '' NOT NULL,
  "salon_contact_number" varchar(32) DEFAULT '' NOT NULL,
  "salon_gst_number" varchar(32) DEFAULT '' NOT NULL,
  "customer_id" uuid,
  "customer_name" varchar(160) NOT NULL,
  "customer_phone" varchar(32) NOT NULL,
  "customer_email" varchar(255) DEFAULT '' NOT NULL,
  "subtotal" numeric(12, 2) NOT NULL,
  "discount_type" varchar(20) DEFAULT 'fixed' NOT NULL,
  "discount_value" numeric(12, 2) DEFAULT '0' NOT NULL,
  "discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
  "tax_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
  "tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
  "total_amount" numeric(12, 2) NOT NULL,
  "payment_status" varchar(30) DEFAULT 'paid' NOT NULL,
  "payment_method" varchar(40) NOT NULL,
  "pdf_url" text DEFAULT '' NOT NULL,
  "pdf_path" text DEFAULT '' NOT NULL,
  "email_sent" boolean DEFAULT false NOT NULL,
  "email_sent_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "invoice_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "salon_id" uuid NOT NULL,
  "invoice_id" uuid NOT NULL,
  "kind" varchar(20) NOT NULL,
  "name" varchar(180) NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price" numeric(12, 2) NOT NULL,
  "total" numeric(12, 2) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "salons"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "salons"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "invoices_salon_idx" ON "invoices" USING btree ("salon_id");
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoice_number_idx" ON "invoices" USING btree ("invoice_number");
CREATE INDEX IF NOT EXISTS "invoices_salon_invoice_number_idx" ON "invoices" USING btree ("salon_id", "invoice_number");
CREATE INDEX IF NOT EXISTS "invoices_invoice_date_idx" ON "invoices" USING btree ("invoice_date");
CREATE INDEX IF NOT EXISTS "invoice_items_salon_idx" ON "invoice_items" USING btree ("salon_id");
CREATE INDEX IF NOT EXISTS "invoice_items_invoice_idx" ON "invoice_items" USING btree ("invoice_id");
CREATE INDEX IF NOT EXISTS "invoice_items_kind_idx" ON "invoice_items" USING btree ("kind");
