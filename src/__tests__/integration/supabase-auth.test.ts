/**
 * Integration tests for Supabase Auth
 * Tests authentication flow, session management, and portal_users sync
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { portalUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

const TEST_USER = {
  email: 'test-portal@ketchup.cc',
  password: 'TestPassword123!',
  fullName: 'Portal Test User',
};

describe('Supabase Auth Integration', () => {
  let testUserId: string | null = null;

  beforeAll(async () => {
    // Clean up any existing test user
    const supabase = createServiceRoleClient();
    
    try {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users?.find((u) => u.email === TEST_USER.email);
      
      if (existingUser) {
        await supabase.auth.admin.deleteUser(existingUser.id);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    // Clean up portal_users
    await db.delete(portalUsers).where(eq(portalUsers.email, TEST_USER.email));
  });

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      const supabase = createServiceRoleClient();
      await supabase.auth.admin.deleteUser(testUserId);
    }
    
    await db.delete(portalUsers).where(eq(portalUsers.email, TEST_USER.email));
  });

  it('should create user in Supabase Auth via service role', async () => {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
      user_metadata: {
        full_name: TEST_USER.fullName,
      },
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user?.email).toBe(TEST_USER.email);

    testUserId = data.user?.id || null;
  });

  it('should authenticate user with Supabase', async () => {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    expect(error).toBeNull();
    expect(data.session).toBeDefined();
    expect(data.user?.email).toBe(TEST_USER.email);
  });

  it('should sync Supabase user with portal_users', async () => {
    expect(testUserId).toBeDefined();

    // Create portal user linked to Supabase
    const [portalUser] = await db
      .insert(portalUsers)
      .values({
        email: TEST_USER.email,
        passwordHash: 'legacy_hash', // Keep for backward compatibility
        fullName: TEST_USER.fullName,
        role: 'agent',
        supabaseUserId: testUserId!,
      })
      .returning();

    expect(portalUser).toBeDefined();
    expect(portalUser.supabaseUserId).toBe(testUserId);

    // Verify lookup works
    const [foundUser] = await db
      .select()
      .from(portalUsers)
      .where(eq(portalUsers.supabaseUserId, testUserId!))
      .limit(1);

    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe(TEST_USER.email);
  });

  it('should fail authentication with wrong password', async () => {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: 'WrongPassword123!',
    });

    expect(error).toBeDefined();
    expect(data.session).toBeNull();
  });

  it('should refresh session token', async () => {
    const supabase = createServiceRoleClient();

    // Sign in first
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    expect(signInData.session).toBeDefined();

    // Refresh session
    const { data: refreshData, error } = await supabase.auth.refreshSession({
      refresh_token: signInData.session!.refresh_token,
    });

    expect(error).toBeNull();
    expect(refreshData.session).toBeDefined();
    expect(refreshData.session?.access_token).not.toBe(
      signInData.session!.access_token
    );
  });

  it('should sign out user', async () => {
    const supabase = createServiceRoleClient();

    // Sign in first
    await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    // Sign out
    const { error } = await supabase.auth.signOut();

    expect(error).toBeNull();

    // Verify session is gone
    const {
      data: { session },
    } = await supabase.auth.getSession();

    expect(session).toBeNull();
  });
});
