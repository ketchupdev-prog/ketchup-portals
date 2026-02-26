/**
 * GET /api/v1/agent/settlement – Daily settlement summary from transactions.
 * Query: agent_id (required), date (optional, default today).
 */

import { NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions } from "@/db/schema";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/agent/settlement";

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get("agent_id");
    const dateParam = request.nextUrl.searchParams.get("date");
    const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : new Date().toISOString().slice(0, 10);

    if (!agentId) {
      return jsonError("agent_id is required", "ValidationError", { field: "agent_id" }, 400, ROUTE);
    }

    const [row] = await db
      .select({
        totalCashout: sql<string>`coalesce(sum(${transactions.amount})::text, '0')`,
        totalFees: sql<string>`coalesce(sum(${transactions.fee})::text, '0')`,
        transactionCount: sql<number>`count(*)::int`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.agentId, agentId),
          sql`(${transactions.timestamp})::date = ${date}::date`
        )
      );

    return Response.json({
      agent_id: agentId,
      date,
      total_cashout: row?.totalCashout ?? "0",
      total_fees: row?.totalFees ?? "0",
      transaction_count: row?.transactionCount ?? 0,
    });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
