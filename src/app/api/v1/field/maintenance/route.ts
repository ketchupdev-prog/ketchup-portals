/**
 * POST /api/v1/field/maintenance – Log maintenance (field_tech); body includes asset_id.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { maintenanceLogs, assets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const assetId = body.asset_id;
    if (!assetId) return jsonError("asset_id is required", "ValidationError", { field: "asset_id" }, 400);
    const type = body.type ?? "inspection";
    const validTypes = ["inspection", "repair", "service", "replenish"];
    if (!validTypes.includes(type)) {
      return jsonError("type must be inspection, repair, service, or replenish", "ValidationError", { field: "type" }, 400);
    }
    const asset = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1).then((r) => r[0]);
    if (!asset) return jsonError("Asset not found", "NotFound", { asset_id: assetId }, 404);
    const [inserted] = await db
      .insert(maintenanceLogs)
      .values({
        assetId,
        technicianId: body.technician_id ?? null,
        type,
        notes: body.notes ?? null,
        cashBefore: body.cash_before != null ? String(body.cash_before) : null,
        cashAdded: body.cash_added != null ? String(body.cash_added) : null,
        cashAfter: body.cash_after != null ? String(body.cash_after) : null,
      })
      .returning({ id: maintenanceLogs.id, created_at: maintenanceLogs.createdAt });
    if (type === "replenish" && body.cash_after != null) {
      await db.update(assets).set({ cashLevel: String(body.cash_after), lastReplenishment: new Date() }).where(eq(assets.id, assetId));
    }
    return Response.json({ id: inserted.id, created_at: inserted.created_at.toISOString() }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/field/maintenance error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
