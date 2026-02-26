/**
 * GET /api/v1/portal/duplicate-redemptions – List duplicate redemption events (PRD §3.3.11).
 * Query: status, programme_id, from, to, page, limit.
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

const ROUTE = "GET /api/v1/portal/duplicate-redemptions";
const basePath = "/api/v1/portal/duplicate-redemptions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const programmeId = searchParams.get("programme_id");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const { data, totalRecords } = await listDuplicateEvents({
      page,
      limit,
      offset,
      filters: {
        ...(status && { status: status as "advance_posted" | "under_review" | "no_financial_impact" | "agent_appealing" | "resolved" }),
        ...(programmeId && { programmeId }),
        ...(from && { from }),
        ...(to && { to }),
      },
    });

    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const query: Record<string, string> = {};
    if (status) query.status = status;
    if (programmeId) query.programme_id = programmeId;
    if (from) query.from = from;
    if (to) query.to = to;
    const links = paginationLinks(basePath, page, limit, totalPages, query);

    return jsonPaginated(data, meta, links);
  } catch (err) {
    logger.error(
      ROUTE,
      err instanceof Error ? err.message : "List duplicate redemptions error",
      { error: err }
    );
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
