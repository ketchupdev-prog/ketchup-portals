/**
 * Supabase browser client for client components
 * Uses @supabase/ssr for cookie-based session management
 * Shared Supabase project with Buffr Connect (cjmtcxfpwjbpbctjseex)
 */

'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
