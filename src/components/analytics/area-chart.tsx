'use client';

import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AreaChartProps {
  data: Array<Record<string, string | number>>;
  title?: string;
  xKey: string;
  yKey: string;
  yAxisLabel?: string;
  color?: string;
  height?: number;
}

export function AreaChart({ data, title, xKey, yKey, yAxisLabel, color = '#3b82f6', height = 300 }: AreaChartProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey={xKey} stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px' }}
            labelStyle={{ color: '#f3f4f6' }}
          />
          <Legend />
          <Area type="monotone" dataKey={yKey} stroke={color} fillOpacity={1} fill="url(#colorGradient)" name={yAxisLabel || 'Value'} />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
