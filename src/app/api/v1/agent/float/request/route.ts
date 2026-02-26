/**
 * POST /api/v1/agent/float/request – Request float top-up (agent).
 * Requires auth. For role=agent, body.agent_id must equal session's agent; requested_by stored for audit.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { floatRequests, agents, portalUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { getPortalSession } from "@/lib/portal-auth";
import { writeAuditLog } from "@/lib/audit-log";
import { requirePermission } from "@/lib/require-permission";

const ROUTE = "POST /api/v1/agent/float/request";

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "agent.float.request", ROUTE);
    if (auth) return auth;

    const session = getPortalSession(request);
    if (!session) return jsonError("Unauthorized", "Unauthorized", undefined, 401);

    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const agentId = body.agent_id ?? request.nextUrl.searchParams.get("agent_id");
    if (!agentId) return jsonError("agent_id is required", "ValidationError", { field: "agent_id" }, 400);
    if (Number.isNaN(amount) || amount <= 0) return jsonError("amount must be positive", "ValidationError", { field: "amount" }, 400);

    const agent = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1).then((r) => r[0]);
    if (!agent) return jsonError("Agent not found", "NotFound", { agent_id: agentId }, 404);

    if (session.role === "agent") {
      const [pu] = await db
        .select({ agentId: portalUsers.agentId })
        .from(portalUsers)
        .where(eq(portalUsers.id, session.userId))
        .limit(1);
      if (!pu?.agentId || pu.agentId !== agentId) {
        return jsonError("Forbidden: you may only request float for your own agent", "Forbidden", undefined, 403);
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
    if (!inserted) return jsonError("Failed to create request", "InternalError", undefined, 500);
    await writeAuditLog({
      userId: session.userId,
      action: "float_request_created",
      entityType: "float_request",
      entityId: inserted.id,
      newData: { agent_id: agentId, amount: String(amount), status: "pending" },
      userAgent: request.headers.get("user-agent") ?? null,
    });
    return Response.json(
      { id: inserted.id, status: inserted.status, requested_at: inserted.requested_at?.toISOString() },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/v1/agent/float/request error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
