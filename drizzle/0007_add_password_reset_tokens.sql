-- Add password_reset_tokens table for password reset flow (AUTH-001)
-- Location: drizzle/0007_add_password_reset_tokens.sql
-- Tokens expire in 24 hours and can only be used once

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "token" text NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Add foreign key constraint to portal_users
ALTER TABLE "password_reset_tokens" 
  ADD CONSTRAINT "password_reset_tokens_user_id_portal_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE;

-- Add index on token for fast lookups
CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_idx" ON "password_reset_tokens" ("token");

-- Add index on expires_at for efficient cleanup
CREATE INDEX IF NOT EXISTS "password_reset_tokens_expires_at_idx" ON "password_reset_tokens" ("expires_at");

-- Add index on user_id for user-specific queries
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens" ("user_id");
