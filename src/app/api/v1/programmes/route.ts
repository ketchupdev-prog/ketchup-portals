/**
 * GET /api/v1/programmes – List programmes (gov).
 * Roles: ketchup_*, gov_* (RBAC enforced: programmes.list permission).
 * Response shape: { data, meta, links } per docs/DATABASE_AND_API_DESIGN.md.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { programmes } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const basePath = "/api/v1/programmes";
const GET_ROUTE = "GET /api/v1/programmes";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require programmes.list permission (SEC-001)
    const auth = await requirePermission(request, "programmes.list", GET_ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

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
    logger.error(GET_ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, GET_ROUTE);
  }
}

/**
 * POST /api/v1/programmes – Create programme.
 * Roles: gov_manager (RBAC enforced: programmes.list permission).
 * Secured: RBAC, rate limit, audit logging.
 */

import { jsonSuccess } from "@/lib/api-response";
import { getPortalSession } from "@/lib/portal-auth";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";

const POST_ROUTE = "POST /api/v1/programmes";

export async function POST(request: NextRequest) {
  try {
    // RBAC: Require programmes.list permission (SEC-001)
    const auth = await requirePermission(request, "programmes.list", POST_ROUTE);
    if (auth) return auth;

    // Rate limiting: Admin operation (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const name = body.name;
    if (!name || typeof name !== "string" || !name.trim()) {
      return jsonError("name is required", "ValidationError", { field: "name" }, 400, POST_ROUTE);
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

    if (!inserted) {
      return jsonError("Failed to create programme", "InternalError", undefined, 500, POST_ROUTE);
    }

    // Audit logging: Critical operation - government programme creation (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'programme.create',
        resourceType: 'programme',
        resourceId: inserted.id,
        metadata: {
          name: inserted.name,
          budget: body.allocated_budget?.toString() ?? null,
          startDate: body.start_date ?? null,
          endDate: body.end_date ?? null,
        },
      });
    }

    return jsonSuccess({ id: inserted.id, name: inserted.name }, { status: 201 });
  } catch (err) {
    logger.error(POST_ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, POST_ROUTE);
  }
}
