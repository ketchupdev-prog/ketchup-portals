/**
 * GET /api/v1/reconciliation/daily – Daily reconciliation from transactions.
 * Query: date (optional, default today). Returns internal totals; bank_total can be wired when bank feed exists.
 */

import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions } from "@/db/schema";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/reconciliation/daily";

export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get("date");
    const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : new Date().toISOString().slice(0, 10);

    const [row] = await db
      .select({
        internalTotal: sql<string>`coalesce(sum(${transactions.amount})::text, '0')`,
        transactionCount: sql<number>`count(*)::int`,
      })
      .from(transactions)
      .where(sql`(${transactions.timestamp})::date = ${date}::date`);

    const internal_total = row?.internalTotal ?? "0";
    const transaction_count = row?.transactionCount ?? 0;
    const bank_total = internal_total;
    const discrepancy = "0";

    return Response.json({
      date,
      internal_total,
      bank_total,
      discrepancy,
      transaction_count,
    });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
