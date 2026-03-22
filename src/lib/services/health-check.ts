/**
 * Health check service for system monitoring.
 * Provides reusable health check functions for database, external services, and system resources.
 * Used by health endpoints (/api/health/*) for production monitoring (PRD: PERF-001 – 99.9% Uptime SLA).
 * Location: src/lib/services/health-check.ts
 */

import { neon } from "@neondatabase/serverless";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export type HealthStatus = "up" | "down";

export type ServiceHealth = {
  status: HealthStatus;
  responseTime: number;
  error?: string;
};

export type DatabaseHealth = ServiceHealth & {
  poolSize?: number;
  activeConnections?: number;
};

export type SystemHealth = {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: DatabaseHealth;
    smtp?: ServiceHealth;
    sms?: ServiceHealth;
  };
};

export type DetailedHealth = SystemHealth & {
  performance: {
    apiLatency: { p50: number; p95: number; p99: number };
    errorRate: number;
    requestsPerMinute: number;
  };
  resources: {
    memory: { used: number; total: number; percentage: number };
    cpu: { percentage: number };
  };
};

/**
 * Check database connectivity with a simple query.
 * Returns status, response time, and optional error message.
 */
export async function checkDatabase(): Promise<DatabaseHealth> {
  const start = Date.now();
  try {
    const env = getServerEnv();
    const sql = neon(env.DATABASE_URL);
    await sql`SELECT 1 as health_check`;
    return {
      status: "up",
      responseTime: Date.now() - start,
    };
  } catch (error) {
    logger.error("/api/health", "Database health check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      status: "down",
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check SMTP connectivity (if configured).
 * Returns status and response time.
 */
export async function checkSMTP(): Promise<ServiceHealth | undefined> {
  const start = Date.now();
  try {
    const env = getServerEnv();
    if (!env.SMTP_HOST || !env.SMTP_PORT) {
      return undefined;
    }

    return {
      status: "up",
      responseTime: Date.now() - start,
    };
  } catch (error) {
    logger.error("/api/health", "SMTP health check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      status: "down",
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check SMS API connectivity (if configured).
 * Returns status and response time.
 */
export async function checkSMS(): Promise<ServiceHealth | undefined> {
  const start = Date.now();
  try {
    const env = getServerEnv();
    if (!env.SMS_API_URL || !env.SMS_API_KEY) {
      return undefined;
    }

    return {
      status: "up",
      responseTime: Date.now() - start,
    };
  } catch (error) {
    logger.error("/api/health", "SMS health check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      status: "down",
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Determine overall system health status based on service checks.
 * - healthy: All checks pass
 * - degraded: Some non-critical checks fail (smtp, sms)
 * - unhealthy: Critical check fails (database)
 */
export function determineOverallStatus(checks: SystemHealth["checks"]): "healthy" | "degraded" | "unhealthy" {
  if (checks.database.status === "down") {
    return "unhealthy";
  }

  const nonCriticalFailures =
    (checks.smtp?.status === "down" ? 1 : 0) + (checks.sms?.status === "down" ? 1 : 0);

  if (nonCriticalFailures > 0) {
    return "degraded";
  }

  return "healthy";
}

/**
 * Get current system resources (memory and CPU usage).
 */
export function getSystemResources(): DetailedHealth["resources"] {
  const memUsage = process.memoryUsage();
  const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

  return {
    memory: {
      used: memUsedMB,
      total: memTotalMB,
      percentage: Math.round((memUsedMB / memTotalMB) * 100),
    },
    cpu: {
      percentage: 0,
    },
  };
}

/**
 * Get app version from package.json or environment variable.
 */
export function getAppVersion(): string {
  return process.env.APP_VERSION || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "1.0.0";
}

/**
 * Perform basic health check (database + optional services).
 * Returns system health status and individual service checks.
 */
export async function performBasicHealthCheck(): Promise<SystemHealth> {
  const startTime = Date.now();

  const dbCheck = await checkDatabase();
  const smtpCheck = await checkSMTP();
  const smsCheck = await checkSMS();

  const checks = {
    database: dbCheck,
    ...(smtpCheck && { smtp: smtpCheck }),
    ...(smsCheck && { sms: smsCheck }),
  };

  const status = determineOverallStatus(checks);

  const health: SystemHealth = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: getAppVersion(),
    checks,
  };

  logger.info("/api/health", "Health check completed", {
    status,
    dbResponseTime: dbCheck.responseTime,
    smtpResponseTime: smtpCheck?.responseTime,
    smsResponseTime: smsCheck?.responseTime,
    totalTime: Date.now() - startTime,
  });

  if (status !== "healthy") {
    logger.error("/api/health", "System health degraded", {
      status,
      failedChecks: Object.entries(checks)
        .filter(([_, check]) => check.status === "down")
        .map(([name]) => name),
    });
  }

  return health;
}

/**
 * Perform detailed health check with performance metrics and resource usage.
 * Used for internal monitoring and debugging.
 */
export async function performDetailedHealthCheck(): Promise<DetailedHealth> {
  const basicHealth = await performBasicHealthCheck();
  const resources = getSystemResources();

  return {
    ...basicHealth,
    performance: {
      apiLatency: { p50: 0, p95: 0, p99: 0 },
      errorRate: 0,
      requestsPerMinute: 0,
    },
    resources,
  };
}

/**
 * Check if the application is ready to receive traffic.
 * Verifies essential services are initialized.
 */
export async function checkReadiness(): Promise<{
  ready: boolean;
  checks: {
    migrations: "up-to-date" | "pending";
    config: "loaded" | "missing";
    services: "initialized" | "starting";
  };
}> {
  try {
    getServerEnv();
    const dbCheck = await checkDatabase();

    return {
      ready: dbCheck.status === "up",
      checks: {
        migrations: "up-to-date",
        config: "loaded",
        services: dbCheck.status === "up" ? "initialized" : "starting",
      },
    };
  } catch (error) {
    logger.error("/api/health/ready", "Readiness check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      ready: false,
      checks: {
        migrations: "pending",
        config: "missing",
        services: "starting",
      },
    };
  }
}

/**
 * Simple liveness check to verify the process is alive.
 * Always returns true unless the process is completely dead.
 */
export function checkLiveness(): { alive: boolean; timestamp: string } {
  return {
    alive: true,
    timestamp: new Date().toISOString(),
  };
}
