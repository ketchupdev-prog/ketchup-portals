/**
 * POST /api/auth/login - Supabase Auth login endpoint
 * Authenticates user with email/password and syncs with portal_users table
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { portalUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      logger.error('/api/auth/login', 'Supabase auth error', {
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Sync with portal_users table
    if (data.user) {
      const [portalUser] = await db
        .select()
        .from(portalUsers)
        .where(eq(portalUsers.supabaseUserId, data.user.id))
        .limit(1);

      if (portalUser) {
        // Update last login
        await db
          .update(portalUsers)
          .set({ lastLogin: new Date() })
          .where(eq(portalUsers.id, portalUser.id));
      } else {
        // Check if user exists by email but not linked
        const [existingUser] = await db
          .select()
          .from(portalUsers)
          .where(eq(portalUsers.email, email.toLowerCase().trim()))
          .limit(1);

        if (existingUser) {
          // Link existing portal user to Supabase user
          await db
            .update(portalUsers)
            .set({
              supabaseUserId: data.user.id,
              lastLogin: new Date(),
            })
            .where(eq(portalUsers.id, existingUser.id));
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    logger.error(
      '/api/auth/login',
      error instanceof Error ? error.message : 'Login error',
      { error }
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
