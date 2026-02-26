/**
 * GET /api/v1/agents/:id/float-history – List float transactions.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { agentFloatTransactions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";

const basePath = "/api/v1/agents";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(agentFloatTransactions)
        .where(eq(agentFloatTransactions.agentId, id))
        .orderBy(desc(agentFloatTransactions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(agentFloatTransactions)
        .where(eq(agentFloatTransactions.agentId, id)),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const links = paginationLinks(`${basePath}/${id}/float-history`, page, limit, totalPages);
    const data = rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      type: r.type,
      reference: r.reference,
      notes: r.notes,
      created_at: r.createdAt.toISOString(),
    }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    console.error("GET /api/v1/agents/[id]/float-history error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
