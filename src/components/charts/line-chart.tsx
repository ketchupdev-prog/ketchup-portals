'use client';

import { LineChart as RLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

export interface LineChartDataPoint { name: string; [key: string]: string | number; }
export interface LineChartProps {
  data: LineChartDataPoint[];
  lines: { dataKey: string; color?: string; name?: string }[];
  xKey?: string;
  height?: number;
  className?: string;
}
const C = ['hsl(var(--p))', 'hsl(var(--s))', '#22c55e', '#eab308'];
export function LineChart({ data, lines, xKey = 'name', height = 300, className = '' }: LineChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))' }} />
          <Legend />
          {lines.map((l, i) => <Line key={l.dataKey} type="monotone" dataKey={l.dataKey} name={l.name ?? l.dataKey} stroke={l.color ?? C[i % C.length]} strokeWidth={2} dot={{ r: 3 }} />)}
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
}
