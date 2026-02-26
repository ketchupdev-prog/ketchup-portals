/**
 * GET /api/v1/assets/:id/maintenance-logs – List maintenance logs.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { maintenanceLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";
import { sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(maintenanceLogs)
        .where(eq(maintenanceLogs.assetId, id))
        .orderBy(desc(maintenanceLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(maintenanceLogs)
        .where(eq(maintenanceLogs.assetId, id)),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const links = paginationLinks(`/api/v1/assets/${id}/maintenance-logs`, page, limit, totalPages);
    const data = rows.map((r) => ({
      id: r.id,
      type: r.type,
      notes: r.notes,
      cash_before: r.cashBefore,
      cash_added: r.cashAdded,
      cash_after: r.cashAfter,
      created_at: r.createdAt.toISOString(),
    }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    console.error("GET /api/v1/assets/[id]/maintenance-logs error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
