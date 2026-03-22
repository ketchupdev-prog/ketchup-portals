'use client';

import { useEffect, useState } from 'react';
import type { SystemAlert } from '@/lib/types/security';

/**
 * Security Alert Notification System
 * Displays critical security alerts with dismiss and action options
 */
export function SecurityAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  useEffect(() => {
    const handleAlert = (event: CustomEvent<SystemAlert>) => {
      const alert = event.detail;
      setAlerts((prev) => {
        const exists = prev.find((a) => a.id === alert.id);
        if (exists) return prev;
        return [alert, ...prev].slice(0, 5);
      });

      if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
        playAlertSound();
      }
    };

    window.addEventListener('security-alert' as any, handleAlert);
    return () => {
      window.removeEventListener('security-alert' as any, handleAlert);
    };
  }, []);

  function playAlertSound() {
    const audio = new Audio('/sounds/alert.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }

  function dismissAlert(alertId: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'info';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return '🚨';
      case 'HIGH':
        return '⚠️';
      case 'MEDIUM':
        return '⚡';
      case 'LOW':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`alert alert-${getSeverityColor(alert.severity)} shadow-lg animate-slide-in-right`}
        >
          <div className="flex-1">
            <div className="flex items-start gap-2">
              <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge badge-${getSeverityColor(alert.severity)} badge-sm`}>
                    {alert.severity}
                  </span>
                  <span className="badge badge-ghost badge-xs">{alert.type}</span>
                </div>
                <p className="font-medium text-sm">{alert.message}</p>
                <p className="text-xs opacity-80 mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
              </div>
            </div>
            {alert.requiresAction && alert.actionUrl && (
              <a href={alert.actionUrl} className="btn btn-xs btn-primary mt-2">
                Take Action →
              </a>
            )}
          </div>
          <button onClick={() => dismissAlert(alert.id)} className="btn btn-sm btn-ghost">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * Helper function to trigger a security alert from anywhere in the app
 */
export function triggerSecurityAlert(alert: SystemAlert) {
  const event = new CustomEvent('security-alert', { detail: alert });
  window.dispatchEvent(event);
}
