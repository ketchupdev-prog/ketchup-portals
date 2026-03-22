'use client';

import { StatusIndicator, type StatusLevel } from '@/components/admin/status-indicator';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import type { KRIMetric } from '@/lib/types/compliance';

interface KRICardProps {
  metric: KRIMetric;
  onClick?: () => void;
}

function getStatusLevel(status: string): StatusLevel {
  switch (status) {
    case 'GOOD':
      return 'good';
    case 'WARNING':
      return 'warning';
    case 'CRITICAL':
      return 'critical';
    default:
      return 'unknown';
  }
}

export function KRICard({ metric, onClick }: KRICardProps) {
  const trendData = metric.trend.map((value, index) => ({ index, value }));
  const isPercentage = metric.unit === '%';
  const displayCurrent = isPercentage ? `${metric.current}%` : metric.current;
  const displayTarget = isPercentage ? `${metric.target}%` : metric.target;

  const borderColor =
    metric.status === 'GOOD'
      ? 'border-success'
      : metric.status === 'WARNING'
        ? 'border-warning'
        : 'border-error';

  return (
    <div
      className={`card bg-base-200 border-l-4 ${borderColor} hover:shadow-lg transition-shadow cursor-pointer`}
      onClick={onClick}
    >
      <div className="card-body">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="text-xs font-medium text-content-muted uppercase tracking-wide">{metric.name}</h3>
            <p className="text-3xl font-bold mt-2 text-base-content">{displayCurrent}</p>
            <p className="text-xs text-content-muted mt-1">Target: {displayTarget}</p>
          </div>
          <StatusIndicator status={getStatusLevel(metric.status)} size="sm" />
        </div>

        <div className="mt-4 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Line
                type="monotone"
                dataKey="value"
                stroke={
                  metric.status === 'GOOD' ? '#10b981' : metric.status === 'WARNING' ? '#f59e0b' : '#ef4444'
                }
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-xs text-content-muted mt-2">
          Last updated: {new Date(metric.lastUpdated).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
