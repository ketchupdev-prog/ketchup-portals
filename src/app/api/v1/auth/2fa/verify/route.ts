/**
 * POST /api/v1/auth/2fa/verify
 * 
 * Verify TOTP token and enable 2FA for the user
 * Must be called after /auth/2fa/setup to complete 2FA setup
 * 
 * Security:
 * - Requires authenticated session
 * - Rate limited (5 req/min per IP)
 * - Validates 6-digit TOTP token
 * - Sets totpEnabled = true and totpVerifiedAt = now()
 * - Audit logged (auth.2fa_enabled)
 * 
 * Location: src/app/api/v1/auth/2fa/verify/route.ts
 */

import { NextRequest } from 'next/server';
import { getPortalSession } from '@/lib/portal-auth';
import { checkRateLimit, getClientKey } from '@/lib/rate-limit';
import { jsonErrors } from '@/lib/api-response';
import { verifyTOTPToken } from '@/lib/services/totp-service';
import { createAuditLogFromRequest } from '@/lib/services/audit-log-service';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { portalUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ROUTE = 'POST /api/v1/auth/2fa/verify';
const RATE_LIMIT = 5; // requests per minute

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientKey = getClientKey(request);
    const { allowed, resetAt } = checkRateLimit(`2fa-verify:${clientKey}`, RATE_LIMIT);
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return jsonErrors(
        [
          {
            code: 'RateLimitExceeded',
            title: 'Too Many Requests',
            message: 'Too many verification attempts. Please try again later.',
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
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return jsonErrors(
        [
          {
            code: 'ValidationError',
            message: 'TOTP token is required',
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

    // Get user's TOTP secret
    const [user] = await db
      .select({
        id: portalUsers.id,
        email: portalUsers.email,
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

    // Check if 2FA is already enabled
    if (user.totpEnabled) {
      return jsonErrors(
        [
          {
            code: 'Conflict',
            message: '2FA is already enabled',
          },
        ],
        409
      );
    }

    // Check if user has a TOTP secret (from setup)
    if (!user.totpSecret) {
      return jsonErrors(
        [
          {
            code: 'BadRequest',
            message: 'No 2FA setup found. Call POST /api/v1/auth/2fa/setup first.',
          },
        ],
        400
      );
    }

    // Verify TOTP token
    const isValid = verifyTOTPToken(user.totpSecret, token);

    if (!isValid) {
      // Audit failed verification attempt
      await createAuditLogFromRequest(request, session, {
        action: 'auth.2fa_verified',
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
            message: 'Invalid 2FA code. Please check your authenticator app and try again.',
          },
        ],
        401
      );
    }

    // Enable 2FA (set totpEnabled = true, totpVerifiedAt = now())
    await db
      .update(portalUsers)
      .set({
        totpEnabled: true,
        totpVerifiedAt: new Date(),
      })
      .where(eq(portalUsers.id, user.id));

    // Audit successful 2FA enablement
    await createAuditLogFromRequest(request, session, {
      action: 'auth.2fa_enabled',
      resourceType: 'user',
      resourceId: user.id,
      metadata: {
        email: user.email,
        verifiedAt: new Date().toISOString(),
      },
    });

    logger.info(ROUTE, `2FA enabled for user ${user.email}`);

    // Return success
    return Response.json(
      {
        data: {
          success: true,
          totpEnabled: true,
          verifiedAt: new Date().toISOString(),
        },
        meta: {
          message: '2FA successfully enabled. Your account is now protected.',
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
          message: 'Failed to verify 2FA',
        },
      ],
      500,
      { route: ROUTE }
    );
  }
}
