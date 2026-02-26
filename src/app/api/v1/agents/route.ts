/**
 * GET /api/v1/agents – List agents. POST – Create agent.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/db/schema";
import { desc, eq, sql, and, ilike } from "drizzle-orm";
import {
  parsePagination,
  paginationLinks,
  jsonPaginated,
  jsonError,
} from "@/lib/api-response";

const basePath = "/api/v1/agents";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const region = searchParams.get("region"); // filter by address/region if needed

    const conditions = [];
    if (status) conditions.push(eq(agents.status, status));
    if (region) conditions.push(ilike(agents.address, `%${region}%`));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(agents)
        .where(whereClause)
        .orderBy(desc(agents.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(agents)
        .where(whereClause),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const query: Record<string, string> = {};
    if (status) query.status = status;
    if (region) query.region = region;
    const links = paginationLinks(basePath, page, limit, totalPages, query);

    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      location_lat: r.locationLat,
      location_lng: r.locationLng,
      address: r.address,
      contact_phone: r.contactPhone,
      contact_email: r.contactEmail,
      commission_rate: r.commissionRate,
      float_balance: r.floatBalance,
      status: r.status,
      created_at: r.createdAt.toISOString(),
    }));

    return jsonPaginated(data, meta, links);
  } catch (err) {
    console.error("GET /api/v1/agents error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = body.name;
    if (!name || typeof name !== "string" || !name.trim()) {
      return jsonError("name is required", "ValidationError", { field: "name" }, 400);
    }
    const [inserted] = await db
      .insert(agents)
      .values({
        name: name.trim(),
        address: body.address ?? null,
        contactPhone: body.contact_phone ?? body.contactPhone ?? null,
        contactEmail: body.contact_email ?? body.contactEmail ?? null,
        commissionRate: body.commission_rate ?? body.commissionRate ?? null,
        status: body.status ?? "active",
      })
      .returning({ id: agents.id, name: agents.name, status: agents.status });
    if (!inserted) return jsonError("Failed to create agent", "InternalError", undefined, 500);
    return Response.json({ id: inserted.id, name: inserted.name, status: inserted.status }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/agents error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
