/**
 * POST /api/v1/reconciliation/adjustment – Add manual adjustment (ketchup_finance).
 * Stub: can write to audit_logs or a reconciliation_adjustments table.
 */

import { NextRequest } from "next/server";
import { jsonError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const amount = body.amount;
    const reason = body.reason ?? "";
    if (amount == null || Number.isNaN(Number(amount))) {
      return jsonError("amount is required", "ValidationError", { field: "amount" }, 400);
    }
    return Response.json({ id: crypto.randomUUID(), amount: Number(amount), reason, created_at: new Date().toISOString() }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/reconciliation/adjustment error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
