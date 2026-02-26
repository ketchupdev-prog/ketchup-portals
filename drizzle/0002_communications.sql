-- Communications (PRD §7.4, §7.4.1): in-app notifications, push subscriptions, portal user phone.
-- Run with: npx drizzle-kit migrate (or apply manually to Neon)

ALTER TABLE "portal_users" ADD COLUMN IF NOT EXISTS "phone" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "in_app_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "portal_users"("id") ON DELETE CASCADE,
	"title" text NOT NULL,
	"body" text,
	"link" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
	"portal_user_id" uuid REFERENCES "portal_users"("id") ON DELETE CASCADE,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
