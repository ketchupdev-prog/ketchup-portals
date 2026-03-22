/**
 * POST /api/v1/mobile/open-banking/consent – Create consent / authorisation URL for Open Banking.
 * Auth: Session only (beneficiary initiates bank consent).
 * PRD §17.1, §17.2, §17.6. No mocks: calls Data Provider PAR or builds authorization URL from bank config.
 * Body: { bankId, scopes, redirectUri, state } (or data wrapper). Response: { data: { authorizationUrl?, requestUri?, state } } (§17.1).
 * When not configured: 503 OpenBankingNotConfigured. Rate limited (50/min per user).
 * Audit logged: bank.consent_requested (compliance tracking).
 */

import { NextRequest } from "next/server";
import { jsonSuccess, jsonErrors, metaWithImplementationConfidence, jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { getPortalSession } from "@/lib/portal-auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { parseRootData } from "@/lib/open-banking";
import { createConsentWithProvider, OpenBankingNotConfigured } from "@/lib/open-banking-client";
import { saveOAuthState } from "@/lib/integrations/buffr/persistence";
import { z } from "zod";

const ROUTE = "POST /api/v1/mobile/open-banking/consent";

const consentBodySchema = z.object({
  bankId: z.string().min(1, "bankId required"),
  scopes: z.array(z.string()).min(1, "scopes required"),
  redirectUri: z.string().url("redirectUri must be a valid URL"),
  state: z.string().min(1, "state required"),
  codeVerifier: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Session authentication: Verify beneficiary is logged in (SEC-001)
    const session = getPortalSession(request);
    if (!session) {
      return jsonError("Unauthorized", "Unauthorized", undefined, 401, ROUTE);
    }

    // Rate limiting: ADMIN preset (50/min per user) (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const parsed = parseRootData<Record<string, unknown>>(body);
    const raw =
      !("error" in parsed) && parsed.data != null && typeof parsed.data === "object"
        ? (parsed.data as Record<string, unknown>)
        : (body as Record<string, unknown>);

    const result = consentBodySchema.safeParse(raw);
    if (!result.success) {
      const first = result.error.issues[0];
      return jsonErrors(
        [{ code: "ValidationError", message: first?.message ?? "Validation failed", field: first?.path?.join(".") as string }],
        400
      );
    }

    const consent = await createConsentWithProvider({
      bankId: result.data.bankId,
      scopes: result.data.scopes,
      redirectUri: result.data.redirectUri,
      state: result.data.state,
      codeVerifier: result.data.codeVerifier,
    });

    await saveOAuthState({
      state: result.data.state,
      bankId: result.data.bankId,
      redirectUri: result.data.redirectUri,
      codeVerifier: result.data.codeVerifier ?? null,
    });

    // Audit logging: Track open banking consent request for compliance (SEC-002)
    await createAuditLogFromRequest(request, session, {
      action: 'bank.consent_requested',
      resourceType: 'bank_consent',
      resourceId: result.data.state,
      metadata: {
        bankId: result.data.bankId,
        scopes: result.data.scopes,
        redirectUri: result.data.redirectUri,
      },
    });

    return jsonSuccess(
      { authorizationUrl: consent.authorizationUrl, requestUri: consent.requestUri, state: consent.state },
      { meta: metaWithImplementationConfidence(), status: 200 }
    );
  } catch (err) {
    if (err instanceof OpenBankingNotConfigured) {
      return jsonErrors(
        [{ code: "ServiceUnavailable", title: "Open Banking not configured", message: err.message }],
        503,
        { route: ROUTE }
      );
    }
    logger.error(ROUTE, err instanceof Error ? err.message : "Consent error", { error: err });
    return jsonErrors(
      [{ code: "InternalError", message: err instanceof Error ? err.message : "Unable to create consent." }],
      err instanceof Error && err.message.includes("not found") ? 404 : 500,
      { route: ROUTE }
    );
  }
}
