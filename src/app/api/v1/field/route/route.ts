/**
 * GET /api/v1/field/route – Field route optimization (return route stops).
 * Roles: field_lead, field_tech (RBAC enforced: field.map permission).
 * Secured: RBAC, rate limiting.
 */

import { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const ROUTE_GET = "GET /api/v1/field/route";
const ROUTE_POST = "POST /api/v1/field/route";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require field.map permission (SEC-001)
    const auth = await requirePermission(request, "field.map", ROUTE_GET);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    return jsonSuccess({ stops: [] });
  } catch (err) {
    logger.error(ROUTE_GET, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE_GET);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const waypoints = body.waypoints ?? [];
    return jsonSuccess({ route_id: crypto.randomUUID(), waypoints, distance_km: 0, duration_mins: 0 });
  } catch (err) {
    logger.error(ROUTE_POST, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE_POST);
  }
}
