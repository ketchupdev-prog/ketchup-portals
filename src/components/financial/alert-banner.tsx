'use client';

interface AlertBannerProps {
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  onDismiss?: () => void;
}

const typeStyles = {
  error: 'bg-error/10 border-error text-error',
  warning: 'bg-warning/10 border-warning text-warning',
  success: 'bg-success/10 border-success text-success',
  info: 'bg-info/10 border-info text-info',
};

const typeIcons = {
  error: '❌',
  warning: '⚠️',
  success: '✓',
  info: 'ℹ️',
};

export function AlertBanner({ type, title, message, onDismiss }: AlertBannerProps) {
  return (
    <div className={`border-l-4 p-4 rounded ${typeStyles[type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{typeIcons[type]}</span>
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="mt-1 text-sm opacity-90">{message}</p>
          </div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="btn btn-ghost btn-sm btn-circle">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
