/**
 * POST /api/auth/register - Supabase Auth registration endpoint
 * Creates user in Supabase Auth and syncs with portal_users table
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { portalUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, role } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Auto-confirm for now (adjust based on requirements)
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error) {
      logger.error('/api/auth/register', 'Supabase registration error', {
        error: error.message,
      });
      return NextResponse.json(
        { error: error.message || 'Registration failed' },
        { status: 400 }
      );
    }

    // Create or link portal_users record
    if (data.user) {
      const passwordHash = await bcrypt.hash(password, 10);

      // Check if portal user already exists
      const [existingUser] = await db
        .select()
        .from(portalUsers)
        .where(eq(portalUsers.email, email.toLowerCase().trim()))
        .limit(1);

      if (existingUser) {
        // Link existing user
        await db
          .update(portalUsers)
          .set({
            supabaseUserId: data.user.id,
            passwordHash, // Keep for backward compatibility
          })
          .where(eq(portalUsers.id, existingUser.id));
      } else {
        // Create new portal user
        await db.insert(portalUsers).values({
          email: email.toLowerCase().trim(),
          passwordHash,
          fullName,
          role: role || 'agent', // Default role
          supabaseUserId: data.user.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error) {
    logger.error(
      '/api/auth/register',
      error instanceof Error ? error.message : 'Registration error',
      { error }
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
