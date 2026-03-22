/**
 * GET /api/v1/agent/dashboard – Agent dashboard summary.
 * Roles: agent (RBAC enforced: agent.dashboard permission).
 * Query: agent_id (required, UUID).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { agents, floatRequests, parcels, transactions } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/agent/dashboard";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require agent.dashboard permission (SEC-001)
    const auth = await requirePermission(request, "agent.dashboard", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const agentId = request.nextUrl.searchParams.get("agent_id");
    if (!agentId) {
      return Response.json({
        float_balance: "0",
        pending_float_requests: 0,
        parcels_ready: 0,
        recent_transactions: [],
      });
    }
    const agent = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1).then((r) => r[0]);
    if (!agent) return jsonError("Agent not found", "NotFound", { agent_id: agentId }, 404, ROUTE);

    const [pendingRequests, parcelsReady, recentTx] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(floatRequests).where(and(eq(floatRequests.agentId, agentId), eq(floatRequests.status, "pending"))),
      db.select({ count: sql<number>`count(*)::int` }).from(parcels).where(and(eq(parcels.agentId, agentId), eq(parcels.status, "ready"))),
      db.select({ id: transactions.id, type: transactions.type, amount: transactions.amount, timestamp: transactions.timestamp })
        .from(transactions)
        .where(eq(transactions.agentId, agentId))
        .orderBy(desc(transactions.timestamp))
        .limit(10),
    ]);
    const pendingCount = (pendingRequests[0] as { count: number } | undefined)?.count ?? 0;
    const parcelsCount = (parcelsReady[0] as { count: number } | undefined)?.count ?? 0;
    return Response.json({
      float_balance: agent.floatBalance ?? "0",
      pending_float_requests: pendingCount,
      parcels_ready: parcelsCount,
      recent_transactions: recentTx.map((t) => ({ id: t.id, type: t.type, amount: t.amount, timestamp: t.timestamp.toISOString() })),
    });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
