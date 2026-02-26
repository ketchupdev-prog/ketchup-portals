/**
 * PATCH /api/v1/portal/duplicate-redemptions/:id – Update duplicate event status / resolution notes (PRD §3.3.11).
 */

import { NextRequest } from "next/server";
import { getDuplicateEvent, updateDuplicateEvent } from "@/lib/services/duplicate-redemption-service";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const ROUTE = "PATCH /api/v1/portal/duplicate-redemptions/[id]";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getDuplicateEvent(id);
    if (!existing)
      return jsonError("Duplicate redemption event not found", "NotFound", { id }, 404, ROUTE);

    const body = await request.json().catch(() => ({}));
    const status = body.status;
    const resolution_notes = body.resolution_notes;

    const patch: { status?: "advance_posted" | "under_review" | "no_financial_impact" | "agent_appealing" | "resolved"; resolution_notes?: string } = {};
    if (status != null && typeof status === "string")
      patch.status = status as "advance_posted" | "under_review" | "no_financial_impact" | "agent_appealing" | "resolved";
    if (resolution_notes != null && typeof resolution_notes === "string")
      patch.resolution_notes = resolution_notes;

    if (Object.keys(patch).length === 0)
      return jsonError("No updates provided (status or resolution_notes)", "ValidationError", undefined, 400, ROUTE);

    await updateDuplicateEvent(id, patch);
    return Response.json({ success: true });
  } catch (err) {
    logger.error(
      ROUTE,
      err instanceof Error ? err.message : "Update duplicate redemption error",
      { error: err }
    );
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
