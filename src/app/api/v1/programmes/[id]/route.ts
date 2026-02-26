/**
 * GET /api/v1/programmes/:id – Programme detail. PATCH – Update programme.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { programmes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await db.select().from(programmes).where(eq(programmes.id, id)).limit(1).then((r) => r[0]);
    if (!row) return jsonError("Programme not found", "NotFound", { id }, 404);
    return Response.json({
      id: row.id,
      name: row.name,
      description: row.description,
      allocated_budget: row.allocatedBudget,
      spent_to_date: row.spentToDate,
      start_date: row.startDate,
      end_date: row.endDate,
      verification_frequency_days: row.verificationFrequencyDays,
    });
  } catch (err) {
    console.error("GET /api/v1/programmes/[id] error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const [updated] = await db
      .update(programmes)
      .set({
        ...(body.name != null && { name: String(body.name) }),
        ...(body.description != null && { description: body.description }),
        ...(body.allocated_budget != null && { allocatedBudget: String(body.allocated_budget) }),
        ...(body.start_date != null && { startDate: body.start_date }),
        ...(body.end_date != null && { endDate: body.end_date }),
        ...(body.verification_frequency_days != null && { verificationFrequencyDays: body.verification_frequency_days }),
      })
      .where(eq(programmes.id, id))
      .returning({ id: programmes.id });
    if (!updated) return jsonError("Programme not found", "NotFound", { id }, 404);
    return Response.json({ id: updated.id });
  } catch (err) {
    console.error("PATCH /api/v1/programmes/[id] error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
