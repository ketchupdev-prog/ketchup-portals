'use client';

interface FunnelChartProps {
  data: {
    label: string;
    value: number;
    percentage: number;
  }[];
  title?: string;
}

export function FunnelChart({ data, title }: FunnelChartProps) {
  const maxValue = data[0]?.value || 1;

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-medium mb-4">{title}</h3>}
      <div className="space-y-2">
        {data.map((item, index) => {
          const width = (item.value / maxValue) * 100;
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
          const color = colors[index % colors.length];
          
          return (
            <div key={item.label} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-sm text-content-muted">
                  {item.percentage}% ({item.value.toLocaleString()})
                </span>
              </div>
              <div className="relative h-12 bg-base-300 rounded">
                <div
                  className="absolute inset-y-0 left-0 rounded flex items-center justify-center text-white font-semibold text-sm transition-all duration-500"
                  style={{ width: `${width}%`, backgroundColor: color }}
                >
                  {width > 20 && item.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
