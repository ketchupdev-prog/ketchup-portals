/**
 * Detailed health check endpoint for internal monitoring.
 * Returns comprehensive system health, performance metrics, and resource usage.
 * Requires authentication and system.monitor permission (RBAC protected).
 * Used for internal dashboards, debugging, and detailed monitoring.
 * Location: src/app/api/health/detailed/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { performDetailedHealthCheck } from "@/lib/services/health-check";
import { requirePermission } from "@/lib/require-permission";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await requirePermission(request, "system.monitor", "/api/health/detailed");
  if (authError) return authError;

  try {
    const health = await performDetailedHealthCheck();

    const statusCode = health.status === "healthy" ? 200 : 503;

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.APP_VERSION || "1.0.0",
        checks: {
          database: {
            status: "down",
            responseTime: 0,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
        performance: {
          apiLatency: { p50: 0, p95: 0, p99: 0 },
          errorRate: 0,
          requestsPerMinute: 0,
        },
        resources: {
          memory: { used: 0, total: 0, percentage: 0 },
          cpu: { percentage: 0 },
        },
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Content-Type": "application/json",
        },
      }
    );
  }
}
