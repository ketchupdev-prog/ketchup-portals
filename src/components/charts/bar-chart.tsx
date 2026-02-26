'use client';

import { BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

export interface BarChartDataPoint { name: string; [key: string]: string | number; }
export interface BarChartProps {
  data: BarChartDataPoint[];
  bars: { dataKey: string; color?: string; name?: string }[];
  xKey?: string;
  height?: number;
  className?: string;
}
const C = ['hsl(var(--p))', 'hsl(var(--s))', '#22c55e', '#eab308'];
export function BarChart({ data, bars, xKey = 'name', height = 300, className = '' }: BarChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RBarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))' }} />
          <Legend />
          {bars.map((b, i) => <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name ?? b.dataKey} fill={b.color ?? C[i % C.length]} radius={[4, 4, 0, 0]} />)}
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
}
