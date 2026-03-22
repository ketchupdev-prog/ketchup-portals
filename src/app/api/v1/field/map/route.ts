/**
 * GET /api/v1/field/map – GeoJSON for field operations map (agents + assets).
 * Roles: field_lead, field_tech (RBAC enforced: field.map permission).
 * Secured: RBAC, rate limiting.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assets, agents } from "@/db/schema";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/field/map";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require field.map permission (SEC-001)
    const auth = await requirePermission(request, "field.map", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const [assetRows, agentRows] = await Promise.all([
      db.select({ id: assets.id, type: assets.type, name: assets.name, lat: assets.locationLat, lng: assets.locationLng, status: assets.status }).from(assets),
      db.select({ id: agents.id, name: agents.name, lat: agents.locationLat, lng: agents.locationLng, status: agents.status }).from(agents),
    ]);
    const features: Array<{ type: "Feature"; geometry: { type: "Point"; coordinates: [number, number] }; properties: Record<string, unknown> }> = [];
    for (const r of assetRows) {
      if (r.lat != null && r.lng != null) {
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [Number(r.lng), Number(r.lat)] },
          properties: { id: r.id, type: r.type, name: r.name, status: r.status, layer: "asset" },
        });
      }
    }
    for (const r of agentRows) {
      if (r.lat != null && r.lng != null) {
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [Number(r.lng), Number(r.lat)] },
          properties: { id: r.id, name: r.name, status: r.status, layer: "agent" },
        });
      }
    }
    return jsonSuccess({ type: "FeatureCollection" as const, features });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
