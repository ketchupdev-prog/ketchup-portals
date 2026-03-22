/**
 * POST /api/v1/auth/2fa/verify-backup-code
 * 
 * Verify a backup code during 2FA login flow
 * Used when user doesn't have access to authenticator app
 * 
 * Security:
 * - Requires authenticated session (used during login, after password verification)
 * - Rate limited (5 req/min per IP)
 * - Backup codes are single-use (removed after successful verification)
 * - Audit logged (auth.2fa_backup_used) - track backup code usage
 * - Warns user to regenerate backup codes
 * 
 * Location: src/app/api/v1/auth/2fa/verify-backup-code/route.ts
 */

import { NextRequest } from 'next/server';
import { getPortalSession } from '@/lib/portal-auth';
import { checkRateLimit, getClientKey } from '@/lib/rate-limit';
import { jsonErrors } from '@/lib/api-response';
import { verifyBackupCode } from '@/lib/services/totp-service';
import { createAuditLogFromRequest } from '@/lib/services/audit-log-service';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { portalUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ROUTE = 'POST /api/v1/auth/2fa/verify-backup-code';
const RATE_LIMIT = 5; // requests per minute

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientKey = getClientKey(request);
    const { allowed, resetAt } = checkRateLimit(`2fa-backup:${clientKey}`, RATE_LIMIT);
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
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return jsonErrors(
        [
          {
            code: 'ValidationError',
            message: 'Backup code is required',
            field: 'code',
          },
        ],
        400
      );
    }

    // Get user's backup codes
    const [user] = await db
      .select({
        id: portalUsers.id,
        email: portalUsers.email,
        totpEnabled: portalUsers.totpEnabled,
        backupCodes: portalUsers.backupCodes,
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

    // Check if user has backup codes
    if (!user.backupCodes || user.backupCodes.length === 0) {
      return jsonErrors(
        [
          {
            code: 'BadRequest',
            message: 'No backup codes available. Please use your authenticator app.',
          },
        ],
        400
      );
    }

    // Verify backup code
    const matchedHash = await verifyBackupCode(code, user.backupCodes);

    if (!matchedHash) {
      // Audit failed verification
      await createAuditLogFromRequest(request, session, {
        action: 'auth.2fa_backup_used',
        resourceType: 'user',
        resourceId: user.id,
        metadata: {
          success: false,
          reason: 'Invalid backup code',
        },
      });

      return jsonErrors(
        [
          {
            code: 'Unauthorized',
            message: 'Invalid backup code. Please check and try again.',
          },
        ],
        401
      );
    }

    // Remove used backup code (single-use)
    const remainingCodes = user.backupCodes.filter((hash) => hash !== matchedHash);

    await db
      .update(portalUsers)
      .set({
        backupCodes: remainingCodes.length > 0 ? remainingCodes : null,
      })
      .where(eq(portalUsers.id, user.id));

    // Audit successful backup code usage
    await createAuditLogFromRequest(request, session, {
      action: 'auth.2fa_backup_used',
      resourceType: 'user',
      resourceId: user.id,
      metadata: {
        success: true,
        email: user.email,
        remainingCodes: remainingCodes.length,
        usedAt: new Date().toISOString(),
      },
    });

    logger.info(ROUTE, `Backup code used for user ${user.email}`, {
      remainingCodes: remainingCodes.length,
    });

    // Return success with warning
    return Response.json(
      {
        data: {
          success: true,
          remainingBackupCodes: remainingCodes.length,
        },
        meta: {
          message: 'Backup code verified successfully',
          warning:
            remainingCodes.length === 0
              ? 'You have no backup codes left. Please generate new ones in Settings → Security.'
              : `You have ${remainingCodes.length} backup code(s) remaining. Consider regenerating codes in Settings → Security.`,
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
          message: 'Failed to verify backup code',
        },
      ],
      500,
      { route: ROUTE }
    );
  }
}
