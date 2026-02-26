/**
 * GET /api/v1/programmes – List programmes (gov). POST – Create programme (gov_manager).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { programmes } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";

const basePath = "/api/v1/programmes";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const [rows, countRows] = await Promise.all([
      db.select().from(programmes).orderBy(desc(programmes.startDate)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(programmes),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const links = paginationLinks(basePath, page, limit, totalPages);
    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      allocated_budget: r.allocatedBudget,
      spent_to_date: r.spentToDate,
      start_date: r.startDate,
      end_date: r.endDate,
      verification_frequency_days: r.verificationFrequencyDays,
    }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    console.error("GET /api/v1/programmes error:", err);
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
      .insert(programmes)
      .values({
        name: name.trim(),
        description: body.description ?? null,
        allocatedBudget: body.allocated_budget ?? null,
        startDate: body.start_date ?? new Date().toISOString().slice(0, 10),
        endDate: body.end_date ?? new Date().toISOString().slice(0, 10),
        verificationFrequencyDays: body.verification_frequency_days ?? 90,
      })
      .returning({ id: programmes.id, name: programmes.name });
    if (!inserted) return jsonError("Failed to create programme", "InternalError", undefined, 500);
    return Response.json({ id: inserted.id, name: inserted.name }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/programmes error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
