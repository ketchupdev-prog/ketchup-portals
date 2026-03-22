/**
 * POST /api/v1/mobile/open-banking/token-exchange – Exchange auth code for access token (OAuth 2.0).
 * Auth: Session only (beneficiary completes OAuth flow).
 * PRD §17.1, §17.2, §17.6. No mocks: backend calls Data Provider token endpoint with mTLS + Open Banking headers.
 * Body: { bankId, code, redirectUri, codeVerifier? }. Response: { data: { access_token, token_type, expires_in, refresh_token? } } (§17.1).
 * When not configured: 503 OpenBankingNotConfigured. Rate limited (50/min per user).
 * Audit logged: bank.token_exchanged (track successful bank connections).
 */

import { NextRequest } from "next/server";
import { jsonSuccess, jsonErrors, metaWithImplementationConfidence, jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { getPortalSession } from "@/lib/portal-auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { parseRootData } from "@/lib/open-banking";
import { exchangeCodeWithProvider, OpenBankingNotConfigured } from "@/lib/open-banking-client";
import { z } from "zod";

const ROUTE = "POST /api/v1/mobile/open-banking/token-exchange";

const tokenBodySchema = z.object({
  bankId: z.string().min(1, "bankId required"),
  code: z.string().min(1, "code required"),
  redirectUri: z.string().url("redirectUri required"),
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

    const result = tokenBodySchema.safeParse(raw);
    if (!result.success) {
      const first = result.error.issues[0];
      return jsonErrors(
        [{ code: "ValidationError", message: first?.message ?? "Validation failed", field: first?.path?.join(".") as string }],
        400
      );
    }

    const tokens = await exchangeCodeWithProvider({
      bankId: result.data.bankId,
      code: result.data.code,
      redirectUri: result.data.redirectUri,
      codeVerifier: result.data.codeVerifier,
    });

    // Audit logging: Track successful bank connection for compliance (SEC-002)
    await createAuditLogFromRequest(request, session, {
      action: 'bank.token_exchanged',
      resourceType: 'bank_consent',
      metadata: {
        bankId: result.data.bankId,
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in,
        hasRefreshToken: !!tokens.refresh_token,
      },
    });

    return jsonSuccess(
      {
        linked: true,
        access_token: tokens.access_token,
        token_type: tokens.token_type,
        expires_in: tokens.expires_in,
        refresh_token: tokens.refresh_token,
      },
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
    logger.error(ROUTE, err instanceof Error ? err.message : "Token exchange error", { error: err });
    return jsonErrors(
      [{ code: "InternalError", message: err instanceof Error ? err.message : "Unable to exchange token." }],
      500,
      { route: ROUTE }
    );
  }
}
