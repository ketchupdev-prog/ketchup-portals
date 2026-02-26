/**
 * POST /api/v1/agent/float/request – Request float top-up (agent).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { floatRequests, agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const agentId = body.agent_id ?? request.nextUrl.searchParams.get("agent_id");
    if (!agentId) return jsonError("agent_id is required", "ValidationError", { field: "agent_id" }, 400);
    if (Number.isNaN(amount) || amount <= 0) return jsonError("amount must be positive", "ValidationError", { field: "amount" }, 400);
    const agent = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1).then((r) => r[0]);
    if (!agent) return jsonError("Agent not found", "NotFound", { agent_id: agentId }, 404);
    const [inserted] = await db
      .insert(floatRequests)
      .values({ agentId, amount: String(amount), status: "pending" })
      .returning({ id: floatRequests.id, status: floatRequests.status, requested_at: floatRequests.requestedAt });
    if (!inserted) return jsonError("Failed to create request", "InternalError", undefined, 500);
    return Response.json({ id: inserted.id, status: inserted.status, requested_at: inserted.requested_at?.toISOString() }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/agent/float/request error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
