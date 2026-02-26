/**
 * GET /api/v1/field/map – GeoJSON for field map (agents + assets).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assets, agents } from "@/db/schema";
import { jsonError } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  try {
    const [assetRows, agentRows] = await Promise.all([
      db.select({ id: assets.id, type: assets.type, name: assets.name, lat: assets.locationLat, lng: assets.locationLng, status: assets.status }).from(assets),
      db.select({ id: agents.id, name: agents.name, lat: agents.locationLat, lng: agents.locationLng, status: agents.status }).from(agents),
    ]);
    const features: Array<{ type: "Feature"; geometry: { type: "Point"; coordinates: [number, number] }; properties: Record<string, unknown> }> = [];
    for (const r of assetRows) {
      if (r.lat != null && r.lng != null) {
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [Number(r.lng), Number(r.lat)] },
          properties: { id: r.id, type: r.type, name: r.name, status: r.status, layer: "asset" },
        });
      }
    }
    for (const r of agentRows) {
      if (r.lat != null && r.lng != null) {
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [Number(r.lng), Number(r.lat)] },
          properties: { id: r.id, name: r.name, status: r.status, layer: "agent" },
        });
      }
    }
    return Response.json({ type: "FeatureCollection" as const, features });
  } catch (err) {
    console.error("GET /api/v1/field/map error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
