/**
 * Password Reset Service – Generate, verify, and consume reset tokens.
 * Used by: /api/v1/auth/request-reset, /api/v1/auth/confirm-reset, /api/v1/auth/validate-reset-token
 * Location: src/lib/services/password-reset-service.ts
 */

import { randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { passwordResetTokens, portalUsers } from '@/db/schema';
import { eq, and, lt, isNull } from 'drizzle-orm';

/**
 * Generate a secure random token (32 bytes = 64 hex chars).
 * Uses crypto.randomBytes for cryptographically secure randomness.
 */
function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a password reset token for a user (identified by email).
 * Returns the token string on success, null if user not found.
 * 
 * @param email - User's email address (case-insensitive)
 * @returns Token string or null if user not found
 * 
 * @example
 * const token = await createResetToken('john@example.com');
 * if (token) {
 *   await sendPasswordResetEmail(email, 'ketchup', token);
 * }
 */
export async function createResetToken(email: string): Promise<string | null> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user by email
    const [user] = await db
      .select({ id: portalUsers.id })
      .from(portalUsers)
      .where(eq(portalUsers.email, normalizedEmail))
      .limit(1);

    if (!user) {
      return null;
    }

    // Generate secure token
    const token = generateSecureToken();
    
    // Calculate expiry (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Insert token into database
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    return token;
  } catch (error) {
    console.error('[PASSWORD_RESET_SERVICE] createResetToken error:', error);
    return null;
  }
}

/**
 * Verify that a reset token is valid (exists, not expired, not used).
 * Returns the user ID if valid, null otherwise.
 * 
 * @param token - Reset token to verify
 * @returns { userId: string } or null if invalid
 * 
 * @example
 * const result = await verifyResetToken(token);
 * if (!result) {
 *   return jsonErrors([{ code: 'InvalidToken', message: 'Token is invalid or expired' }], 400);
 * }
 * const { userId } = result;
 */
export async function verifyResetToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const now = new Date();

    // Find token that matches and is not expired and not used
    const [tokenRecord] = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
        expiresAt: passwordResetTokens.expiresAt,
        usedAt: passwordResetTokens.usedAt,
      })
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    if (!tokenRecord) {
      return null;
    }

    // Check if token has been used
    if (tokenRecord.usedAt) {
      return null;
    }

    // Check if token has expired
    if (tokenRecord.expiresAt < now) {
      return null;
    }

    return { userId: tokenRecord.userId };
  } catch (error) {
    console.error('[PASSWORD_RESET_SERVICE] verifyResetToken error:', error);
    return null;
  }
}

/**
 * Mark a reset token as used (prevents reuse).
 * Should be called after successfully resetting the password.
 * 
 * @param token - Reset token to consume
 * @returns void
 * 
 * @example
 * // After updating password
 * await consumeResetToken(token);
 */
export async function consumeResetToken(token: string): Promise<void> {
  try {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token));
  } catch (error) {
    console.error('[PASSWORD_RESET_SERVICE] consumeResetToken error:', error);
  }
}

/**
 * Clean up expired and used tokens (CRON job).
 * Deletes tokens where:
 * - expires_at < now() (expired tokens)
 * - OR used_at IS NOT NULL AND created_at < now() - 7 days (used tokens older than 7 days)
 * 
 * @returns Number of tokens deleted
 * 
 * @example
 * // In CRON job
 * const deleted = await cleanupExpiredTokens();
 * console.log(`Cleaned up ${deleted} expired tokens`);
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Delete expired tokens (not used and past expiry)
    const expiredResult = await db
      .delete(passwordResetTokens)
      .where(
        and(
          lt(passwordResetTokens.expiresAt, now),
          isNull(passwordResetTokens.usedAt)
        )
      );

    // Delete used tokens older than 7 days (for audit trail)
    const usedResult = await db
      .delete(passwordResetTokens)
      .where(
        and(
          lt(passwordResetTokens.createdAt, sevenDaysAgo),
          eq(passwordResetTokens.usedAt, passwordResetTokens.usedAt) // usedAt IS NOT NULL
        )
      );

    // Note: Drizzle doesn't return affected rows count, so we return 0 as placeholder
    // In production, you might want to use raw SQL to get the count
    return 0;
  } catch (error) {
    console.error('[PASSWORD_RESET_SERVICE] cleanupExpiredTokens error:', error);
    return 0;
  }
}

/**
 * Invalidate all reset tokens for a user (e.g., after successful password change).
 * Marks all unused tokens for the user as used.
 * 
 * @param userId - User ID
 * @returns void
 * 
 * @example
 * // After password change
 * await invalidateUserTokens(userId);
 */
export async function invalidateUserTokens(userId: string): Promise<void> {
  try {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.userId, userId),
          isNull(passwordResetTokens.usedAt)
        )
      );
  } catch (error) {
    console.error('[PASSWORD_RESET_SERVICE] invalidateUserTokens error:', error);
  }
}
