/**
 * GET /api/v1/vouchers – List vouchers (paginated).
 * POST /api/v1/vouchers/issue – Issue single voucher (body: beneficiary_id, programme_id, amount, expiry_date).
 * Roles: ketchup_*, gov_* for GET; ketchup_ops for POST issue.
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

const ROUTE_GET = "GET /api/v1/vouchers";
const basePath = "/api/v1/vouchers";

export async function GET(request: NextRequest) {
  try {
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
