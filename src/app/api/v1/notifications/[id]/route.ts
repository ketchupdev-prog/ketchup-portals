/**
 * PATCH /api/v1/notifications/:id – Mark a notification as read.
 * Roles: All authenticated users (session auth only - users update their own notifications).
 * Security: Session verification, rate limiting (no RBAC permission check, no audit logging).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { inAppNotifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { validateId } from "@/lib/validate";
import { getPortalSession } from "@/lib/portal-auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const ROUTE = "PATCH /api/v1/notifications/[id]";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session verification: User must be authenticated (SEC-001)
    const session = getPortalSession(request);
    if (!session) {
      return jsonError("Unauthorized", "Unauthorized", undefined, 401, ROUTE);
    }

    // Rate limiting: Admin endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const idVal = validateId(id);
    if (!idVal.success) return jsonError(idVal.error, "ValidationError", idVal.details, 400, ROUTE);

    const [updated] = await db
      .update(inAppNotifications)
      .set({ read: true })
      .where(eq(inAppNotifications.id, idVal.data))
      .returning({ id: inAppNotifications.id, read: inAppNotifications.read });

    if (!updated) return jsonError("Notification not found", "NotFound", { id }, 404, ROUTE);
    return Response.json({ id: updated.id, read: updated.read });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
