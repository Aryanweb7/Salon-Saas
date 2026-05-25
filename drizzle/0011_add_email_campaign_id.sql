ALTER TABLE "email_campaign_logs" ADD COLUMN IF NOT EXISTS "campaign_id" uuid;

CREATE INDEX IF NOT EXISTS "email_campaign_logs_campaign_idx" ON "email_campaign_logs" USING btree ("campaign_id");
