/**
 * GET /api/v1/incidents – List incidents. POST – Create incident (ketchup_compliance).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { incidents } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";

const basePath = "/api/v1/incidents";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const conditions = [];
    if (status) conditions.push(eq(incidents.status, status));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(incidents)
        .where(whereClause)
        .orderBy(desc(incidents.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(incidents).where(whereClause),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const links = paginationLinks(basePath, page, limit, totalPages, status ? { status } : undefined);
    const data = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      severity: r.severity,
      reported_by: r.reportedBy,
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
    }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    console.error("GET /api/v1/incidents error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const title = body.title;
    if (!title || typeof title !== "string" || !title.trim()) {
      return jsonError("title is required", "ValidationError", { field: "title" }, 400);
    }
    const [inserted] = await db
      .insert(incidents)
      .values({
        title: title.trim(),
        description: body.description ?? null,
        status: body.status ?? "open",
        severity: body.severity ?? null,
        reportedBy: body.reported_by ?? null,
      })
      .returning({ id: incidents.id, title: incidents.title, status: incidents.status });
    if (!inserted) return jsonError("Failed to create incident", "InternalError", undefined, 500);
    return Response.json({ id: inserted.id, title: inserted.title, status: inserted.status }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/incidents error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
