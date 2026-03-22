/**
 * GET /api/v1/assets/:id – Get asset details by ID.
 * PATCH /api/v1/assets/:id – Update asset details.
 * Roles: ketchup_ops, field_tech, field_lead (RBAC enforced: assets.manage permission).
 * Secured: RBAC, rate limit, audit logging (mutations only).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { getPortalSession } from "@/lib/portal-auth";
import { logger } from "@/lib/logger";

const ROUTE_GET = "GET /api/v1/assets/[id]";
const ROUTE_PATCH = "PATCH /api/v1/assets/[id]";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require assets.manage permission (SEC-001)
    const auth = await requirePermission(request, "assets.manage", ROUTE_GET);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const row = await db.select().from(assets).where(eq(assets.id, id)).limit(1).then((r) => r[0]);
    if (!row) return jsonError("Asset not found", "NotFound", { id }, 404, ROUTE_GET);
    return jsonSuccess({
      id: row.id,
      type: row.type,
      name: row.name,
      location_lat: row.locationLat,
      location_lng: row.locationLng,
      status: row.status,
      cash_level: row.cashLevel,
      last_replenishment: row.lastReplenishment?.toISOString() ?? null,
      driver: row.driver,
      created_at: row.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error(ROUTE_GET, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE_GET);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require assets.manage permission (SEC-001)
    const auth = await requirePermission(request, "assets.manage", ROUTE_PATCH);
    if (auth) return auth;

    // Rate limiting: Admin mutation (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const [updated] = await db
      .update(assets)
      .set({
        ...(body.name != null && { name: String(body.name) }),
        ...(body.type != null && { type: body.type }),
        ...(body.status != null && { status: body.status }),
        ...(body.location_lat != null && { locationLat: String(body.location_lat) }),
        ...(body.location_lng != null && { locationLng: String(body.location_lng) }),
        ...(body.cash_level != null && { cashLevel: String(body.cash_level) }),
        ...(body.driver != null && { driver: body.driver }),
      })
      .where(eq(assets.id, id))
      .returning({ id: assets.id, status: assets.status });
    if (!updated) return jsonError("Asset not found", "NotFound", { id }, 404, ROUTE_PATCH);

    // Audit logging: Asset update (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: "field.asset_update",
        resourceType: "asset",
        resourceId: updated.id,
        metadata: {
          updatedFields: Object.keys(body),
          ...body,
        },
      });
    }

    return jsonSuccess({ id: updated.id, status: updated.status });
  } catch (err) {
    logger.error(ROUTE_PATCH, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE_PATCH);
  }
}
