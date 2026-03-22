/**
 * POST /api/v1/assets/:id/location – Update mobile unit location.
 * Roles: field_tech, field_lead (RBAC enforced: assets.manage permission).
 * Secured: RBAC, rate limit, audit logging.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assets, assetLocations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { getPortalSession } from "@/lib/portal-auth";
import { logger } from "@/lib/logger";

const ROUTE = "POST /api/v1/assets/[id]/location";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require assets.manage permission (SEC-001)
    const auth = await requirePermission(request, "assets.manage", ROUTE);
    if (auth) return auth;

    // Rate limiting: Admin mutation (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const lat = body.lat ?? body.location_lat;
    const lng = body.lng ?? body.location_lng;
    if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
      return jsonError("lat and lng are required", "ValidationError", { field: "lat,lng" }, 400, ROUTE);
    }
    const asset = await db.select().from(assets).where(eq(assets.id, id)).limit(1).then((r) => r[0]);
    if (!asset) return jsonError("Asset not found", "NotFound", { id }, 404, ROUTE);

    await db.update(assets).set({ locationLat: String(lat), locationLng: String(lng) }).where(eq(assets.id, id));
    await db.insert(assetLocations).values({ assetId: id, lat: String(lat), lng: String(lng) });

    // Audit logging: Location update (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: "field.asset_update",
        resourceType: "asset",
        resourceId: id,
        metadata: {
          type: "location_change",
          assetName: asset.name,
          previousLat: asset.locationLat,
          previousLng: asset.locationLng,
          newLat: String(lat),
          newLng: String(lng),
        },
      });
    }

    return jsonSuccess({ id, lat: Number(lat), lng: Number(lng) });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
