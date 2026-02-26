/**
 * GET /api/v1/assets/:id – Asset detail. PATCH – Update asset.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await db.select().from(assets).where(eq(assets.id, id)).limit(1).then((r) => r[0]);
    if (!row) return jsonError("Asset not found", "NotFound", { id }, 404);
    return Response.json({
      id: row.id,
      type: row.type,
      name: row.name,
      location_lat: row.locationLat,
      location_lng: row.locationLng,
      status: row.status,
      cash_level: row.cashLevel,
      last_replenishment: row.lastReplenishment?.toISOString() ?? null,
      driver: row.driver,
      created_at: row.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("GET /api/v1/assets/[id] error:", err);
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
      .update(assets)
      .set({
        ...(body.name != null && { name: String(body.name) }),
        ...(body.type != null && { type: body.type }),
        ...(body.status != null && { status: body.status }),
        ...(body.location_lat != null && { locationLat: String(body.location_lat) }),
        ...(body.location_lng != null && { locationLng: String(body.location_lng) }),
        ...(body.cash_level != null && { cashLevel: String(body.cash_level) }),
        ...(body.driver != null && { driver: body.driver }),
      })
      .where(eq(assets.id, id))
      .returning({ id: assets.id, status: assets.status });
    if (!updated) return jsonError("Asset not found", "NotFound", { id }, 404);
    return Response.json({ id: updated.id, status: updated.status });
  } catch (err) {
    console.error("PATCH /api/v1/assets/[id] error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
