/**
 * PATCH /api/v1/terminals/:id/status – Update terminal status.
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
    const status = body.status;
    if (!status || !["active", "maintenance", "offline"].includes(status)) {
      return jsonError("status must be active, maintenance, or offline", "ValidationError", { field: "status" }, 400);
    }
    const [updated] = await db
      .update(posTerminals)
      .set({ status })
      .where(eq(posTerminals.id, id))
      .returning({ id: posTerminals.id, status: posTerminals.status });
    if (!updated) return jsonError("Terminal not found", "NotFound", { id }, 404);
    return Response.json({ id: updated.id, status: updated.status });
  } catch (err) {
    console.error("PATCH /api/v1/terminals/[id]/status error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
