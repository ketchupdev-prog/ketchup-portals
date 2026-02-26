-- Rename canonical_redemption_id → canonical_redemption_ref and change type to TEXT
-- (Schema uses text ref to link to redemption event even if stored elsewhere.)
-- Run with: npx drizzle-kit migrate (or apply manually).
-- If using drizzle-kit push and prompted, choose "rename column" (canonical_redemption_id → canonical_redemption_ref).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'duplicate_redemption_events' AND column_name = 'canonical_redemption_id'
  ) THEN
    ALTER TABLE "duplicate_redemption_events"
      RENAME COLUMN "canonical_redemption_id" TO "canonical_redemption_ref";
    ALTER TABLE "duplicate_redemption_events"
      ALTER COLUMN "canonical_redemption_ref" TYPE text USING "canonical_redemption_ref"::text;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'duplicate_redemption_events' AND column_name = 'canonical_redemption_ref'
  ) THEN
    -- New installs: add column (e.g. after 0001 with different schema)
    ALTER TABLE "duplicate_redemption_events" ADD COLUMN "canonical_redemption_ref" text NOT NULL DEFAULT '';
  END IF;
END $$;
