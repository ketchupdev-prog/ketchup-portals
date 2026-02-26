/**
 * Structured logger for API routes and server code.
 * Use for errors and important events; avoid logging PII (passwords, full IDs).
 * Location: src/lib/logger.ts
 */

type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function formatPayload(level: LogLevel, route: string, message: string, context?: LogContext): string {
  const payload = {
    ts: new Date().toISOString(),
    level,
    route,
    message,
    ...(context && Object.keys(context).length > 0 ? { context } : {}),
  };
  return JSON.stringify(payload);
}

function log(level: LogLevel, route: string, message: string, context?: LogContext): void {
  const out = formatPayload(level, route, message, context);
  if (level === "error") {
    console.error(out);
  } else if (level === "warn") {
    console.warn(out);
  } else {
    console.log(out);
  }
}

export const logger = {
  info(route: string, message: string, context?: LogContext): void {
    log("info", route, message, context);
  },
  warn(route: string, message: string, context?: LogContext): void {
    log("warn", route, message, context);
  },
  error(route: string, message: string, context?: LogContext): void {
    log("error", route, message, context);
  },
};
