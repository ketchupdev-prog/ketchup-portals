/**
 * POST /api/v1/auth/2fa/setup
 * 
 * Generate TOTP secret and backup codes for 2FA setup
 * Returns QR code data URL, secret, and backup codes (plain text - user must save)
 * 
 * Security:
 * - Requires authenticated session (user can only set up their own 2FA)
 * - Rate limited (5 req/min per IP) to prevent enumeration
 * - Does NOT enable 2FA yet - user must verify token first
 * - Audit logged (auth.2fa_setup_initiated)
 * 
 * Location: src/app/api/v1/auth/2fa/setup/route.ts
 */

import { NextRequest } from 'next/server';
import { getPortalSession } from '@/lib/portal-auth';
import { checkRateLimit, getClientKey } from '@/lib/rate-limit';
import { jsonErrors } from '@/lib/api-response';
import { generateTOTPSetup, formatBackupCodesForDisplay } from '@/lib/services/totp-service';
import { createAuditLogFromRequest } from '@/lib/services/audit-log-service';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { portalUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ROUTE = 'POST /api/v1/auth/2fa/setup';
const RATE_LIMIT = 5; // requests per minute (prevent enumeration)

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientKey = getClientKey(request);
    const { allowed, resetAt } = checkRateLimit(`2fa-setup:${clientKey}`, RATE_LIMIT);
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return jsonErrors(
        [
          {
            code: 'RateLimitExceeded',
            title: 'Too Many Requests',
            message: 'Too many 2FA setup attempts. Please try again later.',
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

    // Get user's email for QR code
    const [user] = await db
      .select({
        id: portalUsers.id,
        email: portalUsers.email,
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
            message: '2FA is already enabled. Disable it first to set up a new secret.',
          },
        ],
        409
      );
    }

    // Generate TOTP setup (secret, QR code, backup codes)
    const setup = await generateTOTPSetup(user.email);

    // Store secret and hashed backup codes in database (but don't enable yet)
    await db
      .update(portalUsers)
      .set({
        totpSecret: setup.secret,
        backupCodes: setup.hashedBackupCodes,
        backupCodesGeneratedAt: new Date(),
        // totpEnabled remains false until verification
      })
      .where(eq(portalUsers.id, user.id));

    // Audit log
    await createAuditLogFromRequest(request, session, {
      action: 'auth.2fa_setup_initiated',
      resourceType: 'user',
      resourceId: user.id,
      metadata: {
        email: user.email,
      },
    });

    // Format backup codes for display
    const formattedBackupCodes = formatBackupCodesForDisplay(setup.backupCodes);

    // Return setup data to frontend
    return Response.json(
      {
        data: {
          secret: setup.secret,
          qrCodeDataURL: setup.qrCodeDataURL,
          backupCodes: formattedBackupCodes, // Plain text - user must save these!
        },
        meta: {
          message: 'Scan QR code with authenticator app, then verify to enable 2FA',
          nextStep: 'POST /api/v1/auth/2fa/verify',
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
          message: 'Failed to set up 2FA',
        },
      ],
      500,
      { route: ROUTE }
    );
  }
}
