/**
 * POST /api/auth/logout - Supabase Auth logout endpoint
 * Signs out user from Supabase Auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('/api/auth/logout', 'Supabase logout error', {
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Logout failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      '/api/auth/logout',
      error instanceof Error ? error.message : 'Logout error',
      { error }
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
