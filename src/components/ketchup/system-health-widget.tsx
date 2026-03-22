/**
 * System Health Widget - Display current system health status on Ketchup Portal dashboard.
 * Auto-refreshes every 30 seconds to show real-time health metrics.
 * Color-coded: Green (healthy), Yellow (degraded), Red (unhealthy).
 * PRD: PERF-001 – 99.9% Uptime SLA Monitoring.
 * Location: src/components/ketchup/system-health-widget.tsx
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, Mail, MessageSquare, Activity } from "lucide-react";

type HealthStatus = "healthy" | "degraded" | "unhealthy";

type ServiceHealth = {
  status: "up" | "down";
  responseTime: number;
  error?: string;
};

type SystemHealth = {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: ServiceHealth;
    smtp?: ServiceHealth;
    sms?: ServiceHealth;
  };
};

const STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: "bg-green-500",
  degraded: "bg-yellow-500",
  unhealthy: "bg-red-500",
};

const STATUS_TEXT: Record<HealthStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  unhealthy: "Unhealthy",
};

const STATUS_BADGE_VARIANT: Record<HealthStatus, "default" | "secondary" | "destructive"> = {
  healthy: "default",
  degraded: "secondary",
  unhealthy: "destructive",
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function ServiceStatus({
  name,
  icon: Icon,
  health,
}: {
  name: string;
  icon: React.ElementType;
  health: ServiceHealth | undefined;
}) {
  if (!health) return null;

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{health.responseTime}ms</span>
        <div
          className={`h-2 w-2 rounded-full ${health.status === "up" ? "bg-green-500" : "bg-red-500"}`}
        />
      </div>
    </div>
  );
}

export function SystemHealthWidget() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/health");
      const data = await response.json();
      setHealth(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch health:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Loading system status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <button
            onClick={fetchHealth}
            disabled={refreshing}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        <CardDescription>
          Last updated: {lastUpdated?.toLocaleTimeString() ?? "Never"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{STATUS_TEXT[health.status]}</div>
            <div className="text-sm text-gray-500">
              Uptime: {formatUptime(health.uptime)} • v{health.version}
            </div>
          </div>
          <Badge variant={STATUS_BADGE_VARIANT[health.status]}>
            <div className={`h-2 w-2 rounded-full ${STATUS_COLORS[health.status]} mr-2`} />
            {STATUS_TEXT[health.status]}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-semibold mb-2">Services</div>
          <ServiceStatus name="Database" icon={Database} health={health.checks.database} />
          <ServiceStatus name="SMTP" icon={Mail} health={health.checks.smtp} />
          <ServiceStatus name="SMS" icon={MessageSquare} health={health.checks.sms} />
        </div>

        {health.status !== "healthy" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm font-medium text-yellow-800">
              {health.status === "unhealthy"
                ? "⚠️ Critical services are down"
                : "ℹ️ Some services are experiencing issues"}
            </div>
            <div className="text-xs text-yellow-700 mt-1">
              {Object.entries(health.checks)
                .filter(([_, check]) => check.status === "down")
                .map(([name]) => name)
                .join(", ")}{" "}
              {health.status === "unhealthy" ? "unavailable" : "degraded"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
