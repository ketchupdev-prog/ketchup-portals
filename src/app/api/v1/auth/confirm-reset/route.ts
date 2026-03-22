/**
 * POST /api/v1/auth/confirm-reset – Confirm password reset with token and new password.
 * Validates token, updates password, marks token as used.
 * Rate limited to 3/min per IP (PASSWORD_CHANGE rate limit).
 * Location: src/app/api/v1/auth/confirm-reset/route.ts
 */

import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { portalUsers } from '@/db/schema';
import { validateBody, schemas } from '@/lib/validate';
import { jsonErrors } from '@/lib/api-response';
import { checkRateLimit, getClientKey } from '@/lib/rate-limit';
import { verifyResetToken, consumeResetToken, invalidateUserTokens } from '@/lib/services/password-reset-service';
import { createAuditLog } from '@/lib/services/audit-log-service';
import { logger } from '@/lib/logger';

const ROUTE = 'POST /api/v1/auth/confirm-reset';
const PASSWORD_CHANGE_RATE_LIMIT = 3;

export async function POST(request: NextRequest) {
  try {
    const key = getClientKey(request);
    const { allowed, resetAt } = checkRateLimit(`password_change:${key}`, PASSWORD_CHANGE_RATE_LIMIT);
    
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return jsonErrors(
        [
          {
            code: 'RateLimitExceeded',
            title: 'Too Many Requests',
            message: 'Too many password change attempts. Please try again later.',
          },
        ],
        429,
        { retryAfter }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateBody(schemas.confirmReset, body);
    
    if (!validation.success) {
      return jsonErrors(
        [
          {
            code: 'ValidationError',
            message: validation.error,
            field: validation.details?.field as string,
          },
        ],
        400
      );
    }

    const { token, newPassword } = validation.data;

    // Verify token is valid (not expired, not used)
    const tokenResult = await verifyResetToken(token);
    
    if (!tokenResult) {
      return jsonErrors(
        [
          {
            code: 'InvalidToken',
            title: 'Invalid or Expired Token',
            message: 'Password reset token is invalid or has expired. Please request a new reset link.',
          },
        ],
        400
      );
    }

    const { userId } = tokenResult;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db
      .update(portalUsers)
      .set({ passwordHash: hashedPassword })
      .where(eq(portalUsers.id, userId));

    // Mark token as used (prevent reuse)
    await consumeResetToken(token);

    // Invalidate all other reset tokens for this user (security)
    await invalidateUserTokens(userId);

    // Log successful password reset (audit)
    await createAuditLog({
      userId,
      action: 'auth.password_reset_completed',
      resourceType: 'user',
      metadata: {
        success: true,
        method: 'reset_token',
      },
      ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    logger.info(ROUTE, 'Password reset successful', { userId: '[redacted]' });

    return Response.json(
      {
        message: 'Password reset successful. You can now sign in with your new password.',
      },
      { status: 200 }
    );
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : 'Internal server error', {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonErrors(
      [{ code: 'InternalError', message: 'Internal server error' }],
      500,
      { route: ROUTE }
    );
  }
}
