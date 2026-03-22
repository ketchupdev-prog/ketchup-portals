/**
 * GET /api/v1/vouchers – List vouchers (paginated, filterable).
 * Roles: ketchup_*, gov_* (RBAC enforced: vouchers.list permission).
 * Response shape: { data, meta, links } per docs/DATABASE_AND_API_DESIGN.md.
 */

import { NextRequest } from "next/server";
import { listVouchers } from "@/lib/services/voucher-service";
import {
  parsePagination,
  paginationLinks,
  jsonPaginated,
  jsonError,
} from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

const ROUTE_GET = "GET /api/v1/vouchers";
const basePath = "/api/v1/vouchers";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require vouchers.list permission (SEC-001)
    const auth = await requirePermission(request, "vouchers.list", ROUTE_GET);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const beneficiaryId = searchParams.get("beneficiary_id");
    const programmeId = searchParams.get("programme_id");

    const { data, totalRecords } = await listVouchers({
      page,
      limit,
      offset,
      filters: {
        ...(status && { status }),
        ...(beneficiaryId && { beneficiaryId }),
        ...(programmeId && { programmeId }),
      },
    });

    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const query: Record<string, string> = {};
    if (status) query.status = status;
    if (beneficiaryId) query.beneficiary_id = beneficiaryId;
    if (programmeId) query.programme_id = programmeId;
    const links = paginationLinks(basePath, page, limit, totalPages, query);

    return jsonPaginated(data, meta, links);
  } catch (err) {
    logger.error(ROUTE_GET, err instanceof Error ? err.message : "List vouchers error", {
      error: err,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE_GET);
  }
}
