/**
 * POST /api/v1/push/subscribe – Register a push subscription (portal user or beneficiary).
 * Body: { portal_user_id?: string, user_id?: string, subscription: { endpoint, keys: { p256dh, auth } }, user_agent?: string }
 * PRD §7.4.1: Push for task assigned (field ops), proof-of-life (beneficiaries).
 */

import { NextRequest } from "next/server";
import { subscribePush } from "@/lib/services/push";
import { jsonError } from "@/lib/api-response";

const ROUTE = "POST /api/v1/push/subscribe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const portalUserId = body.portal_user_id ?? null;
    const userId = body.user_id ?? null;
    const subscription = body.subscription;

    if (!portalUserId && !userId) {
      return jsonError("portal_user_id or user_id required", "ValidationError", {}, 400);
    }
    if (
      !subscription ||
      typeof subscription.endpoint !== "string" ||
      !subscription.keys ||
      typeof subscription.keys.p256dh !== "string" ||
      typeof subscription.keys.auth !== "string"
    ) {
      return jsonError("subscription with endpoint and keys.p256dh, keys.auth required", "ValidationError", {}, 400);
    }

    const id = await subscribePush({
      portalUserId: portalUserId ?? undefined,
      userId: userId ?? undefined,
      subscription: {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
      },
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    if (!id) return jsonError("Failed to save subscription", "InternalError", undefined, 500);
    return Response.json({ id }, { status: 201 });
  } catch (err) {
    console.error(ROUTE, err);
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
