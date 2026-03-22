# Troubleshooting Guide

Common issues and solutions for API integration and real-time data.

## Table of Contents

1. [Connection Issues](#connection-issues)
2. [Authentication Errors](#authentication-errors)
3. [Data Not Updating](#data-not-updating)
4. [Performance Issues](#performance-issues)
5. [WebSocket Problems](#websocket-problems)
6. [Caching Issues](#caching-issues)
7. [Error Messages](#error-messages)

## Connection Issues

### Issue: "Failed to connect to SmartPay backend"

**Symptoms:**
- API calls timeout
- Error: "Network request failed"
- All dashboards show "Unable to load data"

**Solutions:**

1. **Check Backend is Running**
   ```bash
   # Check if backend is running on port 4000
   curl http://localhost:4000/health
   
   # Check if AI service is running on port 8000
   curl http://localhost:8000/health
   ```

2. **Verify Environment Variables**
   ```bash
   # Check .env.local
   cat .env.local | grep SMARTPAY
   
   # Should show:
   NEXT_PUBLIC_SMARTPAY_BACKEND_URL=http://localhost:4000
   NEXT_PUBLIC_SMARTPAY_AI_URL=http://localhost:8000
   ```

3. **Check Network Connectivity**
   ```bash
   # Test backend connection
   curl -v http://localhost:4000/api/v1/compliance/kri
   
   # Should return JSON data or authentication error
   ```

4. **CORS Configuration**
   
   If you see CORS errors in browser console:
   
   **Backend (Node.js):**
   ```javascript
   // Add to backend server.js
   const cors = require('cors');
   app.use(cors({
     origin: ['http://localhost:3000', 'https://your-domain.com'],
     credentials: true
   }));
   ```
   
   **AI Service (Python):**
   ```python
   # Add to main.py
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
     CORSMiddleware,
     allow_origins=["http://localhost:3000"],
     allow_credentials=True,
     allow_methods=["*"],
     allow_headers=["*"],
   )
   ```

5. **Firewall/Proxy Issues**
   
   If behind corporate firewall:
   ```bash
   # Set proxy environment variables
   export HTTP_PROXY=http://proxy.company.com:8080
   export HTTPS_PROXY=http://proxy.company.com:8080
   ```

### Issue: "Request timeout"

**Symptoms:**
- Requests take > 30 seconds
- Error: "Request timeout after 30000ms"

**Solutions:**

1. **Increase Timeout**
   ```bash
   # In .env.local
   NEXT_PUBLIC_API_TIMEOUT=60000  # 60 seconds
   ```

2. **Check Backend Performance**
   ```bash
   # Monitor backend logs for slow queries
   # Check database connection pool
   # Look for memory issues
   ```

3. **Reduce Concurrent Requests**
   ```typescript
   // Instead of:
   await Promise.all([req1, req2, req3, req4, req5]);
   
   // Try:
   const batch1 = await Promise.all([req1, req2]);
   const batch2 = await Promise.all([req3, req4, req5]);
   ```

## Authentication Errors

### Issue: "Authentication required" (401)

**Symptoms:**
- All API calls return 401
- Error: "Authentication required"
- Login page works but APIs fail

**Solutions:**

1. **Check Supabase Configuration**
   ```bash
   # Verify .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Verify Token**
   ```typescript
   // In browser console
   const supabase = createClient();
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Token:', session?.access_token);
   ```

3. **Check Backend Token Validation**
   ```javascript
   // Backend should validate Supabase JWT
   const { createClient } = require('@supabase/supabase-js');
   
   const supabase = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_SERVICE_ROLE_KEY
   );
   
   // Validate token
   const { data: { user }, error } = await supabase.auth.getUser(token);
   ```

4. **Token Expiry**
   
   Tokens expire after 1 hour. Check if token is expired:
   ```typescript
   const { data: { session } } = await supabase.auth.getSession();
   const expiresAt = new Date(session.expires_at * 1000);
   console.log('Token expires:', expiresAt);
   
   // Refresh if needed
   await supabase.auth.refreshSession();
   ```

### Issue: "Insufficient permissions" (403)

**Symptoms:**
- Some API calls return 403
- User can see some dashboards but not others

**Solutions:**

1. **Check User Role**
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User metadata:', user.user_metadata);
   console.log('User role:', user.user_metadata.role);
   ```

2. **Verify RLS Policies**
   ```sql
   -- Check Supabase RLS policies
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

3. **Update User Role**
   ```typescript
   // Admin operation to update user role
   const { data, error } = await supabase.auth.admin.updateUserById(
     userId,
     { user_metadata: { role: 'admin' } }
   );
   ```

## Data Not Updating

### Issue: Dashboard shows stale data

**Symptoms:**
- Data doesn't update after 60 seconds
- Manual refresh doesn't work
- Last updated timestamp is old

**Solutions:**

1. **Check Polling Status**
   ```typescript
   // In React DevTools or browser console
   const { isPolling, lastUpdated } = useKRIMetrics();
   console.log('Polling active:', isPolling);
   console.log('Last update:', lastUpdated);
   ```

2. **Clear Cache**
   ```typescript
   // In browser console
   import { dashboardCache } from '@/lib/cache/cache-manager';
   dashboardCache.clear();
   
   // Or in component
   const { refresh } = useKRIMetrics();
   refresh();
   ```

3. **Check Backend Updates**
   ```bash
   # Call backend directly
   curl http://localhost:4000/api/v1/compliance/kri
   
   # Compare timestamp with cached version
   ```

4. **Verify Polling Intervals**
   ```bash
   # Check .env.local
   NEXT_PUBLIC_KRI_POLL_INTERVAL=60000
   NEXT_PUBLIC_RECONCILIATION_POLL_INTERVAL=60000
   ```

### Issue: WebSocket not receiving updates

**Symptoms:**
- Transaction feed not updating
- Security events not appearing
- Connection shows as "Connected" but no messages

**Solutions:**

1. **Check WebSocket Connection**
   ```typescript
   // In browser console
   import { backendWebSocket } from '@/lib/websocket/manager';
   console.log('Connected:', backendWebSocket.isConnected());
   console.log('State:', backendWebSocket.getConnectionState());
   ```

2. **Verify Channel Subscription**
   ```typescript
   // Check subscribed channels
   console.log('Subscriptions:', backendWebSocket.subscriptions);
   ```

3. **Test Backend WebSocket**
   ```bash
   # Using wscat (npm install -g wscat)
   wscat -c ws://localhost:4000/ws?token=YOUR_TOKEN
   
   # Send subscribe message
   {"event":"subscribe","channel":"transactions:live"}
   ```

4. **Check Browser Console**
   Look for WebSocket errors:
   - Connection refused
   - Upgrade failed
   - Close code 1006 (abnormal closure)

## Performance Issues

### Issue: Slow dashboard loading

**Symptoms:**
- Initial load takes > 5 seconds
- Multiple spinners visible
- Browser feels sluggish

**Solutions:**

1. **Enable Caching**
   ```typescript
   // Use cached fetch wrapper
   const data = await cachedFetch(
     CACHE_KEYS.KRI_METRICS,
     () => getKRIMetrics(),
     60000
   );
   ```

2. **Batch API Calls**
   ```typescript
   // Parallel loading
   const [kri, reconciliation, alerts] = await Promise.all([
     getKRIMetrics(),
     getReconciliationStatus(),
     getComplianceAlerts(),
   ]);
   ```

3. **Lazy Load Components**
   ```typescript
   import dynamic from 'next/dynamic';
   
   const HeavyChart = dynamic(() => import('./HeavyChart'), {
     loading: () => <Skeleton />,
     ssr: false
   });
   ```

4. **Reduce Polling Frequency**
   ```bash
   # Increase intervals for non-critical data
   NEXT_PUBLIC_KRI_POLL_INTERVAL=120000  # 2 minutes
   ```

### Issue: High memory usage

**Symptoms:**
- Browser tab using > 500MB RAM
- Tab crashes or becomes unresponsive
- Slow rendering

**Solutions:**

1. **Limit Transaction Feed Size**
   ```typescript
   // Reduce max transactions
   const { transactions } = useTransactionFeed(25);  // Instead of 50
   ```

2. **Clear Cache Periodically**
   ```typescript
   // Automatic cache cleanup runs every 5 minutes
   // Force cleanup:
   dashboardCache.cleanup();
   ```

3. **Unsubscribe from WebSockets**
   ```typescript
   useEffect(() => {
     const unsubscribe = backendWebSocket.subscribe(...);
     
     // IMPORTANT: Cleanup on unmount
     return () => unsubscribe();
   }, []);
   ```

4. **Use Virtual Scrolling**
   ```typescript
   // For large lists
   import { FixedSizeList } from 'react-window';
   
   <FixedSizeList
     height={600}
     itemCount={transactions.length}
     itemSize={80}
   >
     {TransactionRow}
   </FixedSizeList>
   ```

## WebSocket Problems

### Issue: WebSocket keeps disconnecting

**Symptoms:**
- Connection status flickers
- "Reconnecting..." message appears frequently
- Real-time updates are intermittent

**Solutions:**

1. **Check Network Stability**
   ```bash
   # Test connection stability
   ping -c 100 localhost
   
   # Monitor WebSocket in browser DevTools (Network tab)
   ```

2. **Increase Heartbeat Interval**
   ```typescript
   // In websocket/manager.ts
   private heartbeatInterval = 45000;  // 45 seconds instead of 30
   ```

3. **Adjust Reconnect Settings**
   ```typescript
   // Allow more reconnect attempts
   private maxReconnectAttempts = 10;  // Instead of 5
   ```

4. **Check Backend WebSocket Config**
   ```javascript
   // Backend should have proper timeout settings
   const wss = new WebSocketServer({
     server: httpServer,
     clientTracking: true,
     perMessageDeflate: false,  // Disable compression if causing issues
   });
   
   // Heartbeat on server side
   setInterval(() => {
     wss.clients.forEach((ws) => {
       if (ws.isAlive === false) return ws.terminate();
       ws.isAlive = false;
       ws.ping();
     });
   }, 30000);
   ```

### Issue: WebSocket URL error

**Symptoms:**
- Error: "Failed to construct WebSocket"
- Connection never establishes

**Solutions:**

1. **Check WebSocket URL Format**
   ```bash
   # Correct formats:
   ws://localhost:4000/ws        # Development
   wss://api.domain.com/ws       # Production (secure)
   
   # WRONG:
   http://localhost:4000/ws      # Missing ws:// protocol
   ws://localhost:4000           # Missing /ws path
   ```

2. **Verify Environment Variables**
   ```bash
   NEXT_PUBLIC_WS_BACKEND_URL=ws://localhost:4000/ws
   NEXT_PUBLIC_WS_AI_URL=ws://localhost:8000/ws
   ```

3. **SSL/TLS for Production**
   ```bash
   # Production must use wss:// (secure WebSocket)
   NEXT_PUBLIC_WS_BACKEND_URL=wss://api.smartpay.ketchup.cc/ws
   ```

## Caching Issues

### Issue: Seeing outdated data after update

**Symptoms:**
- Made changes in backend but UI shows old data
- Manual refresh doesn't help
- Only fixes after clearing browser cache

**Solutions:**

1. **Invalidate Specific Cache**
   ```typescript
   import { dashboardCache } from '@/lib/cache/cache-manager';
   
   // After updating data
   dashboardCache.invalidate(CACHE_KEYS.KRI_METRICS);
   
   // Or invalidate pattern
   dashboardCache.invalidatePattern(/compliance:.*/);
   ```

2. **Force Refresh**
   ```typescript
   // In component
   const { refresh } = useKRIMetrics();
   
   // After mutation
   await updateKRIMetric(data);
   await refresh();  // Force fetch
   ```

3. **Clear All Cache**
   ```typescript
   // In browser console
   dashboardCache.clear();
   localStorage.clear();
   location.reload();
   ```

### Issue: Cache not working

**Symptoms:**
- Every request hits backend
- No performance improvement
- Cache stats show 0 hits

**Solutions:**

1. **Check Cache Configuration**
   ```typescript
   // Verify cache is initialized
   import { dashboardCache } from '@/lib/cache/cache-manager';
   console.log('Cache stats:', dashboardCache.getStats());
   ```

2. **Use Correct Cache Keys**
   ```typescript
   // Always use CACHE_KEYS constants
   import { CACHE_KEYS } from '@/lib/cache/cache-manager';
   
   cachedFetch(CACHE_KEYS.KRI_METRICS, fetchFn);
   // NOT: cachedFetch('kri-metrics', fetchFn);
   ```

3. **Check TTL**
   ```typescript
   // Cache expires too quickly?
   cachedFetch(key, fetchFn, 300000);  // 5 minutes
   ```

## Error Messages

### "Network error: No response received"

**Cause:** Backend is not running or not reachable

**Solution:**
1. Start backend service
2. Check firewall settings
3. Verify URL configuration

### "Request timeout after 30000ms"

**Cause:** Backend is slow or network issue

**Solution:**
1. Increase timeout in .env
2. Optimize backend queries
3. Check database performance

### "Failed to parse WebSocket message"

**Cause:** Invalid JSON in WebSocket message

**Solution:**
1. Check backend WebSocket message format
2. Verify JSON.stringify/parse
3. Look for special characters

### "Token has expired"

**Cause:** JWT token expired (after 1 hour)

**Solution:**
1. Automatic: Supabase will refresh automatically
2. Manual: `await supabase.auth.refreshSession()`
3. Check token expiry time

### "CORS policy: No 'Access-Control-Allow-Origin'"

**Cause:** Backend not configured for CORS

**Solution:**
1. Add CORS middleware to backend
2. Include frontend URL in allowed origins
3. Enable credentials if needed

## Getting Help

### Collect Debug Information

```typescript
// Run in browser console
const debugInfo = {
  // API Client
  backendURL: smartPayAPI.getBaseURL(),
  aiURL: smartPayAI.getBaseURL(),
  
  // WebSocket
  wsConnected: backendWebSocket.isConnected(),
  wsState: backendWebSocket.getConnectionState(),
  
  // Cache
  cacheStats: dashboardCache.getStats(),
  
  // Auth
  session: await supabase.auth.getSession(),
  
  // Environment
  nodeEnv: process.env.NODE_ENV,
  userAgent: navigator.userAgent,
};

console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
```

### Enable Debug Logging

```bash
# In .env.local
NEXT_PUBLIC_API_LOGGING=true
NODE_ENV=development
```

### Check API Health Dashboard

Navigate to `/admin/system/api-health` to see:
- Backend connectivity
- AI service connectivity  
- WebSocket status
- Cache performance
- Endpoint latencies

### Report Issues

When reporting issues, include:
1. Error message (full text)
2. Browser console logs
3. Network tab screenshot
4. Steps to reproduce
5. Debug info (from above)
6. Environment (.env values, excluding secrets)
