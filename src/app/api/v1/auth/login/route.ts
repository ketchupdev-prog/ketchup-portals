/**
 * POST /api/v1/auth/login – Login with email/password against portal_users.
 * Response: { data: { access_token, token_type, expires_in } } or errors. Rate limited per IP (docs/SECURITY.md §4).
 * Open Banking–aligned: 429 with { errors } and Retry-After.
 */

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { portalUsers } from "@/db/schema";
import { jsonSuccess, jsonErrors } from "@/lib/api-response";
import { validateBody, schemas } from "@/lib/validate";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { portalAuthCookieValue } from "@/lib/portal-auth";
import { logLoginAttempt } from "@/lib/audit-log";

const ROUTE = "POST /api/v1/auth/login";
const LOGIN_RATE_LIMIT = 10; // requests per minute per IP
const TOKEN_EXPIRY_SEC = 3600;

export async function POST(request: NextRequest) {
  try {
    const key = getClientKey(request);
    const { allowed, resetAt } = checkRateLimit(`login:${key}`, LOGIN_RATE_LIMIT);
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return jsonErrors(
        [
          {
            code: "RateLimitExceeded",
            title: "Too Many Requests",
            message: "Too many login attempts. Retry after the time indicated in Retry-After header.",
          },
        ],
        429,
        { retryAfter }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateBody(schemas.login, body);
    if (!validation.success) {
      return Response.json(
        {
          errors: [
            {
              code: "ValidationError",
              message: validation.error,
              field: validation.details?.field,
            },
          ],
        },
        { status: 400 }
      );
    }
    const { email, password } = validation.data;

    const [user] = await db
      .select({ 
        id: portalUsers.id, 
        email: portalUsers.email, 
        role: portalUsers.role, 
        passwordHash: portalUsers.passwordHash,
        totpEnabled: portalUsers.totpEnabled,
      })
      .from(portalUsers)
      .where(eq(portalUsers.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      await logLoginAttempt({
        success: false,
        identifier: email,
        ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      return Response.json(
        { errors: [{ code: "Unauthorized", message: "Invalid email or password" }] },
        { status: 401 }
      );
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      await logLoginAttempt({
        success: false,
        identifier: email,
        ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      return Response.json(
        { errors: [{ code: "Unauthorized", message: "Invalid email or password" }] },
        { status: 401 }
      );
    }

    // Check if user has 2FA enabled
    if (user.totpEnabled) {
      // Password correct, but 2FA required - don't create session yet
      await logLoginAttempt({
        success: false, // Not fully logged in yet (needs 2FA)
        userId: user.id,
        ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });

      // Return 2FA challenge response
      return Response.json(
        {
          requires2FA: true,
          userId: user.id,
          message: "2FA verification required. Please provide your 6-digit code.",
        },
        { status: 200 }
      );
    }

    // No 2FA required - proceed with normal login
    await db
      .update(portalUsers)
      .set({ lastLogin: new Date() })
      .where(eq(portalUsers.id, user.id));

    await logLoginAttempt({
      success: true,
      userId: user.id,
      ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    const exp = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SEC;
    const payload = { sub: user.id, email: user.email, role: user.role, exp };
    const access_token = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");

    const response = Response.json({
      access_token,
      token_type: "Bearer",
      expires_in: TOKEN_EXPIRY_SEC,
    });
    response.headers.set("Set-Cookie", portalAuthCookieValue(access_token, TOKEN_EXPIRY_SEC));
    return response;
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return Response.json(
      { errors: [{ code: "InternalError", message: "Internal server error" }] },
      { status: 500 }
    );
  }
}
