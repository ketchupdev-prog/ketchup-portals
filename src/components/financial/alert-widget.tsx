'use client';

import { usePolling } from '@/hooks/use-polling';
import { getActiveAlerts, acknowledgeAlert, type Alert } from '@/lib/api/alerts';

export function AlertWidget() {
  const { data: alerts, loading, refetch } = usePolling({
    fetcher: getActiveAlerts,
    interval: 30000,
  });

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
      await refetch();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  if (loading || !alerts || alerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 z-50 space-y-2">
      {alerts.slice(0, 3).map((alert: Alert) => (
        <div
          key={alert.id}
          className={`alert ${alert.severity === 'CRITICAL' ? 'alert-error' : alert.severity === 'WARNING' ? 'alert-warning' : 'alert-info'} shadow-lg`}
        >
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm">{alert.title}</h3>
                <p className="text-xs mt-1">{alert.message}</p>
                <p className="text-xs opacity-60 mt-1">{new Date(alert.timestamp).toLocaleString('en-NA')}</p>
              </div>
              <button onClick={() => handleAcknowledge(alert.id)} className="btn btn-ghost btn-xs">
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
