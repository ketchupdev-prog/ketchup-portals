/**
 * POST /api/v1/webhooks/buffr
 *
 * Purpose: Receive Buffr consent/redemption events and acknowledge quickly.
 * This endpoint verifies webhook signatures when BUFFR_WEBHOOK_SECRET is set.
 *
 * Location: src/app/api/v1/webhooks/buffr/route.ts
 */

import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { markWebhookReceived } from '@/lib/integrations/buffr/persistence';
import { db } from '@/lib/db';
import { portalUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const ROUTE = '/api/v1/webhooks/buffr';

function safeCompare(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function verifySignature(rawBody: string, signature: string | null, secret: string | undefined) {
  if (!secret) return true;
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeCompare(expected, signature);
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-buffr-signature');
    const secret = process.env.BUFFR_WEBHOOK_SECRET;

    if (!verifySignature(rawBody, signature, secret)) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const payload = rawBody ? JSON.parse(rawBody) : {};
    const eventType = payload?.event_type || payload?.type || 'unknown';
    const upstreamEventId = request.headers.get('x-buffr-event-id') || payload?.event_id || payload?.id;
    const eventKey =
      typeof upstreamEventId === 'string' && upstreamEventId.trim().length > 0
        ? upstreamEventId.trim()
        : crypto.createHash('sha256').update(rawBody || JSON.stringify(payload)).digest('hex');

    const isNewEvent = await markWebhookReceived({
      eventKey,
      eventType,
      payload,
    });

    if (!isNewEvent) {
      return NextResponse.json({ success: true, received: true, duplicate: true, eventType, eventKey });
    }

    console.log('[Buffr webhook] received event', { eventType, eventKey });

    // Route to business handlers based on event type
    try {
      switch (eventType) {
        case 'consent.created':
        case 'consent.granted':
          await handleConsentGranted(payload);
          break;
        case 'consent.revoked':
        case 'consent.expired':
          await handleConsentRevoked(payload);
          break;
        case 'transaction.created':
          await handleTransactionCreated(payload);
          break;
        case 'affordability.checked':
          await handleAffordabilityCheck(payload);
          break;
        default:
          console.log('[Buffr webhook] unhandled event type', eventType);
      }
    } catch (handlerError) {
      console.error('[Buffr webhook] handler error', { eventType, error: handlerError });
    }

    return NextResponse.json({ success: true, received: true, eventType, eventKey });
  } catch (error) {
    console.error('[Buffr webhook] failed', error);
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Handle consent granted events from Buffr Connect
 */
async function handleConsentGranted(payload: any) {
  const { userId, consentId, permissions, expiresAt } = payload;
  
  logger.info(ROUTE, 'consent granted', { userId, consentId });

  // Update portal user with consent info if needed
  if (userId) {
    const [user] = await db
      .select()
      .from(portalUsers)
      .where(eq(portalUsers.supabaseUserId, userId))
      .limit(1);

    if (user) {
      logger.info(ROUTE, 'user found for consent', { userId: user.id });
    }
  }
}

/**
 * Handle consent revoked/expired events
 */
async function handleConsentRevoked(payload: any) {
  const { userId, consentId, reason } = payload;
  
  logger.info(ROUTE, 'consent revoked', { userId, consentId, reason });
}

/**
 * Handle transaction created events
 */
async function handleTransactionCreated(payload: any) {
  const { transactionId, amount, userId } = payload;
  
  logger.info(ROUTE, 'transaction created', { transactionId, amount, userId });
}

/**
 * Handle affordability check events
 */
async function handleAffordabilityCheck(payload: any) {
  const { userId, amount, affordable } = payload;
  
  logger.info(ROUTE, 'affordability checked', { userId, amount, affordable });
}
