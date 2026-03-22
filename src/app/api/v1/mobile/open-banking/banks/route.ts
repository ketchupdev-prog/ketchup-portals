/**
 * GET /api/v1/mobile/open-banking/banks – List banks (Data Providers) for Open Banking consent.
 * Auth: Session only (beneficiary browses available banks).
 * PRD §17.1, §17.2, §17.6. No mocks: returns banks from Open Banking directory or OPEN_BANKING_BANKS_JSON.
 * Response: { data: Array<{ id, name, logoUrl?, authorizationEndpoint?, tokenEndpoint?, parEndpoint? }> } (§17.1 data/links/meta).
 * When not configured: 503 OpenBankingNotConfigured. Rate limited (200/min per IP).
 */

import { NextRequest } from "next/server";
import { jsonSuccess, jsonErrors, metaWithImplementationConfidence, jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { getPortalSession } from "@/lib/portal-auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getBanksFromProvider, OpenBankingNotConfigured } from "@/lib/open-banking-client";

const ROUTE = "GET /api/v1/mobile/open-banking/banks";

export async function GET(request: NextRequest) {
  try {
    // Session authentication: Verify beneficiary is logged in (SEC-001)
    const session = getPortalSession(request);
    if (!session) {
      return jsonError("Unauthorized", "Unauthorized", undefined, 401, ROUTE);
    }

    // Rate limiting: READ_ONLY preset (200/min per IP) (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const list = await getBanksFromProvider();
    return jsonSuccess(list, { meta: metaWithImplementationConfidence(), status: 200 });
  } catch (err) {
    if (err instanceof OpenBankingNotConfigured) {
      return jsonErrors(
        [{ code: "ServiceUnavailable", title: "Open Banking not configured", message: err.message }],
        503,
        { route: ROUTE }
      );
    }
    logger.error(ROUTE, err instanceof Error ? err.message : "List banks error", { error: err });
    return jsonErrors(
      [{ code: "InternalError", message: "Unable to list banks." }],
      500,
      { route: ROUTE }
    );
  }
}
