CREATE TABLE IF NOT EXISTS "email_campaign_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"customer_id" uuid,
	"email" varchar(255) NOT NULL,
	"title" varchar(160) NOT NULL,
	"audience" varchar(60) NOT NULL,
	"status" varchar(40) DEFAULT 'sent' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_campaign_logs" ADD CONSTRAINT "email_campaign_logs_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_campaign_logs" ADD CONSTRAINT "email_campaign_logs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_campaign_logs_salon_idx" ON "email_campaign_logs" USING btree ("salon_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_campaign_logs_customer_idx" ON "email_campaign_logs" USING btree ("customer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_campaign_logs_status_idx" ON "email_campaign_logs" USING btree ("status");
