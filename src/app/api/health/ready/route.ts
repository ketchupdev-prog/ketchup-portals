/**
 * Readiness check endpoint for container orchestrators and load balancers.
 * Verifies if the application is ready to receive traffic.
 * Checks database connectivity, environment configuration, and service initialization.
 * Public endpoint (no auth) for Kubernetes, Docker, load balancers.
 * Location: src/app/api/health/ready/route.ts
 */

import { NextResponse } from "next/server";
import { checkReadiness } from "@/lib/services/health-check";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const readiness = await checkReadiness();

    const statusCode = readiness.ready ? 200 : 503;

    return NextResponse.json(readiness, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ready: false,
        checks: {
          migrations: "pending",
          config: "missing",
          services: "starting",
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
