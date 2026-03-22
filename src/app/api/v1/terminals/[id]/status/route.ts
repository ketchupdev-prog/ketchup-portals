/**
 * PATCH /api/v1/terminals/:id/status – Update terminal status.
 * Roles: ketchup_ops (RBAC enforced: terminals.manage permission).
 * Secured: RBAC, rate limit, audit logging.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { posTerminals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { getPortalSession } from "@/lib/portal-auth";
import { logger } from "@/lib/logger";

const ROUTE = "PATCH /api/v1/terminals/[id]/status";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require terminals.manage permission (SEC-001)
    const auth = await requirePermission(request, "terminals.manage", ROUTE);
    if (auth) return auth;

    // Rate limiting: Admin mutation (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const status = body.status;
    if (!status || !["active", "maintenance", "offline"].includes(status)) {
      return jsonError("status must be active, maintenance, or offline", "ValidationError", { field: "status" }, 400, ROUTE);
    }

    // Get current status before update for audit trail
    const [current] = await db.select({ status: posTerminals.status, deviceId: posTerminals.deviceId })
      .from(posTerminals)
      .where(eq(posTerminals.id, id))
      .limit(1);
    if (!current) return jsonError("Terminal not found", "NotFound", { id }, 404, ROUTE);

    const [updated] = await db
      .update(posTerminals)
      .set({ status })
      .where(eq(posTerminals.id, id))
      .returning({ id: posTerminals.id, status: posTerminals.status });

    // Audit logging: Terminal status change (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: "terminal.status_change",
        resourceType: "terminal",
        resourceId: updated.id,
        metadata: {
          deviceId: current.deviceId,
          previousStatus: current.status,
          newStatus: updated.status,
        },
      });
    }

    return jsonSuccess({ id: updated.id, status: updated.status });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
