/**
 * GET /api/v1/field/tasks – List tasks (optional assigned_to filter). POST – Create task (field_lead).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";

const basePath = "/api/v1/field/tasks";

export async function GET(request: NextRequest) {
  try {
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
    console.error("GET /api/v1/field/tasks error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const title = body.title;
    if (!title || typeof title !== "string" || !title.trim()) {
      return jsonError("title is required", "ValidationError", { field: "title" }, 400);
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
    if (!inserted) return jsonError("Failed to create task", "InternalError", undefined, 500);

    if (inserted.assignedTo) {
      const { queueSmsToPhone } = await import("@/lib/services/sms-queue");
      const { createInAppNotification } = await import("@/lib/services/notifications");
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
        if (assignee.phone) {
          await queueSmsToPhone({
            phone: assignee.phone,
            message: `Ketchup SmartPay: You have been assigned a task: ${inserted.title}. Log in to view details.`,
            referenceType: "field_task",
            referenceId: inserted.id,
          });
        }
      }
    }

    return Response.json({ id: inserted.id, title: inserted.title, status: inserted.status }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/field/tasks error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
