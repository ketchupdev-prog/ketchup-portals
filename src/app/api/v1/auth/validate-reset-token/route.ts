/**
 * GET /api/v1/auth/validate-reset-token – Validate password reset token (UI validation).
 * Checks if token is valid (not expired, not used).
 * Rate limited to 200/min per IP (READ_ONLY rate limit).
 * Location: src/app/api/v1/auth/validate-reset-token/route.ts
 */

import { NextRequest } from 'next/server';
import { jsonErrors } from '@/lib/api-response';
import { checkRateLimit, getClientKey } from '@/lib/rate-limit';
import { verifyResetToken } from '@/lib/services/password-reset-service';
import { logger } from '@/lib/logger';

const ROUTE = 'GET /api/v1/auth/validate-reset-token';
const READ_ONLY_RATE_LIMIT = 200;

export async function GET(request: NextRequest) {
  try {
    const key = getClientKey(request);
    const { allowed, resetAt } = checkRateLimit(`read:${key}`, READ_ONLY_RATE_LIMIT);
    
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return jsonErrors(
        [
          {
            code: 'RateLimitExceeded',
            title: 'Too Many Requests',
            message: 'Too many validation requests. Please try again later.',
          },
        ],
        429,
        { retryAfter }
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return jsonErrors(
        [
          {
            code: 'ValidationError',
            message: 'Token is required',
            field: 'token',
          },
        ],
        400
      );
    }

    // Verify token is valid (not expired, not used)
    const tokenResult = await verifyResetToken(token);
    
    if (!tokenResult) {
      return Response.json(
        {
          valid: false,
          message: 'Token is invalid or has expired',
        },
        { status: 200 }
      );
    }

    return Response.json(
      {
        valid: true,
        message: 'Token is valid',
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
