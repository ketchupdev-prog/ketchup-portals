/**
 * GET /api/v1/field/assets – List assets (field_tech, field_lead).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assets } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";

const basePath = "/api/v1/field/assets";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const conditions = [];
    if (status) conditions.push(eq(assets.status, status));
    if (type) conditions.push(eq(assets.type, type));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [rows, countRows] = await Promise.all([
      db.select().from(assets).where(whereClause).orderBy(desc(assets.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(assets).where(whereClause),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const query: Record<string, string> = {};
    if (status) query.status = status;
    if (type) query.type = type;
    const links = paginationLinks(basePath, page, limit, totalPages, query);
    const data = rows.map((r) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      location_lat: r.locationLat,
      location_lng: r.locationLng,
      status: r.status,
      cash_level: r.cashLevel,
      last_replenishment: r.lastReplenishment?.toISOString() ?? null,
      driver: r.driver,
      created_at: r.createdAt.toISOString(),
    }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    console.error("GET /api/v1/field/assets error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
