# Real-Time Data Architecture

Architecture and implementation details for real-time data updates in Ketchup Portals.

## Table of Contents

1. [Overview](#overview)
2. [Data Freshness Strategy](#data-freshness-strategy)
3. [WebSocket Architecture](#websocket-architecture)
4. [Polling Architecture](#polling-architecture)
5. [Hybrid Approach](#hybrid-approach)
6. [Performance Considerations](#performance-considerations)
7. [Fallback Mechanisms](#fallback-mechanisms)

## Overview

The real-time data architecture combines WebSocket connections for instant updates with polling for aggregated metrics, ensuring optimal performance and reliability.

```
┌─────────────────────────────────────────────────────────┐
│                     React Components                    │
│  ┌──────────────┬──────────────┬──────────────────┐   │
│  │ WebSocket    │  Polling     │  Cached          │   │
│  │ Hooks        │  Hooks       │  Data            │   │
│  └──────┬───────┴──────┬───────┴────────┬─────────┘   │
│         │              │                │             │
│  ┌──────▼──────┐ ┌────▼────────┐ ┌─────▼──────────┐  │
│  │  WebSocket  │ │  Polling    │ │  Cache         │  │
│  │  Manager    │ │  Engine     │ │  Manager       │  │
│  └──────┬──────┘ └────┬────────┘ └─────┬──────────┘  │
│         │              │                │             │
└─────────┼──────────────┼────────────────┼─────────────┘
          │              │                │
          │              │                │
     WebSocket       HTTP Polling      Local Cache
          │              │                │
     ┌────▼──────────────▼────────────────▼─────┐
     │         SmartPay Backend                  │
     └───────────────────────────────────────────┘
```

## Data Freshness Strategy

### Real-Time (< 1s) - WebSocket
- Transaction feed
- Security events
- Critical alerts
- System notifications

### Near Real-Time (30s) - Fast Polling
- System metrics
- Active user counts
- Security dashboard metrics
- API request rates

### Periodic (60s) - Standard Polling
- KRI metrics
- Reconciliation status
- Compliance alerts
- Copilot performance

### On-Demand - User Action
- BON report details
- Transaction details
- Audit log queries
- Export operations

## WebSocket Architecture

### Connection Management

```typescript
// src/lib/websocket/manager.ts

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  
  async connect(): Promise<void> {
    // Automatic connection with auth
    const token = await this.getAuthToken();
    this.ws = new WebSocket(`${this.url}?token=${token}`);
    
    // Event handlers
    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
  }
  
  // Exponential backoff reconnection
  private scheduleReconnect(): void {
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    setTimeout(() => this.connect(), delay);
  }
}
```

### Channel Subscriptions

```typescript
// Subscribe to specific data streams
const unsubscribe = backendWebSocket.subscribe(
  WEBSOCKET_CHANNELS.TRANSACTIONS,
  (transaction) => {
    // Handle new transaction
  }
);

// Multiple subscriptions on same connection
backendWebSocket.subscribe(WEBSOCKET_CHANNELS.SECURITY_EVENTS, handleEvent);
backendWebSocket.subscribe(WEBSOCKET_CHANNELS.ALERTS, handleAlert);
```

### Message Format

```typescript
interface WebSocketMessage<T> {
  channel: string;
  event: string;
  data: T;
  timestamp: string;
}

// Example: Transaction message
{
  channel: "transactions:live",
  event: "new_transaction",
  data: {
    id: "tx-12345",
    amount: 1500,
    status: "SUCCESS",
    // ...
  },
  timestamp: "2024-03-21T10:30:45Z"
}
```

### Heartbeat Mechanism

```typescript
// Ping every 30 seconds
setInterval(() => {
  ws.send(JSON.stringify({ event: 'ping' }));
  
  // Expect pong within 5 seconds
  setTimeout(() => {
    if (!receivedPong) {
      ws.close();  // Triggers reconnection
    }
  }, 5000);
}, 30000);
```

## Polling Architecture

### Generic Polling Hook

```typescript
// src/hooks/usePolling.ts

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  interval: number,
  options?: {
    enabled?: boolean;
    onError?: (error: Error) => void;
    retryOnError?: boolean;
  }
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  isPolling: boolean;
}
```

### Specialized Hooks

```typescript
// KRI Metrics (60s polling)
export function useKRIMetrics() {
  return usePolling(
    () => cachedFetch(CACHE_KEYS.KRI_METRICS, getKRIMetrics),
    60000
  );
}

// System Metrics (30s polling)
export function useSystemMetrics() {
  return usePolling(
    () => cachedFetch(CACHE_KEYS.SYSTEM_HEALTH, fetchSystemMetrics),
    30000
  );
}
```

### Smart Polling

```typescript
// Pause polling when tab is hidden
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Stop polling
    } else {
      // Resume polling and refresh
      refresh();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

## Hybrid Approach

### Use Case: Transaction Monitoring

```typescript
function TransactionDashboard() {
  // Real-time transaction feed via WebSocket
  const { transactions, isConnected } = useTransactionFeed(50);
  
  // Aggregated metrics via polling (60s)
  const { data: metrics } = usePolling(
    () => getTransactionMetrics({ period: '24h' }),
    60000
  );
  
  return (
    <div>
      {/* Show real-time indicator */}
      {isConnected && <Badge>Live</Badge>}
      
      {/* Aggregated metrics */}
      <MetricsCards data={metrics} />
      
      {/* Real-time transaction feed */}
      <TransactionFeed transactions={transactions} />
    </div>
  );
}
```

### Use Case: Security Dashboard

```typescript
function SecurityDashboard() {
  // Real-time security events via WebSocket
  const { events } = useSecurityEvents(100);
  
  // Security overview via polling (30s)
  const { data: overview } = usePolling(
    () => getSecurityOverview(),
    30000
  );
  
  // Cached fraud metrics (60s)
  const { data: fraudMetrics } = usePolling(
    () => cachedFetch(CACHE_KEYS.FRAUD_METRICS, getFraudDetectionMetrics),
    60000
  );
  
  return (
    <div>
      <SecurityOverview data={overview} />
      <FraudMetrics data={fraudMetrics} />
      <SecurityEventFeed events={events} />
    </div>
  );
}
```

## Performance Considerations

### 1. Request Batching

```typescript
// BAD: Multiple sequential requests
const kri = await getKRIMetrics();
const bon = await getBonReportQueue();
const alerts = await getComplianceAlerts();

// GOOD: Parallel requests
const [kri, bon, alerts] = await Promise.all([
  getKRIMetrics(),
  getBonReportQueue(),
  getComplianceAlerts(),
]);
```

### 2. Caching Strategy

```typescript
// Layer 1: In-memory cache (fastest)
dashboardCache.set(key, data, 60000);

// Layer 2: Component state (React Query)
const { data } = useQuery(['kri-metrics'], getKRIMetrics, {
  staleTime: 60000,
  cacheTime: 300000,
});

// Layer 3: LocalStorage (persistent)
persistentCache.set(key, data, 600000);
```

### 3. Debouncing & Throttling

```typescript
// Debounce search inputs
const debouncedSearch = useMemo(
  () => debounce((value) => fetchSearchResults(value), 500),
  []
);

// Throttle scroll events
const throttledScroll = useMemo(
  () => throttle(() => loadMoreData(), 1000),
  []
);
```

### 4. WebSocket Message Batching

```typescript
// Buffer messages and process in batches
class MessageBuffer {
  private buffer: Message[] = [];
  private batchSize = 10;
  private flushInterval = 100;
  
  add(message: Message) {
    this.buffer.push(message);
    
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }
  
  flush() {
    if (this.buffer.length > 0) {
      processMessages(this.buffer);
      this.buffer = [];
    }
  }
}
```

## Fallback Mechanisms

### 1. WebSocket → Polling Fallback

```typescript
function useRealtimeData<T>(
  channel: string,
  pollingFn: () => Promise<T>,
  pollingInterval: number
) {
  const [data, setData] = useState<T | null>(null);
  const wsConnected = backendWebSocket.isConnected();
  
  // WebSocket subscription
  useEffect(() => {
    if (wsConnected) {
      return backendWebSocket.subscribe(channel, setData);
    }
  }, [wsConnected, channel]);
  
  // Fallback to polling if WebSocket unavailable
  usePolling(pollingFn, pollingInterval, {
    enabled: !wsConnected,
    onSuccess: setData,
  });
  
  return data;
}
```

### 2. Cached Data During Failures

```typescript
async function fetchWithCacheFallback<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  try {
    const data = await fetchFn();
    dashboardCache.set(cacheKey, data);
    return data;
  } catch (error) {
    // Return stale cache on error
    const cached = dashboardCache.get<T>(cacheKey);
    if (cached) {
      console.warn('Using stale cache due to API error');
      return cached;
    }
    throw error;
  }
}
```

### 3. Graceful Degradation

```typescript
function Dashboard() {
  const { data, error, loading } = useKRIMetrics();
  
  if (error && !data) {
    return <ErrorState message="Unable to load metrics" />;
  }
  
  if (error && data) {
    // Show stale data with warning
    return (
      <>
        <Alert variant="warning">
          Showing cached data. Live updates unavailable.
        </Alert>
        <MetricsDisplay data={data} isStale />
      </>
    );
  }
  
  return <MetricsDisplay data={data} />;
}
```

### 4. Offline Support

```typescript
// Service worker for offline caching
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((response) => {
        const responseClone = response.clone();
        caches.open('api-cache').then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      });
    })
  );
});
```

## Monitoring & Observability

### 1. Connection Health

```typescript
// Track WebSocket connection health
const wsHealth = {
  connected: backendWebSocket.isConnected(),
  lastMessage: Date.now(),
  reconnectCount: reconnectAttempts,
  latency: measureLatency(),
};

// Display in UI
<ConnectionIndicator health={wsHealth} />
```

### 2. API Latency Tracking

```typescript
async function trackAPICall<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    
    // Log metrics
    console.log(`[API] ${name}: ${duration}ms`);
    
    // Send to monitoring service
    sendMetric('api.latency', duration, { endpoint: name });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    sendMetric('api.error', 1, { endpoint: name, duration });
    throw error;
  }
}
```

### 3. Cache Hit Rate

```typescript
const cacheStats = dashboardCache.getStats();

console.log(`Cache hit rate: ${
  (cacheStats.totalHits / cacheStats.size) * 100
}%`);
```

## Best Practices

1. **Use WebSocket for Event Streams**
   - Individual transactions
   - Security events
   - Real-time alerts

2. **Use Polling for Aggregated Data**
   - Dashboard metrics
   - Statistical data
   - Historical trends

3. **Implement Proper Cleanup**
   ```typescript
   useEffect(() => {
     const unsubscribe = backendWebSocket.subscribe(...);
     return () => unsubscribe();
   }, []);
   ```

4. **Handle Connection States**
   - Show connection status in UI
   - Provide manual refresh button
   - Display last update timestamp

5. **Optimize Polling Intervals**
   - Critical data: 30s
   - Standard data: 60s
   - Background data: 5 minutes
   - Adjust based on user activity

6. **Use Exponential Backoff**
   - Retry failed requests
   - Increase delay between retries
   - Limit maximum retry attempts

7. **Implement Circuit Breakers**
   - Stop polling after multiple failures
   - Switch to cached data
   - Notify user of degraded service
