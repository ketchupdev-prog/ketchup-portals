'use client';

/**
 * PieChart – Pie/donut chart for proportions. Recharts wrapper.
 * Location: src/components/charts/pie-chart.tsx
 */

import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

export interface PieChartDataPoint {
  name: string;
  value: number;
}

export interface PieChartProps {
  data: PieChartDataPoint[];
  innerRadius?: number;
  height?: number;
  className?: string;
}

const DEFAULT_COLORS = ['hsl(var(--p))', 'hsl(var(--s))', 'hsl(var(--a))', '#22c55e', '#eab308', '#ef4444'];

export function PieChart({
  data,
  innerRadius = 0,
  height = 300,
  className = '',
}: PieChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))' }} formatter={(value: number | undefined) => [value ?? 0, 'Value']} />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
