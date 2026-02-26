/**
 * PATCH /api/v1/notifications/:id – Mark a notification as read.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { inAppNotifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { validateId } from "@/lib/validate";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idVal = validateId(id);
    if (!idVal.success) return jsonError(idVal.error, "ValidationError", idVal.details, 400);

    const [updated] = await db
      .update(inAppNotifications)
      .set({ read: true })
      .where(eq(inAppNotifications.id, idVal.data))
      .returning({ id: inAppNotifications.id, read: inAppNotifications.read });

    if (!updated) return jsonError("Notification not found", "NotFound", { id }, 404);
    return Response.json({ id: updated.id, read: updated.read });
  } catch (err) {
    console.error("PATCH /api/v1/notifications/[id] error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
