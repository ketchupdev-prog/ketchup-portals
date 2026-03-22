/**
 * POST /api/v1/auth/login/verify-2fa
 * 
 * Verify 2FA token during login flow (after password verification)
 * Creates portal session if token is valid
 * 
 * Security:
 * - No session required (called after password verification, before session creation)
 * - Rate limited (5 req/min per userId) to prevent brute force
 * - Validates userId and TOTP token
 * - Creates session only after successful 2FA verification
 * - Audit logged (auth.login with 2FA metadata)
 * 
 * Location: src/app/api/v1/auth/login/verify-2fa/route.ts
 */

import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { jsonErrors } from '@/lib/api-response';
import { verifyTOTPToken, verifyBackupCode } from '@/lib/services/totp-service';
import { createAuditLog } from '@/lib/services/audit-log-service';
import { portalAuthCookieValue } from '@/lib/portal-auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { portalUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ROUTE = 'POST /api/v1/auth/login/verify-2fa';
const RATE_LIMIT = 5; // requests per minute per userId
const TOKEN_EXPIRY_SEC = 3600; // 1 hour

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { userId, token, backupCode } = body;

    // Validate required fields
    if (!userId || typeof userId !== 'string') {
      return jsonErrors(
        [
          {
            code: 'ValidationError',
            message: 'User ID is required',
            field: 'userId',
          },
        ],
        400
      );
    }

    // Must provide either TOTP token or backup code
    if (!token && !backupCode) {
      return jsonErrors(
        [
          {
            code: 'ValidationError',
            message: 'Either TOTP token or backup code is required',
          },
        ],
        400
      );
    }

    // Rate limiting by userId (prevent brute force on specific user)
    const { allowed, resetAt } = checkRateLimit(`2fa-login:${userId}`, RATE_LIMIT);
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return jsonErrors(
        [
          {
            code: 'RateLimitExceeded',
            title: 'Too Many Requests',
            message: 'Too many 2FA attempts. Please try again later.',
          },
        ],
        429,
        { retryAfter }
      );
    }

    // Get user from database
    const [user] = await db
      .select({
        id: portalUsers.id,
        email: portalUsers.email,
        role: portalUsers.role,
        totpEnabled: portalUsers.totpEnabled,
        totpSecret: portalUsers.totpSecret,
        backupCodes: portalUsers.backupCodes,
      })
      .from(portalUsers)
      .where(eq(portalUsers.id, userId))
      .limit(1);

    if (!user) {
      return jsonErrors(
        [
          {
            code: 'NotFound',
            message: 'User not found',
          },
        ],
        404
      );
    }

    // Check if 2FA is enabled
    if (!user.totpEnabled) {
      return jsonErrors(
        [
          {
            code: 'BadRequest',
            message: '2FA is not enabled for this user',
          },
        ],
        400
      );
    }

    let verificationMethod: 'totp' | 'backup_code' = 'totp';
    let isValid = false;

    // Verify using TOTP token or backup code
    if (token) {
      // Validate token format
      if (!/^\d{6}$/.test(token.replace(/\s/g, ''))) {
        return jsonErrors(
          [
            {
              code: 'ValidationError',
              message: 'Invalid token format. Expected 6 digits.',
              field: 'token',
            },
          ],
          400
        );
      }

      if (!user.totpSecret) {
        return jsonErrors(
          [
            {
              code: 'InternalError',
              message: '2FA secret not found',
            },
          ],
          500
        );
      }

      isValid = verifyTOTPToken(user.totpSecret, token);
      verificationMethod = 'totp';
    } else if (backupCode) {
      // Verify backup code
      if (!user.backupCodes || user.backupCodes.length === 0) {
        return jsonErrors(
          [
            {
              code: 'BadRequest',
              message: 'No backup codes available',
            },
          ],
          400
        );
      }

      const matchedHash = await verifyBackupCode(backupCode, user.backupCodes);
      isValid = matchedHash !== null;
      verificationMethod = 'backup_code';

      // Remove used backup code (single-use)
      if (isValid && matchedHash) {
        const remainingCodes = user.backupCodes.filter((hash) => hash !== matchedHash);
        await db
          .update(portalUsers)
          .set({
            backupCodes: remainingCodes.length > 0 ? remainingCodes : null,
          })
          .where(eq(portalUsers.id, user.id));

        // Log backup code usage
        await createAuditLog({
          userId: user.id,
          action: 'auth.2fa_backup_used',
          resourceType: 'user',
          resourceId: user.id,
          metadata: {
            context: 'login',
            remainingCodes: remainingCodes.length,
          },
          ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
          userAgent: request.headers.get('user-agent') ?? 'unknown',
        });
      }
    }

    // Check if verification succeeded
    if (!isValid) {
      // Audit failed login attempt
      await createAuditLog({
        userId: user.id,
        action: 'auth.login',
        resourceType: 'user',
        resourceId: user.id,
        metadata: {
          success: false,
          reason: 'Invalid 2FA',
          method: verificationMethod,
        },
        ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
        userAgent: request.headers.get('user-agent') ?? 'unknown',
      });

      return jsonErrors(
        [
          {
            code: 'Unauthorized',
            message:
              verificationMethod === 'totp'
                ? 'Invalid 2FA code. Please check your authenticator app.'
                : 'Invalid backup code.',
          },
        ],
        401
      );
    }

    // 2FA verified - update last login and create session
    await db
      .update(portalUsers)
      .set({ lastLogin: new Date() })
      .where(eq(portalUsers.id, user.id));

    // Audit successful login with 2FA
    await createAuditLog({
      userId: user.id,
      action: 'auth.login',
      resourceType: 'user',
      resourceId: user.id,
      metadata: {
        success: true,
        twoFactorUsed: true,
        method: verificationMethod,
        email: user.email,
      },
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: request.headers.get('user-agent') ?? 'unknown',
    });

    logger.info(ROUTE, `User ${user.email} logged in with 2FA (${verificationMethod})`);

    // Create session token
    const exp = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SEC;
    const payload = { sub: user.id, email: user.email, role: user.role, exp };
    const access_token = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');

    // Return token with Set-Cookie header
    const response = Response.json({
      access_token,
      token_type: 'Bearer',
      expires_in: TOKEN_EXPIRY_SEC,
      twoFactorVerified: true,
    });
    response.headers.set('Set-Cookie', portalAuthCookieValue(access_token, TOKEN_EXPIRY_SEC));

    return response;
  } catch (error) {
    logger.error(ROUTE, error instanceof Error ? error.message : 'Internal server error', {
      name: error instanceof Error ? error.name : undefined,
    });
    return jsonErrors(
      [
        {
          code: 'InternalError',
          message: 'Failed to verify 2FA',
        },
      ],
      500,
      { route: ROUTE }
    );
  }
}
