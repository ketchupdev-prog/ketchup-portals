/**
 * GET /api/v1/agents – List agents (paginated, filterable).
 * POST /api/v1/agents – Create agent.
 * Roles: ketchup_* (RBAC enforced: agents.list permission).
 * Secured: RBAC, rate limiting, audit logging (POST only).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/db/schema";
import { desc, eq, sql, and, ilike } from "drizzle-orm";
import {
  parsePagination,
  paginationLinks,
  jsonPaginated,
  jsonError,
  jsonSuccess,
} from "@/lib/api-response";
import { isValidRegion, normalizeRegion } from "@/lib/regions";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { getPortalSession } from "@/lib/portal-auth";
import { logger } from "@/lib/logger";

const basePath = "/api/v1/agents";
const ROUTE_GET = "GET /api/v1/agents";
const ROUTE_POST = "POST /api/v1/agents";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require agents.list permission (SEC-001)
    const auth = await requirePermission(request, "agents.list", ROUTE_GET);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const regionParam = searchParams.get("region");

    const region = regionParam
      ? (isValidRegion(regionParam) ? normalizeRegion(regionParam)! : null)
      : undefined;
    if (regionParam != null && regionParam !== "" && !region) {
      return jsonError("Invalid region", "ValidationError", undefined, 400, ROUTE_GET);
    }

    const conditions = [];
    if (status) conditions.push(eq(agents.status, status));
    if (region) conditions.push(ilike(agents.address, `%${region}%`));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(agents)
        .where(whereClause)
        .orderBy(desc(agents.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(agents)
        .where(whereClause),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const query: Record<string, string> = {};
    if (status) query.status = status;
    if (region) query.region = region;
    const links = paginationLinks(basePath, page, limit, totalPages, query);

    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      location_lat: r.locationLat,
      location_lng: r.locationLng,
      address: r.address,
      contact_phone: r.contactPhone,
      contact_email: r.contactEmail,
      commission_rate: r.commissionRate,
      float_balance: r.floatBalance,
      status: r.status,
      created_at: r.createdAt.toISOString(),
    }));

    return jsonPaginated(data, meta, links);
  } catch (err) {
    logger.error(ROUTE_GET, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE_GET);
  }
}

export async function POST(request: NextRequest) {
  try {
    // RBAC: Require agents.list permission (SEC-001)
    const auth = await requirePermission(request, "agents.list", ROUTE_POST);
    if (auth) return auth;

    // Rate limiting: Admin mutation endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const name = body.name;
    if (!name || typeof name !== "string" || !name.trim()) {
      return jsonError("name is required", "ValidationError", { field: "name" }, 400, ROUTE_POST);
    }

    const [inserted] = await db
      .insert(agents)
      .values({
        name: name.trim(),
        address: body.address ?? null,
        contactPhone: body.contact_phone ?? body.contactPhone ?? null,
        contactEmail: body.contact_email ?? body.contactEmail ?? null,
        commissionRate: body.commission_rate ?? body.commissionRate ?? null,
        status: body.status ?? "active",
      })
      .returning({ id: agents.id, name: agents.name, status: agents.status });
    
    if (!inserted) {
      return jsonError("Failed to create agent", "InternalError", undefined, 500, ROUTE_POST);
    }

    // Audit logging: Agent creation (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'agent.create',
        resourceType: 'agent',
        resourceId: inserted.id,
        metadata: {
          name: inserted.name,
          status: inserted.status,
          address: body.address,
          contactPhone: body.contact_phone ?? body.contactPhone,
          contactEmail: body.contact_email ?? body.contactEmail,
        },
      });
    }

    return jsonSuccess(
      { id: inserted.id, name: inserted.name, status: inserted.status },
      { status: 201 }
    );
  } catch (err) {
    logger.error(ROUTE_POST, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE_POST);
  }
}
