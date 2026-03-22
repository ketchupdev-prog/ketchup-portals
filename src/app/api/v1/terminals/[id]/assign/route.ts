/**
 * PATCH /api/v1/terminals/:id/assign – Assign terminal to agent.
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

const ROUTE = "PATCH /api/v1/terminals/[id]/assign";

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
    const agentId = body.agent_id ?? body.assigned_agent_id ?? null;

    // Get current assignment before update for audit trail
    const [current] = await db.select({ assignedAgentId: posTerminals.assignedAgentId, deviceId: posTerminals.deviceId })
      .from(posTerminals)
      .where(eq(posTerminals.id, id))
      .limit(1);
    if (!current) return jsonError("Terminal not found", "NotFound", { id }, 404, ROUTE);

    const [updated] = await db
      .update(posTerminals)
      .set({ assignedAgentId: agentId })
      .where(eq(posTerminals.id, id))
      .returning({ id: posTerminals.id, assigned_agent_id: posTerminals.assignedAgentId });

    // Audit logging: Terminal assignment (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: "terminal.assign",
        resourceType: "terminal",
        resourceId: updated.id,
        metadata: {
          deviceId: current.deviceId,
          previousAgentId: current.assignedAgentId,
          newAgentId: updated.assigned_agent_id,
        },
      });
    }

    return jsonSuccess({ id: updated.id, assigned_agent_id: updated.assigned_agent_id });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
