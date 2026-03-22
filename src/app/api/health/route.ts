/**
 * Basic health check endpoint for external monitoring services.
 * Returns system health status (healthy/degraded/unhealthy) and service checks.
 * Public endpoint (no auth) for UptimeRobot, Datadog, New Relic, PagerDuty.
 * PRD: PERF-001 – 99.9% Uptime SLA Monitoring.
 * Location: src/app/api/health/route.ts
 */

import { NextResponse } from "next/server";
import { performBasicHealthCheck } from "@/lib/services/health-check";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await performBasicHealthCheck();

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
