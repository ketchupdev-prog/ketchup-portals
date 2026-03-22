-- Migration: Add supabase_user_id to portal_users
-- Date: 2026-03-21
-- Purpose: Bridge portal_users with Supabase Auth for centralized authentication

-- Add supabase_user_id column (nullable to allow gradual migration)
ALTER TABLE portal_users 
ADD COLUMN IF NOT EXISTS supabase_user_id UUID UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_portal_users_supabase_user_id 
ON portal_users(supabase_user_id);

-- Add comment for documentation
COMMENT ON COLUMN portal_users.supabase_user_id IS 'Links portal user to Supabase Auth user (shared with Buffr Connect project: cjmtcxfpwjbpbctjseex)';
