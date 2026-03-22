'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BarChartProps {
  data: Array<{ label: string; value: number; count?: number }>;
  title?: string;
  yAxisLabel?: string;
  color?: string;
  height?: number;
}

export function CustomBarChart({ data, title, yAxisLabel, color = '#10b981', height = 300 }: BarChartProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px' }}
            labelStyle={{ color: '#f3f4f6' }}
          />
          <Legend />
          <Bar dataKey="value" fill={color} name={yAxisLabel || 'Value'} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Export alias for dashboard compatibility
export { CustomBarChart as BarChart };
