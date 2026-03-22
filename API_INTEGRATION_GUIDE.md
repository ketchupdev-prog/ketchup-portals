# API Integration Guide

Complete guide to API integration between Ketchup Portals and SmartPay backend/AI services.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Unified API Client](#unified-api-client)
3. [Dashboard APIs](#dashboard-apis)
4. [WebSocket Connections](#websocket-connections)
5. [Authentication](#authentication)
6. [Error Handling](#error-handling)
7. [Caching Strategy](#caching-strategy)
8. [Testing](#testing)

## Architecture Overview

The API integration layer connects all admin dashboards to two backend services:

```
┌─────────────────────────────────────────────────────────────┐
│                    Ketchup Portals                          │
│  ┌────────────┬────────────┬────────────┬──────────────┐  │
│  │ Compliance │ Financial  │  Security  │  Analytics   │  │
│  │ Dashboard  │ Dashboard  │  Dashboard │  Dashboard   │  │
│  └─────┬──────┴─────┬──────┴─────┬──────┴──────┬───────┘  │
│        │            │            │             │           │
│  ┌─────▼────────────▼────────────▼─────────────▼───────┐  │
│  │         Unified API Client (client.ts)              │  │
│  │  - Authentication (JWT from Supabase)               │  │
│  │  - Retry logic (3 attempts, exponential backoff)    │  │
│  │  - Error handling & logging                         │  │
│  │  - Timeout configuration (30s default)              │  │
│  └────────────────┬──────────────┬────────────────────┘  │
└───────────────────┼──────────────┼───────────────────────┘
                    │              │
        ┌───────────▼────┐    ┌────▼──────────┐
        │  SmartPay      │    │  SmartPay     │
        │  Backend       │    │  AI Service   │
        │  (Node.js)     │    │  (Python)     │
        │  Port 4000     │    │  Port 8000    │
        └────────────────┘    └───────────────┘
```

## Unified API Client

### Location
`src/lib/api/client.ts`

### Features

1. **Centralized Configuration**
   - Base URL configuration
   - Timeout settings (default: 30s)
   - Retry logic (3 attempts with exponential backoff)
   - Request/response logging (dev mode only)

2. **Authentication**
   - Automatic JWT token injection from Supabase
   - Token refresh handling
   - Auth error recovery

3. **Error Handling**
   - Automatic error classification
   - User-friendly error messages
   - Detailed error logging
   - Retry on network/timeout errors

### Usage

```typescript
import { smartPayAPI, smartPayAI } from '@/lib/api/client';

// SmartPay Backend request
const data = await smartPayAPI.get<KRIMetrics>('/api/v1/compliance/kri');

// SmartPay AI request
const performance = await smartPayAI.get<CopilotPerformance>('/api/v1/ai/copilot/performance');

// POST request with data
const result = await smartPayAPI.post('/api/v1/compliance/bon-reporting/submit', {
  reportId: 'report-123',
  data: { ... }
});
```

### Configuration

```typescript
export const smartPayAPI = new APIClient({
  baseURL: process.env.NEXT_PUBLIC_SMARTPAY_BACKEND_URL || 'http://localhost:4000',
  timeout: 30000,
  retries: 3,
  withAuth: true,
  logRequests: process.env.NODE_ENV === 'development',
});
```

## Dashboard APIs

### Compliance API (`src/lib/api/compliance.ts`)

Connects to SmartPay backend for compliance metrics, BON reporting, and regulatory calendar.

**Key Endpoints:**
- `GET /api/v1/compliance/kri` - KRI metrics (12 indicators)
- `GET /api/v1/compliance/bon-reporting` - BON report queue
- `GET /api/v1/compliance/alerts` - Compliance alerts
- `GET /api/v1/compliance/calendar` - Regulatory calendar
- `POST /api/v1/compliance/bon-reporting/:id/submit` - Submit BON report

**Usage:**
```typescript
import { getKRIMetrics, getBonReportQueue } from '@/lib/api/compliance';

const kriResponse = await getKRIMetrics();
if (kriResponse.success) {
  console.log(kriResponse.data);
}
```

### Financial API (`src/lib/api/financial.ts`)

Connects to SmartPay backend for reconciliation, transaction monitoring, and capital adequacy.

**Key Endpoints:**
- `GET /api/v1/compliance/reconciliation/status` - Current reconciliation status
- `GET /api/v1/compliance/reconciliation/history` - Historical reconciliation data
- `GET /api/v1/admin/financial/transactions/metrics` - Transaction metrics
- `GET /api/v1/admin/financial/transactions/feed` - Real-time transaction feed
- `GET /api/v1/admin/financial/capital` - Capital adequacy metrics

**Usage:**
```typescript
import { getReconciliationStatus, getTransactionMetrics } from '@/lib/api/financial';

const status = await getReconciliationStatus();
const metrics = await getTransactionMetrics({ startDate: '2024-01-01' });
```

### Security API (`src/lib/api/security.ts`)

Connects to SmartPay backend for security metrics, audit logs, and incident management.

**Key Endpoints:**
- `GET /api/v1/admin/security/overview` - Security overview
- `GET /api/v1/admin/security/fraud` - Fraud detection metrics
- `GET /api/v1/admin/security/audit` - Audit logs
- `GET /api/v1/admin/security/incidents` - Security incidents
- `POST /api/v1/admin/security/incidents/:id/report-bon` - Report incident to BON

**Usage:**
```typescript
import { getSecurityOverview, getAuditLogs } from '@/lib/api/security';

const overview = await getSecurityOverview();
const logs = await getAuditLogs({ 
  startDate: '2024-01-01',
  action: 'login',
  limit: 100 
});
```

### Analytics API (`src/lib/api/analytics.ts`)

Connects to SmartPay backend for system metrics, uptime monitoring, and usage analytics.

**Key Endpoints:**
- `GET /api/v1/admin/analytics/system` - System metrics
- `GET /api/v1/admin/analytics/uptime` - Uptime metrics
- `GET /api/v1/admin/analytics/mobile-app` - Mobile app analytics
- `GET /api/v1/admin/analytics/transactions` - Transaction analytics

**Usage:**
```typescript
import { getSystemMetrics, getUptimeMetrics } from '@/lib/api/analytics';

const systemMetrics = await getSystemMetrics();
const uptime = await getUptimeMetrics();
```

### AI/ML API (`src/lib/api/ai-ml.ts`)

Connects to SmartPay AI service for ML models, fraud detection, and predictive analytics.

**Key Endpoints:**
- `GET /api/v1/ai/copilot/performance` - Copilot performance metrics
- `GET /api/v1/ai/models/metrics` - ML model metrics
- `GET /api/v1/ai/fraud/metrics` - Fraud detection metrics
- `GET /api/v1/ai/fraud/score/:txId` - Transaction risk score
- `GET /api/v1/ai/analytics/predictions` - Predictive analytics

**Usage:**
```typescript
import { getCopilotPerformance, getTransactionRiskScore } from '@/lib/api/ai-ml';

const performance = await getCopilotPerformance();
const riskScore = await getTransactionRiskScore('tx-12345');
```

## WebSocket Connections

### Location
`src/lib/websocket/manager.ts`

### Features

1. **Automatic Reconnection**
   - Max 5 reconnection attempts
   - Exponential backoff (1s, 2s, 4s, 8s, 16s)
   - Connection state monitoring

2. **Channel Subscriptions**
   - Multiple simultaneous subscriptions
   - Automatic channel re-subscription on reconnect
   - Per-channel message callbacks

3. **Heartbeat Monitoring**
   - Ping/pong every 30 seconds
   - Auto-reconnect on heartbeat timeout
   - Connection health tracking

### Available Channels

```typescript
export const WEBSOCKET_CHANNELS = {
  SECURITY_EVENTS: 'security:events',
  TRANSACTIONS: 'transactions:live',
  SYSTEM_METRICS: 'system:metrics',
  ALERTS: 'alerts:critical',
  COMPLIANCE_UPDATES: 'compliance:updates',
  AUDIT_LOGS: 'audit:logs',
} as const;
```

### Usage

```typescript
import { backendWebSocket, WEBSOCKET_CHANNELS } from '@/lib/websocket/manager';

// Initialize connection
await backendWebSocket.connect();

// Subscribe to transactions
const unsubscribe = backendWebSocket.subscribe(
  WEBSOCKET_CHANNELS.TRANSACTIONS,
  (transaction) => {
    console.log('New transaction:', transaction);
  }
);

// Unsubscribe
unsubscribe();

// Disconnect
backendWebSocket.disconnect();
```

### React Hooks

```typescript
import { useTransactionFeed } from '@/hooks/useTransactionFeed';

function Component() {
  const { transactions, isConnected } = useTransactionFeed(50);
  
  return (
    <div>
      {isConnected && <Badge>Live</Badge>}
      {transactions.map(tx => <TransactionCard key={tx.id} data={tx} />)}
    </div>
  );
}
```

## Authentication

All API requests automatically include JWT authentication from Supabase.

### Flow

1. Client requests session from Supabase
2. Session token is extracted
3. Token is added to `Authorization: Bearer <token>` header
4. Backend validates token with Supabase
5. Request is processed

### Token Refresh

- Tokens are automatically refreshed by Supabase SDK
- API client fetches fresh token on each request
- No manual token management required

## Error Handling

### Error Types

```typescript
// Base error
class APIError extends Error {
  status: number;
  code: string;
  details?: any;
}

// Specific errors
class AuthenticationError extends APIError   // 401
class AuthorizationError extends APIError    // 403
class NotFoundError extends APIError         // 404
class TimeoutError extends APIError          // 408
class RateLimitError extends APIError        // 429
class ServerError extends APIError           // 500+
class NetworkError extends APIError          // Network failure
```

### Usage

```typescript
import { handleAPIError, getUserFriendlyMessage } from '@/lib/errors/error-handler';

try {
  const data = await getKRIMetrics();
} catch (error) {
  const apiError = handleAPIError(error);
  const message = getUserFriendlyMessage(apiError);
  toast.error(message);
}
```

### Automatic Retry

Certain errors trigger automatic retry:
- Network errors
- Timeout errors
- Server errors (5xx)
- Rate limit errors (429)

Retry uses exponential backoff: 1s, 2s, 4s (max 3 attempts).

## Caching Strategy

### Location
`src/lib/cache/cache-manager.ts`

### Features

1. **In-Memory Cache**
   - TTL-based expiration
   - LRU eviction policy
   - Automatic cleanup
   - Hit/miss tracking

2. **Persistent Cache (LocalStorage)**
   - Survives page refreshes
   - User-specific data
   - TTL-based expiration

### Usage

```typescript
import { cachedFetch, CACHE_KEYS } from '@/lib/cache/cache-manager';

// Cached API call
const data = await cachedFetch(
  CACHE_KEYS.KRI_METRICS,
  () => getKRIMetrics(),
  60000  // 60 second TTL
);

// Manual cache operations
import { dashboardCache } from '@/lib/cache/cache-manager';

dashboardCache.set('my-key', data, 30000);
const cached = dashboardCache.get('my-key');
dashboardCache.invalidate('my-key');
```

### Cache Keys

```typescript
export const CACHE_KEYS = {
  KRI_METRICS: 'compliance:kri-metrics',
  RECONCILIATION_STATUS: 'financial:reconciliation-status',
  SECURITY_EVENTS: 'security:events',
  // ... more keys
} as const;
```

## Testing

### Integration Tests

Location: `__tests__/integration/api-integration.test.ts`

Run tests:
```bash
npm test
```

### Manual Testing

1. **Start Backend Services**
   ```bash
   # SmartPay Backend
   cd /path/to/smartpay-backend
   npm start  # Port 4000
   
   # SmartPay AI
   cd /path/to/smartpay-ai
   python main.py  # Port 8000
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with correct URLs
   ```

3. **Test API Health**
   Navigate to: `/admin/system/api-health`

4. **Test Individual Dashboards**
   - Compliance: `/admin/compliance/kri`
   - Financial: `/admin/financial/reconciliation`
   - Security: `/admin/security/overview`
   - Analytics: `/admin/analytics/system`
   - AI/ML: `/admin/ai-ml/copilot`

### Mock Data

Enable mock data for development:
```bash
NEXT_PUBLIC_USE_MOCK_COMPLIANCE=true
NEXT_PUBLIC_USE_MOCK_FINANCIAL=true
NEXT_PUBLIC_USE_MOCK_SECURITY=true
NEXT_PUBLIC_USE_MOCK_ANALYTICS=true
NEXT_PUBLIC_USE_MOCK_AI_ML=true
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure SmartPay backend allows `http://localhost:3000`
   - Check backend CORS configuration

2. **Authentication Failures**
   - Verify Supabase configuration
   - Check JWT token validity
   - Ensure backend validates Supabase tokens

3. **Timeout Errors**
   - Check network connectivity
   - Verify backend is running
   - Increase timeout: `NEXT_PUBLIC_API_TIMEOUT=60000`

4. **WebSocket Connection Failures**
   - Check WebSocket URL configuration
   - Verify firewall/proxy settings
   - Check browser console for errors

### Debug Mode

Enable detailed logging:
```bash
NEXT_PUBLIC_API_LOGGING=true
NODE_ENV=development
```

View logs in browser console:
- API requests/responses
- WebSocket messages
- Cache operations
- Error details

## Performance Optimization

1. **Polling Intervals**
   - KRI Metrics: 60s
   - Reconciliation: 60s
   - Security Events: 30s (WebSocket preferred)
   - System Metrics: 30s

2. **Cache TTLs**
   - Dashboard data: 60s
   - Static data: 5 minutes
   - Historical data: 10 minutes

3. **Batch Requests**
   - Use Promise.all() for independent requests
   - Combine related data in single endpoint

4. **WebSocket vs Polling**
   - Use WebSocket for real-time data (transactions, security events)
   - Use polling for aggregated metrics (KRI, reconciliation)

## Next Steps

1. Review backend API documentation
2. Set up backend services locally
3. Configure environment variables
4. Run integration tests
5. Test each dashboard individually
6. Monitor API health dashboard
