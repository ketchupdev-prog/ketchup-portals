/**
 * GET /api/v1/agents/[id] – Agent detail.
 * PUT /api/v1/agents/[id] – Update agent.
 * Roles: ketchup_* (RBAC enforced: agents.list permission).
 * Secured: RBAC, rate limiting, audit logging (PUT only).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { getPortalSession } from "@/lib/portal-auth";
import { logger } from "@/lib/logger";

const ROUTE_GET = "GET /api/v1/agents/[id]";
const ROUTE_PUT = "PUT /api/v1/agents/[id]";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require agents.list permission (SEC-001)
    const auth = await requirePermission(request, "agents.list", ROUTE_GET);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const row = await db.select().from(agents).where(eq(agents.id, id)).limit(1).then((r) => r[0]);
    
    if (!row) {
      return jsonError("Agent not found", "NotFound", { id }, 404, ROUTE_GET);
    }

    return Response.json({
      id: row.id,
      name: row.name,
      location_lat: row.locationLat,
      location_lng: row.locationLng,
      address: row.address,
      contact_phone: row.contactPhone,
      contact_email: row.contactEmail,
      commission_rate: row.commissionRate,
      float_balance: row.floatBalance,
      status: row.status,
      created_at: row.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error(ROUTE_GET, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE_GET);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require agents.list permission (SEC-001)
    const auth = await requirePermission(request, "agents.list", ROUTE_PUT);
    if (auth) return auth;

    // Rate limiting: Admin mutation endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const updateData: Record<string, any> = {};
    if (body.name != null) updateData.name = String(body.name);
    if (body.address != null) updateData.address = body.address;
    if (body.contact_phone != null) updateData.contactPhone = body.contact_phone;
    if (body.contact_email != null) updateData.contactEmail = body.contact_email;
    if (body.commission_rate != null) updateData.commissionRate = String(body.commission_rate);
    if (body.status != null) updateData.status = body.status;

    const [updated] = await db
      .update(agents)
      .set(updateData)
      .where(eq(agents.id, id))
      .returning({ id: agents.id, status: agents.status });
    
    if (!updated) {
      return jsonError("Agent not found", "NotFound", { id }, 404, ROUTE_PUT);
    }

    // Audit logging: Agent update (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'agent.update',
        resourceType: 'agent',
        resourceId: id,
        metadata: {
          changes: updateData,
        },
      });
    }

    return jsonSuccess({ id: updated.id, status: updated.status });
  } catch (err) {
    logger.error(ROUTE_PUT, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE_PUT);
  }
}
