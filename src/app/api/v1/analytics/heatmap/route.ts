/**
 * GET /api/v1/analytics/heatmap – Transaction heatmap data (by region/lat-lng).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { transactions, agents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  try {
    const rows = await db
      .select({
        lat: agents.locationLat,
        lng: agents.locationLng,
        count: sql<number>`count(${transactions.id})::int`,
      })
      .from(transactions)
      .innerJoin(agents, eq(transactions.agentId, agents.id))
      .groupBy(agents.locationLat, agents.locationLng);
    const data = rows
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => ({ lat: Number(r.lat), lng: Number(r.lng), count: r.count }));
    return Response.json({ data });
  } catch (err) {
    console.error("GET /api/v1/analytics/heatmap error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
