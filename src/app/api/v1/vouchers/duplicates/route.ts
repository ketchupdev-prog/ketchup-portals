/**
 * GET /api/v1/vouchers/duplicates – List duplicate redemption events (PRD §3.3.11).
 * Roles: ketchup_ops, ketchup_compliance, ketchup_finance.
 * Filters: status, from (ISO date), to (ISO date), page, limit.
 */

import { NextRequest } from "next/server";
import { listDuplicateEvents } from "@/lib/services/duplicate-redemption-service";
import {
  parsePagination,
  paginationLinks,
  jsonPaginated,
  jsonError,
} from "@/lib/api-response";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/vouchers/duplicates";
const basePath = "/api/v1/vouchers/duplicates";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const status = searchParams.get("status") as
      | "advance_posted"
      | "under_review"
      | "no_financial_impact"
      | "agent_appealing"
      | "resolved"
      | null;
    const programmeId = searchParams.get("programme_id");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const { data, totalRecords } = await listDuplicateEvents({
      page,
      limit,
      offset,
      filters: {
        ...(status && { status }),
        ...(programmeId && { programmeId }),
        ...(from && { from }),
        ...(to && { to }),
      },
    });

    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const query: Record<string, string> = {};
    if (status) query.status = status;
    if (from) query.from = from;
    if (to) query.to = to;
    const links = paginationLinks(basePath, page, limit, totalPages, query);

    return jsonPaginated(data, { totalRecords, totalPages, page, limit }, links);
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "List duplicates error", {
      error: err,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
