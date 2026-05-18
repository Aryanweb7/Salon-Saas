CREATE TABLE IF NOT EXISTS "sms_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"customer_id" uuid,
	"phone" varchar(32) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(40) DEFAULT 'pending' NOT NULL,
	"twilio_sid" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sms_logs_salon_idx" ON "sms_logs" USING btree ("salon_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sms_logs_customer_idx" ON "sms_logs" USING btree ("customer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sms_logs_status_idx" ON "sms_logs" USING btree ("status");
