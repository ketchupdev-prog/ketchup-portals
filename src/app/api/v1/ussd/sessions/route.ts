/**
 * GET /api/v1/ussd/sessions – List USSD sessions.
 * Roles: ketchup_ops (RBAC enforced: ussd.view permission).
 * Security: RBAC, rate limiting.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ussdSessions, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/ussd/sessions";
const basePath = "/api/v1/ussd/sessions";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require ussd.view permission (SEC-001)
    const auth = await requirePermission(request, "ussd.view", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const userId = searchParams.get("user_id");

    const [rows, countRows] = await Promise.all([
      db
        .select({
          id: ussdSessions.id,
          userId: ussdSessions.userId,
          sessionData: ussdSessions.sessionData,
          createdAt: ussdSessions.createdAt,
          fullName: users.fullName,
          phone: users.phone,
        })
        .from(ussdSessions)
        .leftJoin(users, eq(ussdSessions.userId, users.id))
        .where(userId ? eq(ussdSessions.userId, userId) : undefined)
        .orderBy(desc(ussdSessions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(ussdSessions)
        .where(userId ? eq(ussdSessions.userId, userId) : undefined),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const links = paginationLinks(basePath, page, limit, totalPages, userId ? { user_id: userId } : undefined);
    const data = rows.map((r) => ({
      id: r.id,
      user_id: r.userId,
      full_name: r.fullName,
      phone: r.phone,
      session_data: r.sessionData,
      created_at: r.createdAt.toISOString(),
    }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
