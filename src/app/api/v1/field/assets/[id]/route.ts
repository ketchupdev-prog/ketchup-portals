/**
 * GET /api/v1/field/assets/:id – Asset detail (field).
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
    console.error("GET /api/v1/field/assets/[id] error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
