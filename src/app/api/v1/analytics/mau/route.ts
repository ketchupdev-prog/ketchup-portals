/**
 * GET /api/v1/analytics/mau – Monthly active users (distinct user_id in last 30 days).
 * Roles: ketchup_*, gov_* (RBAC enforced: dashboard.summary permission).
 */

import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { userSessions } from "@/db/schema";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

const ROUTE = "GET /api/v1/analytics/mau";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require dashboard.summary permission (SEC-001)
    const auth = await requirePermission(request, "dashboard.summary", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") ?? "30", 10) || 30));

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setUTCHours(0, 0, 0, 0);

    const [row] = await db
      .select({
        count: sql<number>`count(distinct ${userSessions.userId})::int`,
      })
      .from(userSessions)
      .where(sql`${userSessions.loginAt} >= ${since}`);

    const mau = row?.count ?? 0;
    return Response.json({ mau, days });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
