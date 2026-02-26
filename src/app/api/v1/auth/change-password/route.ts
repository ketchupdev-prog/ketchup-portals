/**
 * POST /api/v1/auth/change-password – Change password for authenticated portal user.
 * Requires current password; updates portal_users.password_hash. Rate limited per user/IP.
 */

import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { portalUsers } from '@/db/schema';
import { jsonError } from '@/lib/api-response';
import { validateBody, schemas } from '@/lib/validate';
import { getPortalSession } from '@/lib/portal-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const ROUTE = 'POST /api/v1/auth/change-password';
const BCRYPT_ROUNDS = 10;
const RATE_LIMIT = 10; // per minute per authenticated user (PRD Audit: per-user not per-IP)

export async function POST(request: NextRequest) {
  try {
    const session = getPortalSession(request);
    if (!session) {
      return jsonError('Unauthorized', 'Unauthorized', undefined, 401, ROUTE);
    }

    const key = `user:${session.userId}`;
    const { allowed, resetAt } = checkRateLimit(`change-password:${key}`, RATE_LIMIT);
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return Response.json(
        { error: 'Too many attempts', code: 'RateLimitExceeded' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateBody(schemas.changePassword, body);
    if (!validation.success) {
      return jsonError(validation.error, 'ValidationError', validation.details, 400);
    }
    const { current_password, new_password } = validation.data;

    const [user] = await db
      .select({ id: portalUsers.id, passwordHash: portalUsers.passwordHash })
      .from(portalUsers)
      .where(eq(portalUsers.id, session.userId))
      .limit(1);

    if (!user) {
      return jsonError('User not found', 'NotFound', undefined, 401, ROUTE);
    }

    const match = await bcrypt.compare(current_password, user.passwordHash);
    if (!match) {
      return jsonError('Current password is incorrect', 'ValidationError', undefined, 400);
    }

    const passwordHash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
    await db
      .update(portalUsers)
      .set({ passwordHash })
      .where(eq(portalUsers.id, user.id));

    return Response.json({ message: 'Password updated' });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : 'Internal server error', {});
    return jsonError('Internal server error', 'InternalError', undefined, 500, ROUTE);
  }
}
