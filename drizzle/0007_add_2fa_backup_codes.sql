-- Migration: Add 2FA backup codes and verification timestamp to portal_users
-- SEC-005: Two-Factor Authentication (TOTP) implementation
-- Date: 2026-03-18

-- Add backup codes column (array of hashed backup codes)
ALTER TABLE "portal_users" ADD COLUMN "backup_codes" text[];

-- Add timestamp for when backup codes were generated
ALTER TABLE "portal_users" ADD COLUMN "backup_codes_generated_at" timestamp with time zone;

-- Add timestamp for when 2FA was verified and enabled
ALTER TABLE "portal_users" ADD COLUMN "totp_verified_at" timestamp with time zone;

-- Rename existing columns to match TOTP naming convention for consistency
ALTER TABLE "portal_users" RENAME COLUMN "two_factor_secret" TO "totp_secret";
ALTER TABLE "portal_users" RENAME COLUMN "two_factor_enabled" TO "totp_enabled";

-- Add index on totp_enabled for faster queries when checking 2FA requirement
CREATE INDEX IF NOT EXISTS "portal_users_totp_enabled_idx" ON "portal_users" ("totp_enabled") WHERE "totp_enabled" = true;

-- Add index on role for 2FA enforcement queries
CREATE INDEX IF NOT EXISTS "portal_users_role_idx" ON "portal_users" ("role");

-- Add comment for audit purposes
COMMENT ON COLUMN "portal_users"."backup_codes" IS 'Array of bcrypt-hashed backup codes for 2FA recovery (10 codes, single-use)';
COMMENT ON COLUMN "portal_users"."totp_secret" IS 'Base32-encoded TOTP secret for 2FA (encrypted at rest)';
COMMENT ON COLUMN "portal_users"."totp_verified_at" IS 'Timestamp when user successfully verified and enabled 2FA';
