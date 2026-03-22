/**
 * Liveness check endpoint for container orchestrators.
 * Verifies if the application process is alive.
 * Always returns 200 OK unless the process is completely dead.
 * Public endpoint (no auth) for Kubernetes, Docker, container health checks.
 * Location: src/app/api/health/live/route.ts
 */

import { NextResponse } from "next/server";
import { checkLiveness } from "@/lib/services/health-check";

export const dynamic = "force-dynamic";

export async function GET() {
  const liveness = checkLiveness();

  return NextResponse.json(liveness, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Type": "application/json",
    },
  });
}
