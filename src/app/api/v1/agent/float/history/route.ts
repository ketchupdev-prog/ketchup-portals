/**
 * GET /api/v1/agent/float/history – Float transaction history.
 * Roles: agent (RBAC enforced: agent.dashboard permission).
 * Query: agent_id (required, UUID), page, limit.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { agentFloatTransactions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/agent/float/history";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require agent.dashboard permission (SEC-001)
    const auth = await requirePermission(request, "agent.dashboard", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const agentId = request.nextUrl.searchParams.get("agent_id");
    if (!agentId) return jsonPaginated([], { totalRecords: 0, totalPages: 1, page: 1, limit: 20 }, { first: "", prev: null, next: null, last: "" });
    const { page, limit, offset } = parsePagination(request.nextUrl.searchParams);
    const [rows, countRows] = await Promise.all([
      db.select().from(agentFloatTransactions).where(eq(agentFloatTransactions.agentId, agentId)).orderBy(desc(agentFloatTransactions.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(agentFloatTransactions).where(eq(agentFloatTransactions.agentId, agentId)),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const links = paginationLinks("/api/v1/agent/float/history", page, limit, totalPages);
    const data = rows.map((r) => ({ id: r.id, amount: r.amount, type: r.type, reference: r.reference, notes: r.notes, created_at: r.createdAt.toISOString() }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
