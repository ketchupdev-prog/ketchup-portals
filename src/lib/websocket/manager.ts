/**
 * WebSocket Manager for Real-Time Data Streams
 * Handles WebSocket connections with automatic reconnection and channel subscriptions
 * Used for: security events, transaction feed, system metrics, critical alerts
 */

import { createClient } from '@/lib/supabase/client';

export interface WebSocketMessage<T = any> {
  channel: string;
  event: string;
  data: T;
  timestamp: string;
}

export type MessageCallback<T = any> = (data: T) => void;

export interface ChannelSubscription {
  channel: string;
  callbacks: Set<MessageCallback>;
}

export const WEBSOCKET_CHANNELS = {
  SECURITY_EVENTS: 'security:events',
  TRANSACTIONS: 'transactions:live',
  SYSTEM_METRICS: 'system:metrics',
  ALERTS: 'alerts:critical',
  COMPLIANCE_UPDATES: 'compliance:updates',
  AUDIT_LOGS: 'audit:logs',
} as const;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private subscriptions: Map<string, ChannelSubscription> = new Map();
  private url: string;
  private isConnecting: boolean = false;
  private isIntentionallyClosed: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('[WebSocket] Already connected or connecting');
      return;
    }

    this.isConnecting = true;
    this.isIntentionallyClosed = false;

    try {
      const token = await this.getAuthToken();
      const wsUrl = token ? `${this.url}?token=${token}` : this.url;

      console.log(`[WebSocket] Connecting to ${this.url}`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('[WebSocket] Failed to get auth token:', error);
      return null;
    }
  }

  private handleOpen(): void {
    console.log('[WebSocket] Connected successfully');
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    this.startHeartbeat();

    this.subscriptions.forEach((sub) => {
      this.sendSubscribe(sub.channel);
    });

    this.flushMessageQueue();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      if (message.event === 'pong') {
        this.handlePong();
        return;
      }

      if (message.event === 'subscribed') {
        console.log(`[WebSocket] Subscribed to channel: ${message.channel}`);
        return;
      }

      const subscription = this.subscriptions.get(message.channel);
      if (subscription) {
        subscription.callbacks.forEach((callback) => {
          try {
            callback(message.data);
          } catch (error) {
            console.error(
              `[WebSocket] Error in callback for channel ${message.channel}:`,
              error
            );
          }
        });
      }
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  private handleError(error: Event): void {
    console.error('[WebSocket] Connection error:', error);
  }

  private handleClose(event: CloseEvent): void {
    console.log(
      `[WebSocket] Connection closed: ${event.code} ${event.reason || 'No reason'}`
    );

    this.isConnecting = false;
    this.stopHeartbeat();

    if (!this.isIntentionallyClosed) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        '[WebSocket] Max reconnection attempts reached. Giving up.'
      );
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ event: 'ping', timestamp: new Date().toISOString() });

        this.heartbeatTimeout = setTimeout(() => {
          console.warn('[WebSocket] Heartbeat timeout, reconnecting...');
          this.ws?.close();
        }, 5000);
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private handlePong(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[WebSocket] Cannot send message, connection not open');
      this.messageQueue.push(data);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  private sendSubscribe(channel: string): void {
    this.send({
      event: 'subscribe',
      channel,
      timestamp: new Date().toISOString(),
    });
  }

  private sendUnsubscribe(channel: string): void {
    this.send({
      event: 'unsubscribe',
      channel,
      timestamp: new Date().toISOString(),
    });
  }

  subscribe<T = any>(channel: string, callback: MessageCallback<T>): () => void {
    let subscription = this.subscriptions.get(channel);

    if (!subscription) {
      subscription = {
        channel,
        callbacks: new Set(),
      };
      this.subscriptions.set(channel, subscription);

      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendSubscribe(channel);
      }
    }

    subscription.callbacks.add(callback as MessageCallback);

    return () => {
      this.unsubscribe(channel, callback as MessageCallback);
    };
  }

  unsubscribe(channel: string, callback?: MessageCallback): void {
    const subscription = this.subscriptions.get(channel);
    if (!subscription) return;

    if (callback) {
      subscription.callbacks.delete(callback);

      if (subscription.callbacks.size === 0) {
        this.subscriptions.delete(channel);
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.sendUnsubscribe(channel);
        }
      }
    } else {
      this.subscriptions.delete(channel);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendUnsubscribe(channel);
      }
    }
  }

  disconnect(): void {
    console.log('[WebSocket] Disconnecting');
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.subscriptions.clear();
    this.messageQueue = [];
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): number | null {
    return this.ws?.readyState || null;
  }
}

const WS_BACKEND_URL =
  process.env.NEXT_PUBLIC_WS_BACKEND_URL || 'ws://localhost:4000/ws';
const WS_AI_URL = process.env.NEXT_PUBLIC_WS_AI_URL || 'ws://localhost:8000/ws';

export const backendWebSocket = new WebSocketManager(WS_BACKEND_URL);
export const aiWebSocket = new WebSocketManager(WS_AI_URL);

export function initializeWebSockets(): void {
  if (typeof window === 'undefined') return;

  backendWebSocket.connect().catch((error) => {
    console.error('[WebSocket] Failed to connect to backend:', error);
  });

  aiWebSocket.connect().catch((error) => {
    console.error('[WebSocket] Failed to connect to AI service:', error);
  });
}

export function cleanupWebSockets(): void {
  backendWebSocket.disconnect();
  aiWebSocket.disconnect();
}
