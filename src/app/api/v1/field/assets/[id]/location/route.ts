/**
 * POST /api/v1/field/assets/:id/location – Update mobile unit location (field_tech).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assets, assetLocations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const lat = body.lat ?? body.location_lat;
    const lng = body.lng ?? body.location_lng;
    if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
      return jsonError("lat and lng are required", "ValidationError", { field: "lat,lng" }, 400);
    }
    const asset = await db.select().from(assets).where(eq(assets.id, id)).limit(1).then((r) => r[0]);
    if (!asset) return jsonError("Asset not found", "NotFound", { id }, 404);
    await db.update(assets).set({ locationLat: String(lat), locationLng: String(lng) }).where(eq(assets.id, id));
    await db.insert(assetLocations).values({ assetId: id, lat: String(lat), lng: String(lng) });
    return Response.json({ id, lat: Number(lat), lng: Number(lng) });
  } catch (err) {
    console.error("POST /api/v1/field/assets/[id]/location error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
