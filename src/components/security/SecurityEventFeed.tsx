'use client';

import { useEffect, useState, useCallback } from 'react';
import { createSecurityWebSocket } from '@/lib/api/security';
import type { WebSocketSecurityEvent, SecurityEvent, FraudDetection, SecurityIncident } from '@/lib/types/security';

interface SecurityEventFeedProps {
  eventTypes?: ('security_event' | 'fraud_detection' | 'incident_update' | 'system_alert')[];
  maxEvents?: number;
  autoScroll?: boolean;
  showNotifications?: boolean;
}

/**
 * Real-time Security Event Feed Component
 * WebSocket-based live feed for security events, fraud detection, and incidents
 */
export function SecurityEventFeed({
  eventTypes = ['security_event', 'fraud_detection', 'incident_update', 'system_alert'],
  maxEvents = 50,
  autoScroll = true,
  showNotifications = true,
}: SecurityEventFeedProps) {
  const [events, setEvents] = useState<WebSocketSecurityEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const handleNewEvent = useCallback(
    (event: WebSocketSecurityEvent) => {
      if (!eventTypes.includes(event.type)) return;

      setEvents((prev) => {
        const newEvents = [event, ...prev].slice(0, maxEvents);
        return newEvents;
      });

      if (showNotifications) {
        showNotification(event);
      }
    },
    [eventTypes, maxEvents, showNotifications]
  );

  useEffect(() => {
    const websocket = createSecurityWebSocket(
      (data: WebSocketSecurityEvent) => {
        handleNewEvent(data);
      },
      (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      }
    );

    if (websocket) {
      setWs(websocket);
      websocket.onopen = () => {
        setConnected(true);
      };
      websocket.onclose = () => {
        setConnected(false);
      };
    }

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [handleNewEvent]);

  function showNotification(event: WebSocketSecurityEvent) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      createNotification(event);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          createNotification(event);
        }
      });
    }
  }

  function createNotification(event: WebSocketSecurityEvent) {
    let title = '';
    let body = '';
    let icon = '';

    switch (event.type) {
      case 'security_event':
        const secEvent = event.payload as SecurityEvent;
        title = `Security Event: ${secEvent.action}`;
        body = `${secEvent.user} • ${secEvent.severity}`;
        icon = secEvent.severity === 'CRITICAL' || secEvent.severity === 'HIGH' ? '🚨' : '🔒';
        break;
      case 'fraud_detection':
        const fraud = event.payload as FraudDetection;
        title = `Fraud Alert: ${fraud.transactionId}`;
        body = `Risk Score: ${fraud.riskScore}% • ${fraud.amount} ${fraud.currency}`;
        icon = '⚠️';
        break;
      case 'incident_update':
        const incident = event.payload as SecurityIncident;
        title = `Incident Update: ${incident.type}`;
        body = incident.title;
        icon = '🔔';
        break;
      case 'system_alert':
        title = 'System Alert';
        body = (event.payload as any).message || 'Critical system alert';
        icon = '🚨';
        break;
    }

    new Notification(title, {
      body,
      icon: '/icon.png',
      badge: '/badge.png',
      tag: event.type,
    });
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
        return 'success';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'security_event':
        return '🔒';
      case 'fraud_detection':
        return '⚠️';
      case 'incident_update':
        return '🔔';
      case 'system_alert':
        return '🚨';
      default:
        return '📝';
    }
  };

  const formatEventPayload = (event: WebSocketSecurityEvent) => {
    switch (event.type) {
      case 'security_event':
        const secEvent = event.payload as SecurityEvent;
        return (
          <div>
            <p className="font-medium">{secEvent.action}</p>
            <p className="text-xs opacity-80">
              {secEvent.user} • {secEvent.ipAddress}
            </p>
          </div>
        );
      case 'fraud_detection':
        const fraud = event.payload as FraudDetection;
        return (
          <div>
            <p className="font-medium">
              {fraud.transactionId} • Risk: {fraud.riskScore}%
            </p>
            <p className="text-xs opacity-80">
              {fraud.amount} {fraud.currency} • {fraud.flags.join(', ')}
            </p>
          </div>
        );
      case 'incident_update':
        const incident = event.payload as SecurityIncident;
        return (
          <div>
            <p className="font-medium">{incident.type}</p>
            <p className="text-xs opacity-80">{incident.title}</p>
          </div>
        );
      case 'system_alert':
        const alert = event.payload as any;
        return (
          <div>
            <p className="font-medium">{alert.type || 'System Alert'}</p>
            <p className="text-xs opacity-80">{alert.message}</p>
          </div>
        );
      default:
        return <p className="text-sm">Unknown event type</p>;
    }
  };

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h2 className="card-title">Real-Time Security Feed</h2>
          <div className="flex items-center gap-2">
            <div className={`badge badge-${connected ? 'success' : 'error'} badge-sm`}>
              {connected ? '● Connected' : '○ Disconnected'}
            </div>
            <span className="text-xs text-content-muted">{events.length} events</span>
          </div>
        </div>

        {!connected && (
          <div className="alert alert-warning">
            <span className="text-sm">Connecting to real-time feed...</span>
          </div>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-center py-8 text-content-muted">
              <p className="text-sm">No events yet. Listening for real-time updates...</p>
            </div>
          ) : (
            events.map((event, i) => {
              const payload = event.payload as any;
              const severity = payload.severity || 'INFO';
              return (
                <div key={i} className={`alert alert-${getSeverityColor(severity)} py-2`}>
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-lg">{getEventIcon(event.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-ghost badge-xs">{event.type}</span>
                        <span className="text-xs font-mono opacity-60">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {formatEventPayload(event)}
                    </div>
                    {payload.severity && (
                      <span className={`badge badge-${getSeverityColor(payload.severity)} badge-sm`}>
                        {payload.severity}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
