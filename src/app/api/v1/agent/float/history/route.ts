/**
 * GET /api/v1/agent/float/history – Float transaction history (agent).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { agentFloatTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
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
    console.error("GET /api/v1/agent/float/history error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
