/**
 * GET /api/v1/beneficiaries/:id – Get beneficiary details.
 * Roles: ketchup_*, gov_* (RBAC enforced: beneficiaries.list permission).
 * Response shape: Single beneficiary record with all fields.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/beneficiaries/[id]";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require beneficiaries.list permission (SEC-001)
    const auth = await requirePermission(request, "beneficiaries.list", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const row = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
      .then((r) => r[0]);

    if (!row) {
      return jsonError("Beneficiary not found", "NotFound", { id }, 404, ROUTE);
    }

    return Response.json({
      id: row.id,
      phone: row.phone,
      full_name: row.fullName,
      id_number: row.idNumber,
      date_of_birth: row.dateOfBirth,
      region: row.region,
      wallet_status: row.walletStatus,
      proof_of_life_due_date: row.proofOfLifeDueDate?.toISOString() ?? null,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Get beneficiary error", {
      error: err,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
