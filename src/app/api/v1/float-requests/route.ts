/**
 * GET /api/v1/float-requests – List float requests for Ketchup review.
 * Query: status (pending | approved | rejected), agent_id, page, limit.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { floatRequests, agents } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";

const basePath = "/api/v1/float-requests";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const agentId = searchParams.get("agent_id");

    const conditions = [];
    if (status) conditions.push(eq(floatRequests.status, status));
    if (agentId) conditions.push(eq(floatRequests.agentId, agentId));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: floatRequests.id,
        agentId: floatRequests.agentId,
        amount: floatRequests.amount,
        status: floatRequests.status,
        requestedAt: floatRequests.requestedAt,
        reviewedBy: floatRequests.reviewedBy,
        reviewedAt: floatRequests.reviewedAt,
        agentName: agents.name,
      })
      .from(floatRequests)
      .leftJoin(agents, eq(floatRequests.agentId, agents.id))
      .where(whereClause)
      .orderBy(desc(floatRequests.requestedAt))
      .limit(limit)
      .offset(offset);

    const countRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(floatRequests)
      .where(whereClause);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const query: Record<string, string> = {};
    if (status) query.status = status;
    if (agentId) query.agent_id = agentId;
    const links = paginationLinks(basePath, page, limit, totalPages, query);

    const data = rows.map((r) => ({
      id: r.id,
      agent_id: r.agentId,
      agent_name: r.agentName ?? "—",
      amount: r.amount,
      status: r.status,
      requested_at: r.requestedAt?.toISOString() ?? null,
      reviewed_by: r.reviewedBy ?? null,
      reviewed_at: r.reviewedAt?.toISOString() ?? null,
    }));

    return jsonPaginated(data, meta, links);
  } catch (err) {
    console.error("GET /api/v1/float-requests error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
