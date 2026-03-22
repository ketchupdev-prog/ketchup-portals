/**
 * GET /api/v1/agent/float – Current float balance.
 * Roles: agent (RBAC enforced: agent.dashboard permission).
 * Query: agent_id (required, UUID).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/agent/float";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require agent.dashboard permission (SEC-001)
    const auth = await requirePermission(request, "agent.dashboard", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const agentId = request.nextUrl.searchParams.get("agent_id");
    if (!agentId) return Response.json({ float_balance: "0" });
    const agent = await db.select({ floatBalance: agents.floatBalance }).from(agents).where(eq(agents.id, agentId)).limit(1).then((r) => r[0]);
    if (!agent) return jsonError("Agent not found", "NotFound", { agent_id: agentId }, 404, ROUTE);
    return Response.json({ float_balance: agent.floatBalance ?? "0" });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
