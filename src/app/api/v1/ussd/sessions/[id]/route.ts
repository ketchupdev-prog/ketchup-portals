/**
 * GET /api/v1/ussd/sessions/:id – USSD session detail.
 * Roles: ketchup_ops (RBAC enforced: ussd.view permission).
 * Security: RBAC, rate limiting.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ussdSessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/ussd/sessions/[id]";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require ussd.view permission (SEC-001)
    const auth = await requirePermission(request, "ussd.view", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const row = await db
      .select({
        session: ussdSessions,
        fullName: users.fullName,
        phone: users.phone,
      })
      .from(ussdSessions)
      .leftJoin(users, eq(ussdSessions.userId, users.id))
      .where(eq(ussdSessions.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!row) return jsonError("Session not found", "NotFound", { id }, 404, ROUTE);
    const s = row.session;
    return Response.json({
      id: s.id,
      user_id: s.userId,
      full_name: row.fullName,
      phone: row.phone,
      session_data: s.sessionData,
      created_at: s.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
