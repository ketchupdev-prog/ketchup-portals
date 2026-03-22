/**
 * GET /api/v1/incidents – List security incidents.
 * POST /api/v1/incidents – Create security incident.
 * Roles: ketchup_compliance, ketchup_ops, field_lead (RBAC enforced: incidents.manage permission).
 * Security: RBAC, rate limiting, audit logging (POST only).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { incidents } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getPortalSession } from "@/lib/portal-auth";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { logger } from "@/lib/logger";

const GET_ROUTE = "GET /api/v1/incidents";
const POST_ROUTE = "POST /api/v1/incidents";
const basePath = "/api/v1/incidents";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require incidents.manage permission (SEC-001)
    const auth = await requirePermission(request, "incidents.manage", GET_ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

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
    logger.error(GET_ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, GET_ROUTE);
  }
}

export async function POST(request: NextRequest) {
  try {
    // RBAC: Require incidents.manage permission (SEC-001)
    const auth = await requirePermission(request, "incidents.manage", POST_ROUTE);
    if (auth) return auth;

    // Rate limiting: Admin endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const title = body.title;
    if (!title || typeof title !== "string" || !title.trim()) {
      return jsonError("title is required", "ValidationError", { field: "title" }, 400, POST_ROUTE);
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
    if (!inserted) return jsonError("Failed to create incident", "InternalError", undefined, 500, POST_ROUTE);

    // Audit logging: Security incident reported (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'compliance.incident_reported',
        resourceType: 'incident',
        resourceId: inserted.id,
        metadata: {
          title: inserted.title,
          status: inserted.status,
          severity: body.severity ?? null,
        },
      });
    }

    return Response.json({ id: inserted.id, title: inserted.title, status: inserted.status }, { status: 201 });
  } catch (err) {
    logger.error(POST_ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, POST_ROUTE);
  }
}
