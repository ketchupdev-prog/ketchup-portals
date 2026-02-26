-- Offline Redemption Integrity & Advance Recovery (PRD §3.3.11)
-- Run with: npx drizzle-kit migrate (or apply manually to Neon)

CREATE TABLE IF NOT EXISTS "duplicate_redemption_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voucher_id" uuid NOT NULL REFERENCES "vouchers"("id"),
	"beneficiary_id" uuid NOT NULL REFERENCES "users"("id"),
	"canonical_redemption_id" uuid NOT NULL,
	"duplicate_attempt_id" text NOT NULL,
	"duplicate_agent_id" uuid REFERENCES "agents"("id"),
	"duplicate_device_id" text,
	"duplicate_amount" numeric(14, 2) NOT NULL,
	"duplicate_requested_at" timestamp with time zone NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'advance_posted' NOT NULL,
	"resolution_notes" text,
	"resolved_by" uuid REFERENCES "portal_users"("id"),
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "beneficiary_advances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"beneficiary_id" uuid NOT NULL REFERENCES "users"("id"),
	"source_event_id" uuid NOT NULL REFERENCES "duplicate_redemption_events"("id"),
	"programme_id" uuid REFERENCES "programmes"("id"),
	"original_amount" numeric(14, 2) NOT NULL,
	"recovered_amount" numeric(14, 2) DEFAULT 0 NOT NULL,
	"cycles_outstanding" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'outstanding' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_recovery_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "advance_recovery_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advance_id" uuid NOT NULL REFERENCES "beneficiary_advances"("id"),
	"voucher_id" uuid REFERENCES "vouchers"("id"),
	"cycle_date" date NOT NULL,
	"amount_deducted" numeric(14, 2) NOT NULL,
	"entitlement" numeric(14, 2) NOT NULL,
	"net_disbursed" numeric(14, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
