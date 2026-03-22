'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface HistogramChartProps {
  data: Array<{ bucket: string; count: number }>;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  color?: string;
  height?: number;
}

export function HistogramChart({ data, title, xAxisLabel, yAxisLabel, color = '#10b981', height = 300 }: HistogramChartProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="bucket" 
            stroke="#9ca3af" 
            fontSize={12}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
          />
          <YAxis 
            stroke="#9ca3af" 
            fontSize={12} 
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined} 
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px' }}
            labelStyle={{ color: '#f3f4f6' }}
          />
          <Legend />
          <Bar dataKey="count" fill={color} name={yAxisLabel || 'Count'} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
