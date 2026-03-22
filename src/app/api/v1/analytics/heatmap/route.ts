/**
 * GET /api/v1/analytics/heatmap – Transaction heatmap data (by region/lat-lng).
 * Roles: ketchup_*, gov_* (RBAC enforced: dashboard.summary permission).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { transactions, agents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

const ROUTE = "GET /api/v1/analytics/heatmap";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require dashboard.summary permission (SEC-001)
    const auth = await requirePermission(request, "dashboard.summary", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const rows = await db
      .select({
        lat: agents.locationLat,
        lng: agents.locationLng,
        count: sql<number>`count(${transactions.id})::int`,
      })
      .from(transactions)
      .innerJoin(agents, eq(transactions.agentId, agents.id))
      .groupBy(agents.locationLat, agents.locationLng);
    const data = rows
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => ({ lat: Number(r.lat), lng: Number(r.lng), count: r.count }));
    return Response.json({ data });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
