/**
 * POST /api/v1/auth/login – Login with email/password against portal_users.
 * Response: { access_token, token_type, expires_in } or 401.
 * Rate limited per IP (docs/SECURITY.md §4).
 */

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { portalUsers } from "@/db/schema";
import { jsonError } from "@/lib/api-response";
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
      return Response.json(
        { error: "Too many login attempts", code: "RateLimitExceeded" },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateBody(schemas.login, body);
    if (!validation.success) {
      return jsonError(validation.error, "ValidationError", validation.details, 400);
    }
    const { email, password } = validation.data;

    const [user] = await db
      .select({ id: portalUsers.id, email: portalUsers.email, role: portalUsers.role, passwordHash: portalUsers.passwordHash })
      .from(portalUsers)
      .where(eq(portalUsers.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      await logLoginAttempt({
        success: false,
        identifier: email,
        ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      });
      return jsonError("Invalid email or password", "Unauthorized", undefined, 401, ROUTE);
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      await logLoginAttempt({
        success: false,
        identifier: email,
        ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      });
      return jsonError("Invalid email or password", "Unauthorized", undefined, 401, ROUTE);
    }

    await db
      .update(portalUsers)
      .set({ lastLogin: new Date() })
      .where(eq(portalUsers.id, user.id));

    await logLoginAttempt({
      success: true,
      userId: user.id,
      ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null,
      userAgent: request.headers.get("user-agent") ?? null,
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
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
