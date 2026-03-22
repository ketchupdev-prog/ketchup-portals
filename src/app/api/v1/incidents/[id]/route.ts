/**
 * PATCH /api/v1/incidents/:id – Update incident status.
 * Roles: ketchup_compliance, ketchup_ops, field_lead (RBAC enforced: incidents.manage permission).
 * Security: RBAC, rate limiting, audit logging.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { incidents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getPortalSession } from "@/lib/portal-auth";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { logger } from "@/lib/logger";

const ROUTE = "PATCH /api/v1/incidents/[id]";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require incidents.manage permission (SEC-001)
    const auth = await requirePermission(request, "incidents.manage", ROUTE);
    if (auth) return auth;

    // Rate limiting: Admin endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const [updated] = await db
      .update(incidents)
      .set({
        ...(body.title != null && { title: String(body.title) }),
        ...(body.description != null && { description: body.description }),
        ...(body.status != null && { status: body.status }),
        ...(body.severity != null && { severity: body.severity }),
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, id))
      .returning({ id: incidents.id, status: incidents.status });
    if (!updated) return jsonError("Incident not found", "NotFound", { id }, 404, ROUTE);

    // Audit logging: Incident status change (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'compliance.incident_reported',
        resourceType: 'incident',
        resourceId: updated.id,
        metadata: {
          status: updated.status,
          changes: body,
        },
      });
    }

    return Response.json({ id: updated.id, status: updated.status });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
