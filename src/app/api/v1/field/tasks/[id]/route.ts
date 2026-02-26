/**
 * PATCH /api/v1/field/tasks/:id – Update task status (field_tech, field_lead).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/db/schema";
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
      .update(tasks)
      .set({
        ...(body.title != null && { title: String(body.title) }),
        ...(body.description != null && { description: body.description }),
        ...(body.assigned_to != null && { assignedTo: body.assigned_to }),
        ...(body.due_date != null && { dueDate: body.due_date }),
        ...(body.status != null && { status: body.status }),
      })
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id, status: tasks.status });
    if (!updated) return jsonError("Task not found", "NotFound", { id }, 404);
    return Response.json({ id: updated.id, status: updated.status });
  } catch (err) {
    console.error("PATCH /api/v1/field/tasks/[id] error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
