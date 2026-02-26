/**
 * POST /api/v1/field/route – Generate simple route (stub).
 */

import { NextRequest } from "next/server";
import { jsonError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const waypoints = body.waypoints ?? [];
    return Response.json({ route_id: crypto.randomUUID(), waypoints, distance_km: 0, duration_mins: 0 });
  } catch (err) {
    console.error("POST /api/v1/field/route error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
