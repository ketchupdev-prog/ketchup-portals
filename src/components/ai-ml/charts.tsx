/**
 * AI/ML Chart Components – Reusable Recharts components for monitoring dashboards
 * Location: src/components/ai-ml/charts.tsx
 */

'use client';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from 'recharts';

// ============================================================================
// TIME SERIES LINE CHART
// ============================================================================

interface TimeSeriesChartProps {
  data: Array<{ name: string; value: number; [key: string]: string | number }>;
  dataKeys: Array<{ key: string; color: string; label: string }>;
  height?: number;
  yAxisLabel?: string;
}

export function TimeSeriesChart({ data, dataKeys, height = 300, yAxisLabel }: TimeSeriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" />
        <XAxis dataKey="name" className="text-xs" />
        <YAxis className="text-xs" label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--b2))',
            border: '1px solid hsl(var(--bc) / 0.2)',
            borderRadius: '0.5rem',
          }}
        />
        <Legend />
        {dataKeys.map((key) => (
          <Line
            key={key.key}
            type="monotone"
            dataKey={key.key}
            stroke={key.color}
            name={key.label}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// STACKED AREA CHART
// ============================================================================

interface StackedAreaChartProps {
  data: Array<{ name: string; [key: string]: string | number }>;
  dataKeys: Array<{ key: string; color: string; label: string }>;
  height?: number;
}

export function StackedAreaChart({ data, dataKeys, height = 300 }: StackedAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" />
        <XAxis dataKey="name" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--b2))',
            border: '1px solid hsl(var(--bc) / 0.2)',
            borderRadius: '0.5rem',
          }}
        />
        <Legend />
        {dataKeys.map((key) => (
          <Area
            key={key.key}
            type="monotone"
            dataKey={key.key}
            stackId="1"
            stroke={key.color}
            fill={key.color}
            fillOpacity={0.6}
            name={key.label}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// BAR CHART
// ============================================================================

interface SimpleBarChartProps {
  data: Array<{ name: string; value: number; [key: string]: string | number }>;
  dataKey?: string;
  color?: string;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export function SimpleBarChart({ 
  data, 
  dataKey = 'value', 
  color = '#8884d8', 
  height = 300,
  xAxisLabel,
  yAxisLabel 
}: SimpleBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" />
        <XAxis 
          dataKey="name" 
          className="text-xs"
          label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
        />
        <YAxis 
          className="text-xs"
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--b2))',
            border: '1px solid hsl(var(--bc) / 0.2)',
            borderRadius: '0.5rem',
          }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// PIE CHART
// ============================================================================

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface SimplePieChartProps {
  data: Array<{ name: string; value: number }>;
  height?: number;
  showPercentage?: boolean;
}

export function SimplePieChart({ data, height = 300, showPercentage = true }: SimplePieChartProps) {
  const renderLabel = (props: PieLabelRenderProps) => {
    const name = String(props.name ?? '');
    const pct = props.percent;
    if (showPercentage && pct !== undefined) {
      return `${name}: ${(pct * 100).toFixed(1)}%`;
    }
    return name;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--b2))',
            border: '1px solid hsl(var(--bc) / 0.2)',
            borderRadius: '0.5rem',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// METRIC CARD WITH TREND
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, change, changeType = 'neutral', icon }: MetricCardProps) {
  const changeColor = 
    changeType === 'positive' ? 'text-success' : 
    changeType === 'negative' ? 'text-error' : 
    'text-base-content';

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xs text-content-muted uppercase tracking-wide">{label}</h3>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && (
              <p className={`text-xs mt-1 ${changeColor}`}>{change}</p>
            )}
          </div>
          {icon && (
            <div className="text-2xl opacity-50">
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STAT BAR WITH PROGRESS
// ============================================================================

interface StatBarProps {
  label: string;
  value: string | number;
  total?: number;
  percentage?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export function StatBar({ label, value, total, percentage, color = 'primary' }: StatBarProps) {
  const calculatedPercentage = percentage ?? (total ? (Number(value) / total) * 100 : 0);

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <progress 
        className={`progress progress-${color} w-full`} 
        value={calculatedPercentage} 
        max="100" 
      />
    </div>
  );
}

// ============================================================================
// STATUS INDICATOR
// ============================================================================

interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info';
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusIndicator({ status, label, size = 'md' }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg',
  };

  return (
    <span className={`badge badge-${status} ${sizeClasses[size]}`}>
      {label}
    </span>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="w-full animate-pulse" style={{ height }}>
      <div className="h-full bg-base-300 rounded-lg"></div>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="card bg-base-200 animate-pulse">
      <div className="card-body">
        <div className="h-4 bg-base-300 rounded w-24 mb-2"></div>
        <div className="h-8 bg-base-300 rounded w-32"></div>
        <div className="h-3 bg-base-300 rounded w-16 mt-1"></div>
      </div>
    </div>
  );
}
