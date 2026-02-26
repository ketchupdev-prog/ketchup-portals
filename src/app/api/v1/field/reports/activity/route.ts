/**
 * GET /api/v1/field/reports/activity – Activity report (field_lead).
 */

import { NextRequest } from "next/server";
import { jsonError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const from = request.nextUrl.searchParams.get("from") ?? new Date().toISOString().slice(0, 10);
    const to = request.nextUrl.searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
    return Response.json({ from, to, tasks_completed: 0, maintenance_logs: 0, assets_visited: [] });
  } catch (err) {
    console.error("GET /api/v1/field/reports/activity error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
