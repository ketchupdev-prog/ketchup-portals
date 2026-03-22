/**
 * POST /api/v1/auth/register – Create portal user (email + bcrypt password).
 * Response: { data: { id, email, full_name, role } } or errors. Rate limited per IP.
 * Open Banking–aligned root object and error codes.
 */

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { portalUsers } from "@/db/schema";
import { jsonSuccess, jsonErrorOpenBanking } from "@/lib/api-response";
import { validateBody, schemas } from "@/lib/validate";
import { logger } from "@/lib/logger";
import { guardMutation } from "@/lib/api-security";

const ROUTE = "POST /api/v1/auth/register";
const REGISTER_RATE_LIMIT = 5;
const BCRYPT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const guard = guardMutation(request, {
      rateLimitKey: "auth:register",
      rateLimitMax: REGISTER_RATE_LIMIT,
      requireJsonBody: true,
      route: ROUTE,
    });
    if (!guard.ok) return guard.response;

    const body = await request.json().catch(() => ({}));
    const validation = validateBody(schemas.register, body);
    if (!validation.success) {
      return jsonErrorOpenBanking(
        validation.error,
        "ValidationError",
        400,
        { field: validation.details?.field as string }
      );
    }
    const { email, password, full_name, role } = validation.data;

    const [existing] = await db
      .select({ id: portalUsers.id })
      .from(portalUsers)
      .where(eq(portalUsers.email, email))
      .limit(1);

    if (existing) {
      return jsonErrorOpenBanking("Email already registered", "Conflict", 409, { route: ROUTE });
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

    if (!inserted) return jsonErrorOpenBanking("Registration failed", "InternalError", 500, { route: ROUTE });

    return jsonSuccess(
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
    return jsonErrorOpenBanking("Internal server error", "InternalError", 500, { route: ROUTE });
  }
}
