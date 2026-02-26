/**
 * GET /api/v1/portal/user/preferences – Get preferences for current portal user.
 * PATCH – Update preferences (e.g. notification_preferences). Auth required.
 */

import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { portalUserPreferences } from '@/db/schema';
import { getPortalSession } from '@/lib/portal-auth';
import { jsonError } from '@/lib/api-response';

const ROUTE_GET = 'GET /api/v1/portal/user/preferences';
const ROUTE_PATCH = 'PATCH /api/v1/portal/user/preferences';
const KEY = 'notification_preferences';
const DEFAULT_PREFS: Record<string, { in_app?: boolean; email?: boolean; sms?: boolean }> = {};

export async function GET(request: NextRequest) {
  try {
    const session = getPortalSession(request);
    if (!session) {
      return jsonError('Unauthorized', 'Unauthorized', undefined, 401, ROUTE_GET);
    }

    const key = (request.nextUrl.searchParams.get('key') as string) || KEY;

    const [row] = await db
      .select({ preferenceValue: portalUserPreferences.preferenceValue })
      .from(portalUserPreferences)
      .where(
        and(
          eq(portalUserPreferences.portalUserId, session.userId),
          eq(portalUserPreferences.preferenceKey, key)
        )
      )
      .limit(1);

    let value: unknown = DEFAULT_PREFS;
    if (row?.preferenceValue != null) {
      const raw = row.preferenceValue;
      if (typeof raw === "object" && raw !== null) {
        value = raw;
      } else {
        try {
          value = JSON.parse(String(raw)) as Record<string, { in_app?: boolean; email?: boolean; sms?: boolean }>;
        } catch {
          value = DEFAULT_PREFS;
        }
      }
    }

    return Response.json({ data: { [key]: value } });
  } catch (err) {
    console.error(ROUTE_GET, err);
    return jsonError('Internal server error', 'InternalError', undefined, 500, ROUTE_GET);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = getPortalSession(request);
    if (!session) {
      return jsonError('Unauthorized', 'Unauthorized', undefined, 401, ROUTE_PATCH);
    }

    const body = await request.json().catch(() => ({}));
    const notification_preferences = body.notification_preferences;
    if (notification_preferences == null || typeof notification_preferences !== 'object') {
      return jsonError('notification_preferences object required', 'ValidationError', undefined, 400);
    }

    const valueObj = notification_preferences as Record<string, unknown>;
    const updated = await db
      .update(portalUserPreferences)
      .set({ preferenceValue: valueObj, updatedAt: new Date() })
      .where(
        and(
          eq(portalUserPreferences.portalUserId, session.userId),
          eq(portalUserPreferences.preferenceKey, KEY)
        )
      )
      .returning({ preferenceValue: portalUserPreferences.preferenceValue });

    if (updated.length > 0) {
      const raw = updated[0].preferenceValue;
      const value =
        typeof raw === "object" && raw !== null ? raw : (() => { try { return JSON.parse(String(raw ?? "{}")); } catch { return valueObj; } })();
      return Response.json({ data: { notification_preferences: value } });
    }

    await db.insert(portalUserPreferences).values({
      portalUserId: session.userId,
      preferenceKey: KEY,
      preferenceValue: valueObj,
    });
    return Response.json({ data: { notification_preferences } });
  } catch (err) {
    console.error(ROUTE_PATCH, err);
    return jsonError('Internal server error', 'InternalError', undefined, 500, ROUTE_PATCH);
  }
}
