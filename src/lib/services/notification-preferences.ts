/**
 * Notification preferences for outbound communications (PRD §7.4, §8.2).
 * When sending email/SMS/in-app to a portal user, check this before sending.
 * Location: src/lib/services/notification-preferences.ts
 */

import { db } from "@/lib/db";
import { portalUserPreferences } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const KEY = "notification_preferences";

type Channel = "in_app" | "email" | "sms";

/** Default: in_app on, email/sms off (per Profile & Settings spec). */
const CHANNEL_DEFAULT: Record<Channel, boolean> = {
  in_app: true,
  email: false,
  sms: false,
};

/**
 * Returns whether the given channel is enabled for the notification type for this portal user.
 * If no preferences row or type not set, uses CHANNEL_DEFAULT (in_app true, email/sms false).
 */
export async function isNotificationChannelEnabled(
  portalUserId: string,
  notificationType: string,
  channel: Channel
): Promise<boolean> {
  const [row] = await db
    .select({ preferenceValue: portalUserPreferences.preferenceValue })
    .from(portalUserPreferences)
    .where(
      and(
        eq(portalUserPreferences.portalUserId, portalUserId),
        eq(portalUserPreferences.preferenceKey, KEY)
      )
    )
    .limit(1);

  if (!row?.preferenceValue) return CHANNEL_DEFAULT[channel];

  const raw = row.preferenceValue;
  const prefs =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, { in_app?: boolean; email?: boolean; sms?: boolean }>)
      : (() => {
          try {
            return JSON.parse(String(raw ?? "{}")) as Record<
              string,
              { in_app?: boolean; email?: boolean; sms?: boolean }
            >;
          } catch {
            return {};
          }
        })();
  const typePrefs = prefs[notificationType];
  if (typeof typePrefs !== "object" || typePrefs === null)
    return CHANNEL_DEFAULT[channel];
  const val = typePrefs[channel];
  return val === true;
}

/**
 * Returns true if any of the given portal users has the channel enabled for the notification type.
 * Used when notifying "agent's portal users" and we send one SMS to agent phone – send if any has SMS on.
 */
export async function shouldSendToAny(
  portalUserIds: string[],
  notificationType: string,
  channel: Channel
): Promise<boolean> {
  if (portalUserIds.length === 0) return false;
  for (const id of portalUserIds) {
    const enabled = await isNotificationChannelEnabled(id, notificationType, channel);
    if (enabled) return true;
  }
  return false;
}
