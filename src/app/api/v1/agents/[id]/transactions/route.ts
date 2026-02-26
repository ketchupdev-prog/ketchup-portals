/**
 * GET /api/v1/agents/:id/transactions – Agent POS transaction history.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";
import { sql } from "drizzle-orm";

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
        .from(transactions)
        .where(eq(transactions.agentId, id))
        .orderBy(desc(transactions.timestamp))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(eq(transactions.agentId, id)),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const links = paginationLinks(`${basePath}/${id}/transactions`, page, limit, totalPages);
    const data = rows.map((r) => ({
      id: r.id,
      beneficiary_id: r.beneficiaryId,
      type: r.type,
      amount: r.amount,
      fee: r.fee,
      method: r.method,
      timestamp: r.timestamp.toISOString(),
    }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    console.error("GET /api/v1/agents/[id]/transactions error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
