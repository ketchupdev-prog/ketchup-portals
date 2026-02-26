/**
 * GET /api/v1/agents/:id – Agent detail. PATCH – Update agent.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await db.select().from(agents).where(eq(agents.id, id)).limit(1).then((r) => r[0]);
    if (!row) return jsonError("Agent not found", "NotFound", { id }, 404);
    return Response.json({
      id: row.id,
      name: row.name,
      location_lat: row.locationLat,
      location_lng: row.locationLng,
      address: row.address,
      contact_phone: row.contactPhone,
      contact_email: row.contactEmail,
      commission_rate: row.commissionRate,
      float_balance: row.floatBalance,
      status: row.status,
      created_at: row.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("GET /api/v1/agents/[id] error:", err);
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
      .update(agents)
      .set({
        ...(body.name != null && { name: String(body.name) }),
        ...(body.address != null && { address: body.address }),
        ...(body.contact_phone != null && { contactPhone: body.contact_phone }),
        ...(body.contact_email != null && { contactEmail: body.contact_email }),
        ...(body.commission_rate != null && { commissionRate: String(body.commission_rate) }),
        ...(body.status != null && { status: body.status }),
      })
      .where(eq(agents.id, id))
      .returning({ id: agents.id, status: agents.status });
    if (!updated) return jsonError("Agent not found", "NotFound", { id }, 404);
    return Response.json({ id: updated.id, status: updated.status });
  } catch (err) {
    console.error("PATCH /api/v1/agents/[id] error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
