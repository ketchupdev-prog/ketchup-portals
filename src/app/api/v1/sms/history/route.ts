/**
 * GET /api/v1/sms/history – SMS history for a beneficiary (or all).
 * Roles: ketchup_ops (RBAC enforced: sms.view permission).
 * Security: RBAC, rate limiting.
 * Query: beneficiary_id (optional).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { smsQueue } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/sms/history";
const basePath = "/api/v1/sms/history";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require sms.view permission (SEC-001)
    const auth = await requirePermission(request, "sms.view", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

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
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
