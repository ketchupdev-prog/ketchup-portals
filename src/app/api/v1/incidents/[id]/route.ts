/**
 * PATCH /api/v1/incidents/:id – Update incident.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { incidents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const [updated] = await db
      .update(incidents)
      .set({
        ...(body.title != null && { title: String(body.title) }),
        ...(body.description != null && { description: body.description }),
        ...(body.status != null && { status: body.status }),
        ...(body.severity != null && { severity: body.severity }),
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, id))
      .returning({ id: incidents.id, status: incidents.status });
    if (!updated) return jsonError("Incident not found", "NotFound", { id }, 404);
    return Response.json({ id: updated.id, status: updated.status });
  } catch (err) {
    console.error("PATCH /api/v1/incidents/[id] error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
