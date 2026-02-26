/**
 * PATCH /api/v1/agents/:id/float – Adjust agent float (ketchup_finance).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { agents, agentFloatTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const type = body.type ?? "adjustment";
    if (Number.isNaN(amount) || amount === 0) {
      return jsonError("amount must be a non-zero number", "ValidationError", { field: "amount" }, 400);
    }
    const agent = await db.select().from(agents).where(eq(agents.id, id)).limit(1).then((r) => r[0]);
    if (!agent) return jsonError("Agent not found", "NotFound", { id }, 404);

    const current = Number(agent.floatBalance ?? 0);
    const newBalance = String(current + amount);
    await db.update(agents).set({ floatBalance: newBalance }).where(eq(agents.id, id));
    await db.insert(agentFloatTransactions).values({
      agentId: id,
      amount: String(Math.abs(amount)),
      type: type === "top_up" || type === "settlement" || type === "adjustment" ? type : "adjustment",
      notes: body.notes ?? null,
    });
    return Response.json({ float_balance: newBalance });
  } catch (err) {
    console.error("PATCH /api/v1/agents/[id]/float error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
