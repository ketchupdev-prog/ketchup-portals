/**
 * GET /api/v1/field/reports/activity – Field activity report (tasks and maintenance logs).
 * Query: from, to (date YYYY-MM-DD). Returns tasks_completed, maintenance_logs, assets_visited, activity_rows.
 * Roles: field_lead (RBAC enforced: field.tasks permission).
 * Secured: RBAC, rate limiting.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tasks, maintenanceLogs, assets, portalUsers } from "@/db/schema";
import { sql, gte, lte, eq, and, inArray } from "drizzle-orm";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/field/reports/activity";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require field.tasks permission (SEC-001)
    const auth = await requirePermission(request, "field.tasks", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const fromParam = request.nextUrl.searchParams.get("from") ?? new Date().toISOString().slice(0, 10);
    const toParam = request.nextUrl.searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
    const fromDate = new Date(fromParam + "T00:00:00.000Z");
    const toDate = new Date(toParam + "T23:59:59.999Z");

    const [tasksDone, logs, taskRows, logRows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(tasks)
        .where(and(eq(tasks.status, "done"), gte(tasks.createdAt, fromDate), lte(tasks.createdAt, toDate))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(maintenanceLogs)
        .where(and(gte(maintenanceLogs.createdAt, fromDate), lte(maintenanceLogs.createdAt, toDate))),
      db
        .select({
          id: tasks.id,
          date: sql<string>`(${tasks.createdAt})::date::text`,
          title: tasks.title,
          assetId: tasks.assetId,
          assignedTo: tasks.assignedTo,
        })
        .from(tasks)
        .where(and(eq(tasks.status, "done"), gte(tasks.createdAt, fromDate), lte(tasks.createdAt, toDate)))
        .orderBy(tasks.createdAt),
      db
        .select({
          id: maintenanceLogs.id,
          date: sql<string>`(${maintenanceLogs.createdAt})::date::text`,
          type: maintenanceLogs.type,
          assetId: maintenanceLogs.assetId,
          technicianId: maintenanceLogs.technicianId,
        })
        .from(maintenanceLogs)
        .where(and(gte(maintenanceLogs.createdAt, fromDate), lte(maintenanceLogs.createdAt, toDate)))
        .orderBy(maintenanceLogs.createdAt),
    ]);

    const tasksCompleted = tasksDone[0]?.count ?? 0;
    const maintenanceLogsCount = logs[0]?.count ?? 0;

    const assetIds = new Set<string>();
    taskRows.forEach((r) => { if (r.assetId) assetIds.add(r.assetId); });
    logRows.forEach((r) => { if (r.assetId) assetIds.add(r.assetId); });
    let assetList: { id: string; name: string | null }[] = [];
    if (assetIds.size > 0) {
      assetList = await db.select({ id: assets.id, name: assets.name }).from(assets).where(inArray(assets.id, Array.from(assetIds)));
    }
    const assetsVisited = assetList.map((a) => ({ id: a.id, name: a.name ?? "" }));

    const techIds = new Set<string>();
    taskRows.forEach((r) => { if (r.assignedTo) techIds.add(r.assignedTo); });
    logRows.forEach((r) => { if (r.technicianId) techIds.add(r.technicianId); });
    const techMap = new Map<string, string>();
    if (techIds.size > 0) {
      const techs = await db.select({ id: portalUsers.id, fullName: portalUsers.fullName }).from(portalUsers).where(inArray(portalUsers.id, Array.from(techIds)));
      techs.forEach((t) => techMap.set(t.id, t.fullName ?? t.id));
    }
    const assetMap = new Map(assetList.map((a) => [a.id, a.name ?? a.id]));

    const activityRows = [
      ...taskRows.map((r) => ({
        id: r.id,
        date: r.date,
        tech: r.assignedTo ? techMap.get(r.assignedTo) ?? r.assignedTo : "",
        asset: r.assetId ? assetMap.get(r.assetId) ?? r.assetId : "",
        activity: r.title ?? "Task",
        duration: "",
      })),
      ...logRows.map((r) => ({
        id: r.id,
        date: r.date,
        tech: r.technicianId ? techMap.get(r.technicianId) ?? r.technicianId : "",
        asset: r.assetId ? assetMap.get(r.assetId) ?? r.assetId : "",
        activity: r.type ?? "Maintenance",
        duration: "",
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    return jsonSuccess({
      from: fromParam,
      to: toParam,
      tasks_completed: tasksCompleted,
      maintenance_logs: maintenanceLogsCount,
      assets_visited: assetsVisited,
      activity_rows: activityRows,
    });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
