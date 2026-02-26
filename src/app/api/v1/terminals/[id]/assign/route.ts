/**
 * PATCH /api/v1/terminals/:id/assign – Assign terminal to agent.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { posTerminals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const agentId = body.agent_id ?? body.assigned_agent_id ?? null;
    const [updated] = await db
      .update(posTerminals)
      .set({ assignedAgentId: agentId })
      .where(eq(posTerminals.id, id))
      .returning({ id: posTerminals.id, assigned_agent_id: posTerminals.assignedAgentId });
    if (!updated) return jsonError("Terminal not found", "NotFound", { id }, 404);
    return Response.json({ id: updated.id, assigned_agent_id: updated.assigned_agent_id });
  } catch (err) {
    console.error("PATCH /api/v1/terminals/[id]/assign error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
