/**
 * GET /api/v1/audit-logs – Search audit logs (ketchup_compliance).
 * Roles: ketchup_compliance (RBAC enforced: audit.view permission).
 * Query params: action, entity_type, user_id, page, limit (pagination).
 * Response: Paginated { data, meta, links } per docs/DATABASE_AND_API_DESIGN.md.
 * Note: Read-only endpoint - NO audit logging (would create infinite loop).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auditLogs } from "@/db/schema";
import { desc, eq, ilike, and, sql } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

const ROUTE = "GET /api/v1/audit-logs";
const basePath = "/api/v1/audit-logs";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require audit.view permission (SEC-001)
    const auth = await requirePermission(request, "audit.view", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const action = searchParams.get("action");
    const entityType = searchParams.get("entity_type");
    const userId = searchParams.get("user_id");

    const conditions = [];
    if (action) conditions.push(ilike(auditLogs.action, `%${action}%`));
    if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(auditLogs).where(whereClause),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const query: Record<string, string> = {};
    if (action) query.action = action;
    if (entityType) query.entity_type = entityType;
    if (userId) query.user_id = userId;
    const links = paginationLinks(basePath, page, limit, totalPages, query);
    const data = rows.map((r) => ({
      id: r.id,
      user_id: r.userId,
      action: r.action,
      entity_type: r.entityType,
      entity_id: r.entityId,
      old_data: r.oldData,
      new_data: r.newData,
      created_at: r.createdAt.toISOString(),
    }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      error: err,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
