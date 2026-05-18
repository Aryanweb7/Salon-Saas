ALTER TABLE "salons" ALTER COLUMN "plan_id" SET DEFAULT 'free';
--> statement-breakpoint
UPDATE "salons" SET "plan_id" = 'free', "status" = 'active', "read_only_mode" = false WHERE "plan_id" = 'basic' AND "status" = 'paused';
--> statement-breakpoint
UPDATE "subscriptions" SET "plan_id" = 'free', "status" = 'active' WHERE "plan_id" = 'basic' AND "status" = 'paused';
