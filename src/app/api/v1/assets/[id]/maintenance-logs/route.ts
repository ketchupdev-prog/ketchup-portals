/**
 * GET /api/v1/assets/:id/maintenance-logs – List maintenance logs (paginated).
 * Roles: field_tech, field_lead (RBAC enforced: assets.manage permission).
 * Secured: RBAC, rate limit.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { maintenanceLogs } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/assets/[id]/maintenance-logs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require assets.manage permission (SEC-001)
    const auth = await requirePermission(request, "assets.manage", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(maintenanceLogs)
        .where(eq(maintenanceLogs.assetId, id))
        .orderBy(desc(maintenanceLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(maintenanceLogs)
        .where(eq(maintenanceLogs.assetId, id)),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const links = paginationLinks(`/api/v1/assets/${id}/maintenance-logs`, page, limit, totalPages);
    const data = rows.map((r) => ({
      id: r.id,
      type: r.type,
      notes: r.notes,
      cash_before: r.cashBefore,
      cash_added: r.cashAdded,
      cash_after: r.cashAfter,
      created_at: r.createdAt.toISOString(),
    }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
