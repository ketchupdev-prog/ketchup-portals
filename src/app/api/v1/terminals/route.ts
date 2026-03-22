/**
 * GET /api/v1/terminals – List POS terminals (paginated, filterable).
 * Roles: ketchup_ops (RBAC enforced: terminals.list permission).
 * Secured: RBAC, rate limit.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { posTerminals } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import {
  parsePagination,
  paginationLinks,
  jsonPaginated,
  jsonError,
} from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const basePath = "/api/v1/terminals";
const ROUTE_GET = "GET /api/v1/terminals";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require terminals.list permission (SEC-001)
    const auth = await requirePermission(request, "terminals.list", ROUTE_GET);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const conditions = [];
    if (status) conditions.push(eq(posTerminals.status, status));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(posTerminals)
        .where(whereClause)
        .orderBy(desc(posTerminals.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(posTerminals).where(whereClause),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const links = paginationLinks(basePath, page, limit, totalPages, status ? { status } : undefined);
    const data = rows.map((r) => ({
      id: r.id,
      device_id: r.deviceId,
      model: r.model,
      status: r.status,
      assigned_agent_id: r.assignedAgentId,
      last_ping: r.lastPing?.toISOString() ?? null,
      software_version: r.softwareVersion,
      created_at: r.createdAt.toISOString(),
    }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    logger.error(ROUTE_GET, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE_GET);
  }
}
