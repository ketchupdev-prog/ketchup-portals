/**
 * GET /api/v1/agent/float – Current float (agent; agent_id from token or query).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get("agent_id");
    if (!agentId) return Response.json({ float_balance: "0" });
    const agent = await db.select({ floatBalance: agents.floatBalance }).from(agents).where(eq(agents.id, agentId)).limit(1).then((r) => r[0]);
    if (!agent) return jsonError("Agent not found", "NotFound", { agent_id: agentId }, 404);
    return Response.json({ float_balance: agent.floatBalance ?? "0" });
  } catch (err) {
    console.error("GET /api/v1/agent/float error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
