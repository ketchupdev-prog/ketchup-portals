/**
 * GET /api/v1/beneficiaries – List beneficiaries (paginated, filterable).
 * Roles: ketchup_*, gov_* (auth enforced when wired to Supabase).
 * Response shape: { data, meta, links } per docs/DATABASE_AND_API_DESIGN.md.
 */

import { NextRequest } from "next/server";
import { listBeneficiaries } from "@/lib/services/beneficiary-service";
import {
  parsePagination,
  paginationLinks,
  jsonPaginated,
  jsonError,
} from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { isValidRegion, normalizeRegion } from "@/lib/regions";

const ROUTE = "GET /api/v1/beneficiaries";
const basePath = "/api/v1/beneficiaries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const regionParam = searchParams.get("region");

    const region = regionParam
      ? (isValidRegion(regionParam) ? normalizeRegion(regionParam)! : null)
      : undefined;
    if (regionParam != null && regionParam !== "" && !region) {
      return jsonError("Invalid region", "ValidationError", undefined, 400, ROUTE);
    }

    const { data, totalRecords } = await listBeneficiaries({
      page,
      limit,
      offset,
      filters: {
        ...(status && { status }),
        ...(region && { region }),
      },
    });

    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const query: Record<string, string> = {};
    if (status) query.status = status;
    if (region) query.region = region;
    const links = paginationLinks(basePath, page, limit, totalPages, query);

    return jsonPaginated(data, meta, links);
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "List beneficiaries error", {
      error: err,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
