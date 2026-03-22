/**
 * POST /api/v1/auth/request-reset – Request password reset email.
 * Generates reset token and sends email with reset link.
 * Always returns success to prevent account enumeration (security).
 * Rate limited to 5/min per IP (AUTH rate limit).
 * Location: src/app/api/v1/auth/request-reset/route.ts
 */

import { NextRequest } from 'next/server';
import { validateBody, schemas } from '@/lib/validate';
import { jsonErrors } from '@/lib/api-response';
import { checkRateLimit, getClientKey } from '@/lib/rate-limit';
import { createResetToken } from '@/lib/services/password-reset-service';
import { sendEmail } from '@/lib/services/email';
import { generatePasswordResetEmail } from '@/lib/email-templates/password-reset';
import { createAuditLog } from '@/lib/services/audit-log-service';
import { logger } from '@/lib/logger';

const ROUTE = 'POST /api/v1/auth/request-reset';
const AUTH_RATE_LIMIT = 5;

export async function POST(request: NextRequest) {
  try {
    const key = getClientKey(request);
    const { allowed, resetAt } = checkRateLimit(`auth:${key}`, AUTH_RATE_LIMIT);
    
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return jsonErrors(
        [
          {
            code: 'RateLimitExceeded',
            title: 'Too Many Requests',
            message: 'Too many password reset requests. Please try again later.',
          },
        ],
        429,
        { retryAfter }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateBody(schemas.requestReset, body);
    
    if (!validation.success) {
      return jsonErrors(
        [
          {
            code: 'ValidationError',
            message: validation.error,
            field: validation.details?.field as string,
          },
        ],
        400
      );
    }

    const { email } = validation.data;

    // Generate token (returns null if user not found)
    const token = await createResetToken(email);

    // SECURITY: Always return success, even if user doesn't exist
    // This prevents account enumeration attacks
    if (token) {
      // User exists - send email
      const portal = 'ketchup'; // Default portal - could be determined from request context
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
      const resetLink = `${baseUrl}/${portal}/reset-password?token=${encodeURIComponent(token)}`;

      const emailContent = generatePasswordResetEmail({
        resetLink,
        portal,
        recipientEmail: email,
      });

      const emailResult = await sendEmail({
        to: email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });

      if (emailResult.sent) {
        // Log successful password reset request (audit)
        await createAuditLog({
          userId: '', // We don't expose userId here for security
          action: 'auth.password_reset_requested',
          resourceType: 'user',
          metadata: {
            email: '[redacted]', // Don't log email in audit
            success: true,
          },
          ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
          userAgent: request.headers.get('user-agent') ?? undefined,
        });

        logger.info(ROUTE, 'Password reset email sent', { email: '[redacted]' });
      } else {
        logger.error(ROUTE, 'Failed to send password reset email', {
          email: '[redacted]',
          error: emailResult.error,
        });
      }
    } else {
      // User doesn't exist - log the attempt but still return success
      logger.info(ROUTE, 'Password reset requested for non-existent user', {
        email: '[redacted]',
      });
    }

    // Always return success message (security - don't reveal if account exists)
    return Response.json(
      {
        message: 'If an account exists with that email, a password reset link has been sent.',
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
