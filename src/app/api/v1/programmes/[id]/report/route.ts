/**
 * GET /api/v1/programmes/:id/report – Generate programme report (JSON summary).
 * Roles: gov_* with government.reports permission (RBAC enforced).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { programmes, vouchers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/programmes/[id]/report";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require government.reports permission (SEC-001)
    const auth = await requirePermission(request, "government.reports", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const prog = await db.select().from(programmes).where(eq(programmes.id, id)).limit(1).then((r) => r[0]);
    if (!prog) return jsonError("Programme not found", "NotFound", { id }, 404, ROUTE);

    const stats = await db
      .select({
        total: sql<number>`count(*)::int`,
        redeemed: sql<number>`count(*) filter (where status = 'redeemed')::int`,
        available: sql<number>`count(*) filter (where status = 'available')::int`,
        expired: sql<number>`count(*) filter (where status = 'expired')::int`,
      })
      .from(vouchers)
      .where(eq(vouchers.programmeId, id))
      .then((r) => r[0]);

    return Response.json({
      programme_id: id,
      programme_name: prog.name,
      allocated_budget: prog.allocatedBudget,
      spent_to_date: prog.spentToDate,
      vouchers_total: stats?.total ?? 0,
      vouchers_redeemed: stats?.redeemed ?? 0,
      vouchers_available: stats?.available ?? 0,
      vouchers_expired: stats?.expired ?? 0,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
