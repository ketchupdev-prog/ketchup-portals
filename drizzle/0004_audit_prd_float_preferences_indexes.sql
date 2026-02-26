-- PRD Audit v1.4.1: requested_by, dual control, preference_value JSONB, appeal_evidence_url, indexes

-- float_requests: requested_by, first_reviewed_by, first_reviewed_at
ALTER TABLE "float_requests" ADD COLUMN IF NOT EXISTS "requested_by" uuid REFERENCES "portal_users"("id");
ALTER TABLE "float_requests" ADD COLUMN IF NOT EXISTS "first_reviewed_by" uuid REFERENCES "portal_users"("id");
ALTER TABLE "float_requests" ADD COLUMN IF NOT EXISTS "first_reviewed_at" timestamp with time zone;

-- duplicate_redemption_events: appeal evidence URL
ALTER TABLE "duplicate_redemption_events" ADD COLUMN IF NOT EXISTS "appeal_evidence_url" text;

-- portal_user_preferences: preference_value as JSONB
-- Safe when column is TEXT; if already JSONB this no-ops (same type).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portal_user_preferences' AND column_name = 'preference_value' AND data_type = 'text'
  ) THEN
    ALTER TABLE "portal_user_preferences" ALTER COLUMN "preference_value" TYPE jsonb USING (CASE WHEN trim(coalesce("preference_value"::text, '')) = '' THEN NULL ELSE ("preference_value"::text)::jsonb END);
  END IF;
END $$;

-- Indexes for list/filter performance (PRD Audit Finding 2.3, 4.1)
CREATE INDEX IF NOT EXISTS "float_requests_agent_id_idx" ON "float_requests" ("agent_id");
CREATE INDEX IF NOT EXISTS "float_requests_status_idx" ON "float_requests" ("status");
CREATE INDEX IF NOT EXISTS "float_requests_requested_at_idx" ON "float_requests" ("requested_at");
CREATE INDEX IF NOT EXISTS "tasks_assigned_to_idx" ON "tasks" ("assigned_to");
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks" ("status");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "duplicate_redemption_events_status_idx" ON "duplicate_redemption_events" ("status");
CREATE INDEX IF NOT EXISTS "duplicate_redemption_events_detected_at_idx" ON "duplicate_redemption_events" ("detected_at");
