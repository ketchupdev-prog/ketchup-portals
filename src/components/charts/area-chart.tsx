'use client';

import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

export interface AreaChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface AreaChartProps {
  data: AreaChartDataPoint[];
  areaKey: string;
  xKey?: string;
  color?: string;
  height?: number;
  className?: string;
}

export function AreaChart({ data, areaKey, xKey = 'name', color = 'hsl(var(--p))', height = 300, className = '' }: AreaChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))' }} />
          <Area type="monotone" dataKey={areaKey} stroke={color} fill="url(#areaGrad)" strokeWidth={2} />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
