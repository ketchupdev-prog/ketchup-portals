/**
 * POST /api/v1/auth/2fa/disable
 * 
 * Disable 2FA for the authenticated user
 * Requires BOTH password and current TOTP token for security
 * 
 * Security:
 * - Requires authenticated session
 * - Rate limited (3 req/min per IP) - stricter than other 2FA endpoints
 * - Requires password verification (protect against session hijacking)
 * - Requires valid TOTP token (prove user has access to authenticator)
 * - Clears totpSecret, totpEnabled, and backupCodes
 * - Audit logged (auth.2fa_disabled) - CRITICAL security event
 * 
 * Location: src/app/api/v1/auth/2fa/disable/route.ts
 */

import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPortalSession } from '@/lib/portal-auth';
import { checkRateLimit, getClientKey } from '@/lib/rate-limit';
import { jsonErrors } from '@/lib/api-response';
import { verifyTOTPToken } from '@/lib/services/totp-service';
import { createAuditLogFromRequest } from '@/lib/services/audit-log-service';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { portalUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ROUTE = 'POST /api/v1/auth/2fa/disable';
const RATE_LIMIT = 3; // requests per minute (stricter - this is a critical action)

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientKey = getClientKey(request);
    const { allowed, resetAt } = checkRateLimit(`2fa-disable:${clientKey}`, RATE_LIMIT);
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return jsonErrors(
        [
          {
            code: 'RateLimitExceeded',
            title: 'Too Many Requests',
            message: 'Too many disable attempts. Please try again later.',
          },
        ],
        429,
        { retryAfter }
      );
    }

    // Require authentication
    const session = getPortalSession(request);
    if (!session) {
      return jsonErrors(
        [
          {
            code: 'Unauthorized',
            message: 'Authentication required',
          },
        ],
        401
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { password, token } = body;

    // Validate required fields
    if (!password || typeof password !== 'string') {
      return jsonErrors(
        [
          {
            code: 'ValidationError',
            message: 'Password is required to disable 2FA',
            field: 'password',
          },
        ],
        400
      );
    }

    if (!token || typeof token !== 'string') {
      return jsonErrors(
        [
          {
            code: 'ValidationError',
            message: 'Current 2FA token is required to disable 2FA',
            field: 'token',
          },
        ],
        400
      );
    }

    // Validate token format (6 digits)
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

    // Get user from database
    const [user] = await db
      .select({
        id: portalUsers.id,
        email: portalUsers.email,
        passwordHash: portalUsers.passwordHash,
        totpSecret: portalUsers.totpSecret,
        totpEnabled: portalUsers.totpEnabled,
      })
      .from(portalUsers)
      .where(eq(portalUsers.id, session.userId))
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
            message: '2FA is not enabled',
          },
        ],
        400
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      // Audit failed disable attempt
      await createAuditLogFromRequest(request, session, {
        action: 'auth.2fa_disabled',
        resourceType: 'user',
        resourceId: user.id,
        metadata: {
          success: false,
          reason: 'Invalid password',
        },
      });

      return jsonErrors(
        [
          {
            code: 'Unauthorized',
            message: 'Invalid password',
          },
        ],
        401
      );
    }

    // Verify TOTP token
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

    const tokenValid = verifyTOTPToken(user.totpSecret, token);
    if (!tokenValid) {
      // Audit failed disable attempt
      await createAuditLogFromRequest(request, session, {
        action: 'auth.2fa_disabled',
        resourceType: 'user',
        resourceId: user.id,
        metadata: {
          success: false,
          reason: 'Invalid TOTP token',
        },
      });

      return jsonErrors(
        [
          {
            code: 'Unauthorized',
            message: 'Invalid 2FA code',
          },
        ],
        401
      );
    }

    // Disable 2FA (clear secret, backup codes, set enabled = false)
    await db
      .update(portalUsers)
      .set({
        totpEnabled: false,
        totpSecret: null,
        totpVerifiedAt: null,
        backupCodes: null,
        backupCodesGeneratedAt: null,
      })
      .where(eq(portalUsers.id, user.id));

    // Audit successful 2FA disablement (CRITICAL security event)
    await createAuditLogFromRequest(request, session, {
      action: 'auth.2fa_disabled',
      resourceType: 'user',
      resourceId: user.id,
      metadata: {
        success: true,
        email: user.email,
        disabledAt: new Date().toISOString(),
      },
    });

    logger.warn(ROUTE, `2FA disabled for user ${user.email}`, {
      userId: user.id,
      securityEvent: true,
    });

    // Return success
    return Response.json(
      {
        data: {
          success: true,
          totpEnabled: false,
        },
        meta: {
          message: '2FA has been disabled. Your account is less secure without 2FA.',
          warning: 'Consider re-enabling 2FA to protect your account.',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(ROUTE, error instanceof Error ? error.message : 'Internal server error', {
      name: error instanceof Error ? error.name : undefined,
    });
    return jsonErrors(
      [
        {
          code: 'InternalError',
          message: 'Failed to disable 2FA',
        },
      ],
      500,
      { route: ROUTE }
    );
  }
}
