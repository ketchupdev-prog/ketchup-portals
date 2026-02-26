/**
 * GET /api/v1/beneficiaries/:id – Get beneficiary details.
 * Roles: ketchup_*, gov_*
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
      .then((r) => r[0]);

    if (!row) {
      return jsonError("Beneficiary not found", "NotFound", { id }, 404);
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
    console.error("GET /api/v1/beneficiaries/[id] error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
