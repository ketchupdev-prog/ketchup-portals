/**
 * CRON Job – Clean up expired password reset tokens.
 * Deletes tokens where:
 * - expires_at < now() AND used_at IS NULL (expired, unused)
 * - OR used_at IS NOT NULL AND created_at < now() - 7 days (used, old)
 * 
 * Scheduled: Daily at 2:00 AM UTC via Vercel Cron (vercel.json)
 * Auth: Requires CRON_SECRET header to prevent unauthorized execution.
 * Location: src/app/api/cron/cleanup-reset-tokens/route.ts
 */

import { NextRequest } from 'next/server';
import { cleanupExpiredTokens } from '@/lib/services/password-reset-service';
import { jsonErrors } from '@/lib/api-response';
import { logger } from '@/lib/logger';

const ROUTE = 'GET /api/cron/cleanup-reset-tokens';

export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET to prevent unauthorized execution
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error(ROUTE, 'CRON_SECRET not configured');
      return jsonErrors(
        [{ code: 'ConfigurationError', message: 'CRON_SECRET not configured' }],
        500,
        { route: ROUTE }
      );
    }

    // Check for Bearer token
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    if (token !== cronSecret) {
      logger.warn(ROUTE, 'Unauthorized CRON execution attempt');
      return jsonErrors(
        [
          {
            code: 'Unauthorized',
            title: 'Unauthorized',
            message: 'Invalid or missing CRON_SECRET',
          },
        ],
        401
      );
    }

    // Execute cleanup
    const deletedCount = await cleanupExpiredTokens();

    logger.info(ROUTE, 'Password reset token cleanup completed', {
      deletedCount,
      timestamp: new Date().toISOString(),
    });

    return Response.json(
      {
        success: true,
        message: 'Password reset token cleanup completed',
        deletedCount,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : 'Cleanup failed', {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonErrors(
      [{ code: 'InternalError', message: 'Token cleanup failed' }],
      500,
      { route: ROUTE }
    );
  }
}
