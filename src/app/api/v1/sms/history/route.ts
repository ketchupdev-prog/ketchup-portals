/**
 * GET /api/v1/sms/history – SMS history for a beneficiary (or all).
 * Query: beneficiary_id (optional). Roles: ketchup_support (no RBAC yet).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { smsQueue } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";

const basePath = "/api/v1/sms/history";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const beneficiaryId = searchParams.get("beneficiary_id");

    const whereClause = beneficiaryId
      ? eq(smsQueue.referenceId, beneficiaryId)
      : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(smsQueue)
        .where(whereClause)
        .orderBy(desc(smsQueue.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(smsQueue)
        .where(whereClause),
    ]);

    const totalRecords = (countRows[0] as { count: number } | undefined)?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const query: Record<string, string> = {};
    if (beneficiaryId) query.beneficiary_id = beneficiaryId;
    const links = paginationLinks(basePath, page, limit, totalPages, query);

    const data = rows.map((r) => ({
      id: r.id,
      recipient_phone: r.recipientPhone,
      message: r.message,
      status: r.status,
      provider_message_id: r.providerMessageId,
      reference_id: r.referenceId,
      reference_type: r.referenceType,
      attempts: r.attempts,
      created_at: r.createdAt.toISOString(),
      sent_at: r.sentAt?.toISOString() ?? null,
      delivered_at: r.deliveredAt?.toISOString() ?? null,
      error_message: r.errorMessage,
    }));

    return jsonPaginated(data, meta, links);
  } catch (err) {
    console.error("GET /api/v1/sms/history error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
