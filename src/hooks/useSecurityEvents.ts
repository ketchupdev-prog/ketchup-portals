/**
 * Real-Time Security Events Hook
 * Uses WebSocket for live security event updates
 */

'use client';

import { useEffect, useState } from 'react';
import {
  backendWebSocket,
  WEBSOCKET_CHANNELS,
} from '@/lib/websocket/manager';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  description: string;
  ipAddress?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface UseSecurityEventsResult {
  events: SecurityEvent[];
  isConnected: boolean;
  clearEvents: () => void;
}

export function useSecurityEvents(maxEvents: number = 100): UseSecurityEventsResult {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!backendWebSocket.isConnected()) {
      backendWebSocket.connect();
    }

    setIsConnected(backendWebSocket.isConnected());

    const handleSecurityEvent = (data: SecurityEvent) => {
      setEvents((prev) => {
        const newEvents = [data, ...prev].slice(0, maxEvents);
        return newEvents;
      });
    };

    const unsubscribe = backendWebSocket.subscribe<SecurityEvent>(
      WEBSOCKET_CHANNELS.SECURITY_EVENTS,
      handleSecurityEvent
    );

    const connectionCheckInterval = setInterval(() => {
      setIsConnected(backendWebSocket.isConnected());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(connectionCheckInterval);
    };
  }, [maxEvents]);

  const clearEvents = () => {
    setEvents([]);
  };

  return {
    events,
    isConnected,
    clearEvents,
  };
}
