/**
 * POST /api/v1/auth/forgot-password – Request password reset (stub; full flow TBD per PRD §25).
 * Response: 501 with message until email/token flow is implemented.
 */

import { NextRequest } from 'next/server';
import { jsonError } from '@/lib/api-response';
import { logger } from '@/lib/logger';

const ROUTE = 'POST /api/v1/auth/forgot-password';

export async function POST(request: NextRequest) {
  try {
    await request.json().catch(() => ({}));
    // Full flow: validate email, create reset token, send email (PRD §25, §7.4.1).
    logger.info(ROUTE, 'Forgot-password flow not implemented');
    return jsonError(
      'Password reset is not yet available. Please contact your administrator.',
      'NotImplemented',
      undefined,
      501,
      ROUTE
    );
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : 'Internal server error', {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonError('Internal server error', 'InternalError', undefined, 500, ROUTE);
  }
}
