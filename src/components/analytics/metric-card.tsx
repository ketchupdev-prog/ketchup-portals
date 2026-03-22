'use client';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  loading?: boolean;
}

export function MetricCard({ label, value, change, changeType = 'neutral', icon, loading }: MetricCardProps) {
  const changeColors = {
    positive: 'text-success',
    negative: 'text-error',
    neutral: 'text-content-muted',
  };

  if (loading) {
    return (
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="skeleton h-4 w-24 mb-2"></div>
          <div className="skeleton h-8 w-32 mb-1"></div>
          <div className="skeleton h-3 w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xs text-content-muted font-medium">{label}</h3>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && (
              <p className={`text-xs mt-1 ${changeColors[changeType]}`}>
                {change}
              </p>
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
