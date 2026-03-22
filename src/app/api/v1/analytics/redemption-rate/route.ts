/**
 * GET /api/v1/analytics/redemption-rate – Redemption rate by period.
 * Roles: ketchup_*, gov_* (RBAC enforced: dashboard.summary permission).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vouchers } from "@/db/schema";
import { sql } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

const ROUTE = "GET /api/v1/analytics/redemption-rate";

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
        total: sql<number>`count(*)::int`,
        redeemed: sql<number>`count(*) filter (where status = 'redeemed')::int`,
      })
      .from(vouchers);
    const r = rows[0];
    const total = r?.total ?? 0;
    const redeemed = r?.redeemed ?? 0;
    const rate = total > 0 ? (redeemed / total) * 100 : 0;
    return Response.json({ total, redeemed, redemption_rate_percent: Math.round(rate * 100) / 100 });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
