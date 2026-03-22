/**
 * POST /api/v1/agent/float/request – Request float top-up (agent).
 * Requires auth. For role=agent, body.agent_id must equal session's agent; requested_by stored for audit.
 * Secured: rate limit, Open Banking–aligned response (data root).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { floatRequests, agents, portalUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonSuccess, jsonErrorOpenBanking } from "@/lib/api-response";
import { getPortalSession } from "@/lib/portal-auth";
import { writeAuditLog } from "@/lib/audit-log";
import { requirePermission } from "@/lib/require-permission";
import { guardMutation } from "@/lib/api-security";

const ROUTE = "POST /api/v1/agent/float/request";

export async function POST(request: NextRequest) {
  try {
    const guard = guardMutation(request, {
      rateLimitKey: "agent:float:request",
      rateLimitMax: 20,
      requireJsonBody: true,
      route: ROUTE,
    });
    if (!guard.ok) return guard.response;

    const auth = await requirePermission(request, "agent.float.request", ROUTE);
    if (auth) return auth;

    const session = getPortalSession(request);
    if (!session) return jsonErrorOpenBanking("Unauthorized", "Unauthorized", 401);

    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const agentId = body.agent_id ?? request.nextUrl.searchParams.get("agent_id");
    if (!agentId) return jsonErrorOpenBanking("agent_id is required", "ValidationError", 400, { field: "agent_id" });
    if (Number.isNaN(amount) || amount <= 0) return jsonErrorOpenBanking("amount must be positive", "ValidationError", 400, { field: "amount" });

    const agent = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1).then((r) => r[0]);
    if (!agent) return jsonErrorOpenBanking("Agent not found", "NotFound", 404, { field: "agent_id" });

    if (session.role === "agent") {
      const [pu] = await db
        .select({ agentId: portalUsers.agentId })
        .from(portalUsers)
        .where(eq(portalUsers.id, session.userId))
        .limit(1);
      if (!pu?.agentId || pu.agentId !== agentId) {
        return jsonErrorOpenBanking("Forbidden: you may only request float for your own agent", "Forbidden", 403);
      }
    }

    const [inserted] = await db
      .insert(floatRequests)
      .values({
        agentId,
        amount: String(amount),
        status: "pending",
        requestedBy: session.userId,
      })
      .returning({ id: floatRequests.id, status: floatRequests.status, requested_at: floatRequests.requestedAt });
    if (!inserted) return jsonErrorOpenBanking("Failed to create request", "InternalError", 500, { route: ROUTE });
    await writeAuditLog({
      userId: session.userId,
      action: "float_request_created",
      entityType: "float_request",
      entityId: inserted.id,
      newData: { agent_id: agentId, amount: String(amount), status: "pending" },
      userAgent: request.headers.get("user-agent") ?? null,
    });
    return jsonSuccess(
      { id: inserted.id, status: inserted.status, requested_at: inserted.requested_at?.toISOString() ?? null },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/v1/agent/float/request error:", err);
    return jsonErrorOpenBanking("Internal server error", "InternalError", 500, { route: ROUTE });
  }
}
