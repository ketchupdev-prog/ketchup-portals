'use client';

interface StatusBadgeProps {
  status: 'operational' | 'degraded' | 'down' | 'resolved' | 'investigating' | 'ongoing';
  showDot?: boolean;
}

export function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const config = {
    operational: {
      color: 'badge-success',
      dotColor: 'bg-success',
      label: 'Operational',
    },
    degraded: {
      color: 'badge-warning',
      dotColor: 'bg-warning',
      label: 'Degraded',
    },
    down: {
      color: 'badge-error',
      dotColor: 'bg-error',
      label: 'Down',
    },
    resolved: {
      color: 'badge-success',
      dotColor: 'bg-success',
      label: 'Resolved',
    },
    investigating: {
      color: 'badge-warning',
      dotColor: 'bg-warning',
      label: 'Investigating',
    },
    ongoing: {
      color: 'badge-error',
      dotColor: 'bg-error',
      label: 'Ongoing',
    },
  };

  const { color, dotColor, label } = config[status];

  return (
    <span className={`badge ${color}`}>
      {showDot && <span className={`inline-block w-2 h-2 ${dotColor} rounded-full mr-1`} />}
      {label}
    </span>
  );
}
