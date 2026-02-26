/**
 * Push notification service – Store subscriptions and send via Web Push (PRD §7.4.1).
 * Uses web-push and VAPID keys. When keys not set, subscribe/send no-op.
 * Location: src/lib/services/push.ts
 */

import webpush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey) {
    webpush.setVapidDetails("mailto:noreply@ketchup.cc", publicKey, privateKey);
    vapidConfigured = true;
  }
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface SubscribeOptions {
  portalUserId?: string;
  userId?: string;
  subscription: PushSubscriptionPayload;
  userAgent?: string;
}

/**
 * Store a push subscription for a portal user or beneficiary. Returns id or null.
 */
export async function subscribePush(options: SubscribeOptions): Promise<string | null> {
  if (!options.portalUserId && !options.userId) return null;
  const [row] = await db
    .insert(pushSubscriptions)
    .values({
      portalUserId: options.portalUserId ?? null,
      userId: options.userId ?? null,
      endpoint: options.subscription.endpoint,
      p256dh: options.subscription.keys.p256dh,
      auth: options.subscription.keys.auth,
      userAgent: options.userAgent ?? null,
    })
    .returning({ id: pushSubscriptions.id });
  return row?.id ?? null;
}

export interface SendPushOptions {
  title: string;
  body?: string;
  link?: string;
}

/**
 * Send a push notification to all subscriptions for a portal user. No-op if VAPID not set.
 * Returns { sent: number, failed: number }.
 */
export async function sendPushToPortalUser(
  portalUserId: string,
  payload: SendPushOptions
): Promise<{ sent: number; failed: number }> {
  configureVapid();
  if (!vapidConfigured) return { sent: 0, failed: 0 };

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.portalUserId, portalUserId));

  let sent = 0;
  let failed = 0;
  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    link: payload.link ?? "",
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        pushPayload
      );
      sent++;
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}

/**
 * Send push to all subscriptions for a beneficiary (user_id). No-op if VAPID not set.
 */
export async function sendPushToBeneficiary(
  userId: string,
  payload: SendPushOptions
): Promise<{ sent: number; failed: number }> {
  configureVapid();
  if (!vapidConfigured) return { sent: 0, failed: 0 };

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  let sent = 0;
  let failed = 0;
  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    link: payload.link ?? "",
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        pushPayload
      );
      sent++;
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}
