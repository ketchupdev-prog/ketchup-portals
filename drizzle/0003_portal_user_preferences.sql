-- Portal user preferences (notification_preferences etc.). Profile & Settings spec.
-- Run with: npx drizzle-kit migrate (or apply manually to Neon)

CREATE TABLE IF NOT EXISTS "portal_user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_user_id" uuid NOT NULL REFERENCES "portal_users"("id") ON DELETE CASCADE,
	"preference_key" text DEFAULT 'notification_preferences' NOT NULL,
	"preference_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "portal_user_preferences_portal_user_id_preference_key_unique" ON "portal_user_preferences" ("portal_user_id","preference_key");
