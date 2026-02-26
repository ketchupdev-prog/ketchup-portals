/**
 * POST /api/v1/auth/register – Create portal user (email + bcrypt password).
 * Response: { id, email, full_name, role } or error. Rate limited per IP.
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

const ROUTE = "POST /api/v1/auth/register";
const REGISTER_RATE_LIMIT = 5;
const BCRYPT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const key = getClientKey(request);
    const { allowed, resetAt } = checkRateLimit(`register:${key}`, REGISTER_RATE_LIMIT);
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return Response.json(
        { error: "Too many registration attempts", code: "RateLimitExceeded" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateBody(schemas.register, body);
    if (!validation.success) {
      return jsonError(validation.error, "ValidationError", validation.details, 400);
    }
    const { email, password, full_name, role } = validation.data;

    const [existing] = await db
      .select({ id: portalUsers.id })
      .from(portalUsers)
      .where(eq(portalUsers.email, email))
      .limit(1);

    if (existing) {
      return jsonError("Email already registered", "Conflict", undefined, 409, ROUTE);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [inserted] = await db
      .insert(portalUsers)
      .values({
        email,
        passwordHash,
        fullName: full_name,
        role,
      })
      .returning({ id: portalUsers.id, email: portalUsers.email, fullName: portalUsers.fullName, role: portalUsers.role });

    if (!inserted) return jsonError("Registration failed", "InternalError", undefined, 500, ROUTE);

    return Response.json(
      {
        id: inserted.id,
        email: inserted.email,
        full_name: inserted.fullName,
        role: inserted.role,
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
