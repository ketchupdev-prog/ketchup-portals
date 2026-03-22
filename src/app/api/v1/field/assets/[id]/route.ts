/**
 * GET /api/v1/field/assets/:id – Get asset details.
 * Roles: field_tech, field_lead (RBAC enforced: field.assets permission).
 * Secured: RBAC, rate limiting.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/field/assets/[id]";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require field.assets permission (SEC-001)
    const auth = await requirePermission(request, "field.assets", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const row = await db.select().from(assets).where(eq(assets.id, id)).limit(1).then((r) => r[0]);
    if (!row) return jsonError("Asset not found", "NotFound", { id }, 404, ROUTE);
    
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
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
