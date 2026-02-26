/**
 * In-app notification service – Create notifications for portal users (PRD §7.4).
 * Shown in header notification center. Used when task assigned, float approved/rejected, etc.
 * Location: src/lib/services/notifications.ts
 */

import { db } from "@/lib/db";
import { inAppNotifications } from "@/db/schema";

export interface CreateNotificationOptions {
  userId: string;
  title: string;
  body?: string;
  link?: string;
}

/**
 * Create an in-app notification for a portal user. Returns the new notification id.
 */
export async function createInAppNotification(
  options: CreateNotificationOptions
): Promise<string | null> {
  const [row] = await db
    .insert(inAppNotifications)
    .values({
      userId: options.userId,
      title: options.title,
      body: options.body ?? null,
      link: options.link ?? null,
    })
    .returning({ id: inAppNotifications.id });

  return row?.id ?? null;
}
