ALTER TABLE "subscriptions" ADD COLUMN "trial_start_date" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "trial_end_date" timestamp with time zone;
