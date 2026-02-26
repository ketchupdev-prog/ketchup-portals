/**
 * GET /api/v1/terminals – List POS terminals. POST – Add terminal.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { posTerminals } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import {
  parsePagination,
  paginationLinks,
  jsonPaginated,
  jsonError,
} from "@/lib/api-response";

const basePath = "/api/v1/terminals";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const conditions = [];
    if (status) conditions.push(eq(posTerminals.status, status));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(posTerminals)
        .where(whereClause)
        .orderBy(desc(posTerminals.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(posTerminals).where(whereClause),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const links = paginationLinks(basePath, page, limit, totalPages, status ? { status } : undefined);
    const data = rows.map((r) => ({
      id: r.id,
      device_id: r.deviceId,
      model: r.model,
      status: r.status,
      assigned_agent_id: r.assignedAgentId,
      last_ping: r.lastPing?.toISOString() ?? null,
      software_version: r.softwareVersion,
      created_at: r.createdAt.toISOString(),
    }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    console.error("GET /api/v1/terminals error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const deviceId = body.device_id ?? body.deviceId;
    if (!deviceId || typeof deviceId !== "string" || !deviceId.trim()) {
      return jsonError("device_id is required", "ValidationError", { field: "device_id" }, 400);
    }
    const [inserted] = await db
      .insert(posTerminals)
      .values({
        deviceId: deviceId.trim(),
        model: body.model ?? null,
        status: body.status ?? "active",
        softwareVersion: body.software_version ?? null,
      })
      .returning({ id: posTerminals.id, device_id: posTerminals.deviceId, status: posTerminals.status });
    if (!inserted) return jsonError("Failed to create terminal", "InternalError", undefined, 500);
    return Response.json(
      { id: inserted.id, device_id: inserted.device_id, status: inserted.status },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/v1/terminals error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
