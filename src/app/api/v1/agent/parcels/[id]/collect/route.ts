/**
 * PATCH /api/v1/agent/parcels/:id/collect – Mark parcel as collected.
 * Roles: agent (RBAC enforced: agent.parcels permission).
 * Secured: RBAC, rate limit, audit logging.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { parcels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getPortalSession } from "@/lib/portal-auth";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { logger } from "@/lib/logger";

const ROUTE = "PATCH /api/v1/agent/parcels/[id]/collect";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require agent.parcels permission (SEC-001)
    const auth = await requirePermission(request, "agent.parcels", ROUTE);
    if (auth) return auth;

    // Rate limiting: Admin operation (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const [updated] = await db
      .update(parcels)
      .set({ status: "collected", collectedAt: new Date() })
      .where(eq(parcels.id, id))
      .returning({ id: parcels.id, status: parcels.status, trackingCode: parcels.trackingCode });
    if (!updated) return jsonError("Parcel not found", "NotFound", { id }, 404, ROUTE);

    // Audit logging: Operational tracking (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'agent.parcel_collected',
        resourceType: 'parcel',
        resourceId: updated.id,
        metadata: {
          trackingCode: updated.trackingCode,
          status: updated.status,
        },
      });
    }

    return Response.json({ id: updated.id, status: updated.status });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
