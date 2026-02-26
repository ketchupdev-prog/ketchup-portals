'use client';

/**
 * HeatMap – Regional/category heat map. Grid-based (no Recharts HeatMap for simple use).
 * Location: src/components/charts/heat-map.tsx
 */

import { cn } from '@/lib/utils';

export interface HeatMapCell {
  x: string;
  y: string;
  value: number;
}

export interface HeatMapProps {
  data: HeatMapCell[];
  xLabels: string[];
  yLabels: string[];
  getColor: (value: number) => string;
  className?: string;
}

export function HeatMap({ data, xLabels, yLabels, getColor, className = '' }: HeatMapProps) {
  const getValue = (x: string, y: string) => data.find((d) => d.x === x && d.y === y)?.value ?? 0;
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="table table-xs border border-base-300">
        <thead>
          <tr>
            <th className="bg-base-200" />
            {xLabels.map((x) => (
              <th key={x} className="bg-base-200 text-center text-xs font-medium">
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yLabels.map((y) => (
            <tr key={y}>
              <td className="bg-base-200 text-xs font-medium">{y}</td>
              {xLabels.map((x) => {
                const v = getValue(x, y);
                return (
                  <td
                    key={`${x}-${y}`}
                    className="text-center text-xs transition-colors"
                    style={{ backgroundColor: getColor(v) }}
                    title={`${x} / ${y}: ${v}`}
                  >
                    {v > 0 ? v : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
