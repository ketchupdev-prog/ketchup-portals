/**
 * GET /api/v1/assets – List assets (mobile units/ATMs, paginated, filterable).
 * POST /api/v1/assets – Create new asset.
 * Roles: ketchup_ops, field_tech, field_lead (RBAC enforced: assets.manage permission).
 * Secured: RBAC, rate limit, audit logging (mutations only).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assets } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import {
  parsePagination,
  paginationLinks,
  jsonPaginated,
  jsonError,
  jsonSuccess,
} from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { getPortalSession } from "@/lib/portal-auth";
import { logger } from "@/lib/logger";

const basePath = "/api/v1/assets";
const ROUTE_GET = "GET /api/v1/assets";
const ROUTE_POST = "POST /api/v1/assets";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require assets.manage permission (SEC-001)
    const auth = await requirePermission(request, "assets.manage", ROUTE_GET);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const conditions = [];
    if (status) conditions.push(eq(assets.status, status));
    if (type) conditions.push(eq(assets.type, type));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(assets)
        .where(whereClause)
        .orderBy(desc(assets.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(assets).where(whereClause),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const query: Record<string, string> = {};
    if (status) query.status = status;
    if (type) query.type = type;
    const links = paginationLinks(basePath, page, limit, totalPages, query);
    const data = rows.map((r) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      location_lat: r.locationLat,
      location_lng: r.locationLng,
      status: r.status,
      cash_level: r.cashLevel,
      last_replenishment: r.lastReplenishment?.toISOString() ?? null,
      driver: r.driver,
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
    // RBAC: Require assets.manage permission (SEC-001)
    const auth = await requirePermission(request, "assets.manage", ROUTE_POST);
    if (auth) return auth;

    // Rate limiting: Admin mutation (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const name = body.name;
    const type = body.type ?? "mobile_unit";
    if (!name || typeof name !== "string" || !name.trim()) {
      return jsonError("name is required", "ValidationError", { field: "name" }, 400, ROUTE_POST);
    }
    const [inserted] = await db
      .insert(assets)
      .values({
        name: name.trim(),
        type: ["mobile_unit", "atm", "warehouse"].includes(type) ? type : "mobile_unit",
        status: body.status ?? "active",
        driver: body.driver ?? null,
      })
      .returning({ id: assets.id, name: assets.name, type: assets.type, status: assets.status });
    if (!inserted) return jsonError("Failed to create asset", "InternalError", undefined, 500, ROUTE_POST);

    // Audit logging: Asset creation (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: "field.asset_update",
        resourceType: "asset",
        resourceId: inserted.id,
        metadata: {
          type: "create",
          assetName: inserted.name,
          assetType: inserted.type,
          status: inserted.status,
        },
      });
    }

    return jsonSuccess(
      { id: inserted.id, name: inserted.name, type: inserted.type, status: inserted.status },
      { status: 201 }
    );
  } catch (err) {
    logger.error(ROUTE_POST, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE_POST);
  }
}
