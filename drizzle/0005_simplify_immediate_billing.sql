UPDATE "subscriptions" SET "status" = 'paused' WHERE "status" = 'trial';
--> statement-breakpoint
UPDATE "salons" SET "status" = 'paused', "read_only_mode" = true WHERE "status" = 'trial';
--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'paused';
--> statement-breakpoint
ALTER TABLE "salons" ALTER COLUMN "status" SET DEFAULT 'paused';
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "trial_start_date";
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "trial_end_date";
