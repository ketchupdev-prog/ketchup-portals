/**
 * POST /api/v1/assets/:id/maintenance – Log maintenance (field_tech).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { maintenanceLogs, assets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const type = body.type ?? "inspection";
    const validTypes = ["inspection", "repair", "service", "replenish"];
    if (!validTypes.includes(type)) {
      return jsonError("type must be inspection, repair, service, or replenish", "ValidationError", { field: "type" }, 400);
    }
    const asset = await db.select().from(assets).where(eq(assets.id, id)).limit(1).then((r) => r[0]);
    if (!asset) return jsonError("Asset not found", "NotFound", { id }, 404);

    const cashBefore = body.cash_before != null ? String(body.cash_before) : null;
    const cashAdded = body.cash_added != null ? String(body.cash_added) : null;
    const cashAfter = body.cash_after != null ? String(body.cash_after) : null;

    const [inserted] = await db
      .insert(maintenanceLogs)
      .values({
        assetId: id,
        technicianId: body.technician_id ?? null,
        type,
        notes: body.notes ?? null,
        cashBefore,
        cashAdded,
        cashAfter,
      })
      .returning({ id: maintenanceLogs.id, created_at: maintenanceLogs.createdAt });

    if (type === "replenish" && cashAfter != null) {
      await db.update(assets).set({ cashLevel: cashAfter, lastReplenishment: new Date() }).where(eq(assets.id, id));
    }
    return Response.json({ id: inserted.id, created_at: inserted.created_at.toISOString() }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/assets/[id]/maintenance error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
