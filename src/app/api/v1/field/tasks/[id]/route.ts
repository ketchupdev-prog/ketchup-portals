/**
 * PATCH /api/v1/field/tasks/:id – Update task status or assignment.
 * Roles: field_tech, field_lead (RBAC enforced: field.tasks permission).
 * Secured: RBAC, rate limiting, conditional audit logging (assignment changes only).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getPortalSession } from "@/lib/portal-auth";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { logger } from "@/lib/logger";

const ROUTE = "PATCH /api/v1/field/tasks/[id]";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require field.tasks permission (SEC-001)
    const auth = await requirePermission(request, "field.tasks", ROUTE);
    if (auth) return auth;

    // Rate limiting: Admin mutations (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    
    // Track if we're changing assignment for audit logging
    const isAssignmentChange = body.assigned_to != null;
    
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
      .returning({ id: tasks.id, status: tasks.status, title: tasks.title, assignedTo: tasks.assignedTo });
    if (!updated) return jsonError("Task not found", "NotFound", { id }, 404, ROUTE);

    // Audit logging: Only for task assignment changes (SEC-002)
    if (isAssignmentChange) {
      const session = getPortalSession(request);
      if (session) {
        await createAuditLogFromRequest(request, session, {
          action: 'field.task_assign',
          resourceType: 'field_task',
          resourceId: updated.id,
          metadata: {
            title: updated.title,
            assignedTo: updated.assignedTo,
            status: updated.status,
          },
        });
      }
    }

    return jsonSuccess({ id: updated.id, status: updated.status });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
