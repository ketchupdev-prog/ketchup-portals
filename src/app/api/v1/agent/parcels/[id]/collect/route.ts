/**
 * POST /api/v1/agent/parcels/:id/collect – Mark parcel collected.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { parcels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [updated] = await db
      .update(parcels)
      .set({ status: "collected", collectedAt: new Date() })
      .where(eq(parcels.id, id))
      .returning({ id: parcels.id, status: parcels.status });
    if (!updated) return jsonError("Parcel not found", "NotFound", { id }, 404);
    return Response.json({ id: updated.id, status: updated.status });
  } catch (err) {
    console.error("POST /api/v1/agent/parcels/[id]/collect error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
