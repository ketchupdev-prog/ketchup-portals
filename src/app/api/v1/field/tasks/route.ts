/**
 * GET /api/v1/field/tasks – List field tasks (paginated, filterable).
 * POST /api/v1/field/tasks – Create field task and assign to technician.
 * Roles: field_lead, field_tech (RBAC enforced: field.tasks permission).
 * Secured: RBAC, rate limiting, audit logging (POST only).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError, jsonSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getPortalSession } from "@/lib/portal-auth";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { logger } from "@/lib/logger";

const basePath = "/api/v1/field/tasks";
const ROUTE_GET = "GET /api/v1/field/tasks";
const ROUTE_POST = "POST /api/v1/field/tasks";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require field.tasks permission (SEC-001)
    const auth = await requirePermission(request, "field.tasks", ROUTE_GET);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const assignedTo = searchParams.get("assigned_to");
    const status = searchParams.get("status");
    const conditions = [];
    if (assignedTo) conditions.push(eq(tasks.assignedTo, assignedTo));
    if (status) conditions.push(eq(tasks.status, status));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [rows, countRows] = await Promise.all([
      db.select().from(tasks).where(whereClause).orderBy(desc(tasks.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(tasks).where(whereClause),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const query: Record<string, string> = {};
    if (assignedTo) query.assigned_to = assignedTo;
    if (status) query.status = status;
    const links = paginationLinks(basePath, page, limit, totalPages, query);
    const data = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      asset_id: r.assetId,
      assigned_to: r.assignedTo,
      due_date: r.dueDate,
      status: r.status,
      created_by: r.createdBy,
      created_at: r.createdAt.toISOString(),
    }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    logger.error(ROUTE_GET, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE_GET);
  }
}

export async function POST(request: NextRequest) {
  try {
    // RBAC: Require field.tasks permission (SEC-001)
    const auth = await requirePermission(request, "field.tasks", ROUTE_POST);
    if (auth) return auth;

    // Rate limiting: Admin mutations (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const title = body.title;
    if (!title || typeof title !== "string" || !title.trim()) {
      return jsonError("title is required", "ValidationError", { field: "title" }, 400, ROUTE_POST);
    }
    const [inserted] = await db
      .insert(tasks)
      .values({
        title: title.trim(),
        description: body.description ?? null,
        assetId: body.asset_id ?? null,
        assignedTo: body.assigned_to ?? null,
        dueDate: body.due_date ?? null,
        status: body.status ?? "pending",
        createdBy: body.created_by ?? null,
      })
      .returning({ id: tasks.id, title: tasks.title, status: tasks.status, assignedTo: tasks.assignedTo });
    if (!inserted) return jsonError("Failed to create task", "InternalError", undefined, 500, ROUTE_POST);

    // Send notifications if task is assigned
    if (inserted.assignedTo) {
      const { queueSmsToPhone } = await import("@/lib/services/sms-queue");
      const { createInAppNotification } = await import("@/lib/services/notifications");
      const { isNotificationChannelEnabled } = await import("@/lib/services/notification-preferences");
      const { portalUsers } = await import("@/db/schema");
      const assignee = await db
        .select({ id: portalUsers.id, phone: portalUsers.phone })
        .from(portalUsers)
        .where(eq(portalUsers.id, inserted.assignedTo))
        .limit(1)
        .then((r) => r[0]);
      if (assignee) {
        await createInAppNotification({
          userId: assignee.id,
          title: "Task assigned",
          body: inserted.title,
          link: "/field-ops/tasks",
        });
        const smsEnabled = await isNotificationChannelEnabled(
          assignee.id,
          "field_task_assigned",
          "sms"
        );
        if (assignee.phone && smsEnabled) {
          await queueSmsToPhone({
            phone: assignee.phone,
            message: `Ketchup SmartPay: You have been assigned a task: ${inserted.title}. Log in to view details.`,
            referenceType: "field_task",
            referenceId: inserted.id,
          });
        }
      }
    }

    // Audit logging: Task assignment (SEC-002)
    const session = getPortalSession(request);
    if (session && inserted.assignedTo) {
      await createAuditLogFromRequest(request, session, {
        action: 'field.task_assign',
        resourceType: 'field_task',
        resourceId: inserted.id,
        metadata: {
          title: inserted.title,
          assignedTo: inserted.assignedTo,
          status: inserted.status,
          assetId: body.asset_id ?? null,
        },
      });
    }

    return jsonSuccess({ id: inserted.id, title: inserted.title, status: inserted.status }, { status: 201 });
  } catch (err) {
    logger.error(ROUTE_POST, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE_POST);
  }
}
