/**
 * POST /api/v1/auth/forgot-password – Request password reset (stub; full flow TBD per PRD §25).
 * When implemented: validate email, create reset token, build link with buildPortalUrl(), send email.
 * Response: 501 with message until email/token flow is implemented.
 */

import { NextRequest } from 'next/server';
import { jsonError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { buildPasswordResetLink } from '@/lib/services/email';
import { CONTACT_EMAIL } from '@/lib/contact';
import type { PortalSlug } from '@/lib/portal-auth-config';

const ROUTE = 'POST /api/v1/auth/forgot-password';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const portal: PortalSlug = body.portal && ['ketchup', 'government', 'agent', 'field-ops'].includes(body.portal) ? body.portal : 'ketchup';
    // When implemented: create token, then sendPasswordResetEmail(email, portal, token). Link uses NEXT_PUBLIC_PORTAL_URL (e.g. https://portal.ketchup.cc).
    const _exampleLink = buildPasswordResetLink(portal, 'placeholder-token');
    logger.info(ROUTE, 'Forgot-password stub', { hasEmail: !!email, portal, linkConfigured: !!_exampleLink });
    return jsonError(
      `Password reset is not yet available. Contact support: ${CONTACT_EMAIL}`,
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
