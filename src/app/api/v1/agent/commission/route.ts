/**
 * GET /api/v1/agent/commission – Commission statement from agent transactions.
 * Roles: agent (RBAC enforced: agent.dashboard permission).
 * Query: agent_id (required), period (optional: current_month | last_month).
 */

import { NextRequest } from "next/server";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions } from "@/db/schema";
import { jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/agent/commission";

function monthBounds(period: "current_month" | "last_month"): { start: Date; end: Date } {
  const now = new Date();
  let start: Date;
  let end: Date;
  if (period === "last_month") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date();
  }
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require agent.dashboard permission (SEC-001)
    const auth = await requirePermission(request, "agent.dashboard", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const agentId = request.nextUrl.searchParams.get("agent_id");
    const periodParam = request.nextUrl.searchParams.get("period");
    const period = periodParam === "last_month" ? "last_month" : "current_month";
    const { start, end } = monthBounds(period);

    if (!agentId) {
      return jsonError("agent_id is required", "ValidationError", { field: "agent_id" }, 400, ROUTE);
    }

    const [row] = await db
      .select({
        totalCommission: sql<string>`coalesce(sum(${transactions.fee})::text, '0')`,
        transactionsCount: sql<number>`count(*)::int`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.agentId, agentId),
          gte(transactions.timestamp, start),
          lte(transactions.timestamp, end)
        )
      );

    return Response.json({
      agent_id: agentId,
      total_commission: row?.totalCommission ?? "0",
      period,
      transactions_count: row?.transactionsCount ?? 0,
    });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
