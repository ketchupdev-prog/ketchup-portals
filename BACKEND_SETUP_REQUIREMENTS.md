# Backend Setup Requirements

Requirements and specifications for SmartPay Backend and AI services to support Ketchup Portals.

## Table of Contents

1. [Overview](#overview)
2. [SmartPay Backend (Node.js)](#smartpay-backend-nodejs)
3. [SmartPay AI Service (Python)](#smartpay-ai-service-python)
4. [Authentication](#authentication)
5. [WebSocket Endpoints](#websocket-endpoints)
6. [API Endpoints](#api-endpoints)
7. [Data Formats](#data-formats)
8. [Error Handling](#error-handling)

## Overview

Ketchup Portals requires two backend services:

1. **SmartPay Backend** (Node.js) - Port 4000
   - Compliance, financial, security, analytics APIs
   - Transaction processing
   - Reconciliation engine
   - Audit logging

2. **SmartPay AI** (Python) - Port 8000
   - ML model serving
   - Fraud detection
   - Copilot service
   - Predictive analytics

## SmartPay Backend (Node.js)

### Required Technology Stack

- **Node.js**: v18+ or v20+
- **Framework**: Express.js or Fastify
- **Database**: PostgreSQL 14+
- **WebSocket**: ws or socket.io
- **Authentication**: Supabase JWT validation

### Port Configuration

```javascript
const PORT = process.env.PORT || 4000;
const WS_PORT = process.env.WS_PORT || 4000;  // Same port, upgrade HTTP to WS
```

### CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://portals.ketchup.cc',
    process.env.FRONTEND_URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Health Check Endpoint

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      redis: 'connected',
      websocket: 'running'
    }
  });
});
```

### Required npm Packages

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "ws": "^8.13.0",
    "pg": "^8.11.0",
    "@supabase/supabase-js": "^2.39.0",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0"
  }
}
```

## SmartPay AI Service (Python)

### Required Technology Stack

- **Python**: 3.9+ or 3.10+
- **Framework**: FastAPI
- **ML Framework**: TensorFlow or PyTorch
- **Database**: PostgreSQL or MongoDB
- **WebSocket**: FastAPI WebSocket

### Port Configuration

```python
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
```

### CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://portals.ketchup.cc",
        os.getenv("FRONTEND_URL", "*")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Health Check Endpoint

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "models": {
            "fraud_detection": "loaded",
            "transaction_classifier": "loaded",
            "churn_predictor": "loaded"
        }
    }
```

### Required pip Packages

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
tensorflow==2.15.0  # or pytorch
scikit-learn==1.3.2
pandas==2.1.3
numpy==1.26.2
redis==5.0.1
asyncpg==0.29.0
websockets==12.0
```

## Authentication

### Supabase JWT Validation

Both backends must validate Supabase JWT tokens.

**Node.js Example:**
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function authenticateRequest(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Use middleware
app.use('/api/v1', authenticateRequest);
```

**Python Example:**
```python
from supabase import create_client, Client
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

security = HTTPBearer()

async def authenticate(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        user = supabase.auth.get_user(credentials.credentials)
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")

# Use dependency
@app.get("/api/v1/protected")
async def protected_route(user = Depends(authenticate)):
    return {"user_id": user.id}
```

## WebSocket Endpoints

### Backend WebSocket (`ws://localhost:4000/ws`)

**Connection:**
```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ 
  server: httpServer,
  path: '/ws'
});

wss.on('connection', async (ws, req) => {
  // Authenticate via query parameter
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');
  
  if (!token) {
    ws.close(1008, 'Authentication required');
    return;
  }
  
  const user = await validateToken(token);
  if (!user) {
    ws.close(1008, 'Invalid token');
    return;
  }
  
  ws.userId = user.id;
  
  // Handle messages
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    handleWebSocketMessage(ws, message);
  });
  
  // Heartbeat
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
});

// Heartbeat interval
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);
```

**Message Format:**
```javascript
// Subscribe to channel
{
  "event": "subscribe",
  "channel": "transactions:live",
  "timestamp": "2024-03-21T10:30:00Z"
}

// Broadcast message
{
  "channel": "transactions:live",
  "event": "new_transaction",
  "data": {
    "id": "tx-12345",
    "amount": 1500,
    "status": "SUCCESS"
  },
  "timestamp": "2024-03-21T10:30:45Z"
}

// Heartbeat
{
  "event": "ping",
  "timestamp": "2024-03-21T10:31:00Z"
}
```

### AI WebSocket (`ws://localhost:8000/ws`)

**Connection:**
```python
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Authenticate
    token = websocket.query_params.get("token")
    user = await validate_token(token)
    
    if not user:
        await websocket.close(code=1008, reason="Authentication required")
        return
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await handle_websocket_message(websocket, message)
    except WebSocketDisconnect:
        print(f"Client disconnected: {user.id}")
```

## API Endpoints

### Required Compliance Endpoints

```
GET  /api/v1/compliance/kri
GET  /api/v1/compliance/kri/:id
GET  /api/v1/compliance/kri/history?days=90
GET  /api/v1/compliance/bon-reporting
GET  /api/v1/compliance/bon-reporting/:id
POST /api/v1/compliance/bon-reporting/:id/submit
POST /api/v1/compliance/bon-reporting/:id/retry
GET  /api/v1/compliance/alerts
POST /api/v1/compliance/alerts/:id/resolve
GET  /api/v1/compliance/calendar?start=DATE&end=DATE
GET  /api/v1/compliance/kri/export?format=CSV&start=DATE&end=DATE
```

### Required Financial Endpoints

```
GET  /api/v1/compliance/reconciliation/status
GET  /api/v1/compliance/reconciliation/history?days=90
POST /api/v1/compliance/reconciliation/trigger
GET  /api/v1/admin/financial/transactions/metrics?startDate=DATE&endDate=DATE
GET  /api/v1/admin/financial/transactions/feed?limit=100
GET  /api/v1/admin/financial/capital
GET  /api/v1/admin/financial/vouchers
GET  /api/v1/admin/financial/reconciliation/export?format=pdf
GET  /api/v1/admin/financial/transactions/export?startDate=DATE
```

### Required Security Endpoints

```
GET  /api/v1/admin/security/overview
GET  /api/v1/admin/security/fraud
GET  /api/v1/admin/security/fraud/:id
POST /api/v1/admin/security/fraud/:id/status
GET  /api/v1/admin/security/2fa
POST /api/v1/admin/security/2fa/enforce
POST /api/v1/admin/security/2fa/remind
POST /api/v1/admin/security/2fa/exemptions
GET  /api/v1/admin/security/audit?startDate=DATE&limit=100
GET  /api/v1/admin/security/audit/export?format=csv
GET  /api/v1/admin/security/incidents?status=active
GET  /api/v1/admin/security/incidents/stats?period=30d
GET  /api/v1/admin/security/incidents/:id
POST /api/v1/admin/security/incidents
POST /api/v1/admin/security/incidents/:id/status
POST /api/v1/admin/security/incidents/:id/report-bon
```

### Required Analytics Endpoints

```
GET  /api/v1/admin/analytics/system
GET  /api/v1/admin/analytics/uptime
GET  /api/v1/admin/analytics/mobile-app
GET  /api/v1/admin/analytics/transactions?startDate=DATE
GET  /api/v1/admin/analytics/agents
GET  /api/v1/admin/analytics/ussd
GET  /api/v1/admin/analytics/export?format=pdf
GET  /api/v1/admin/analytics/sla-report?month=2024-03
```

### Required AI/ML Endpoints

```
GET  /api/v1/ai/copilot/performance
GET  /api/v1/ai/models/metrics
GET  /api/v1/ai/fraud/metrics
GET  /api/v1/ai/fraud/score/:txId
GET  /api/v1/ai/analytics/predictions?days=30
POST /api/v1/ai/models/:modelName/train
```

### Required System Endpoints

```
GET  /health
GET  /api/v1/system/metrics
```

## Data Formats

### Standard API Response

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  statusCode?: number;
}
```

### KRI Metrics Response

```json
{
  "capitalAdequacyRatio": {
    "currentValue": 125.5,
    "targetValue": 110.0,
    "unit": "%",
    "sevenDayTrend": 2.3,
    "status": "GOOD",
    "lastUpdated": "2024-03-21T10:00:00Z"
  },
  // ... 11 more KRI metrics
}
```

### Transaction Response

```json
{
  "transaction_id": "tx-12345",
  "timestamp": "2024-03-21T10:30:00Z",
  "transaction_type": "send-money",
  "amount": 1500.00,
  "currency": "NAD",
  "from_wallet": "wallet-123",
  "to_wallet": "wallet-456",
  "status": "SUCCESS"
}
```

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "amount",
    "reason": "Must be positive"
  },
  "timestamp": "2024-03-21T10:30:00Z",
  "statusCode": 400
}
```

### Error Codes

- `AUTHENTICATION_ERROR` (401)
- `AUTHORIZATION_ERROR` (403)
- `NOT_FOUND` (404)
- `VALIDATION_ERROR` (422)
- `RATE_LIMIT_ERROR` (429)
- `SERVER_ERROR` (500)

### Rate Limiting

Implement rate limiting:
- 100 requests per minute per user
- 1000 requests per minute per IP
- Return 429 with `Retry-After` header

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,
  message: { error: 'Too many requests' }
});

app.use('/api/v1', limiter);
```

## Deployment Checklist

### Backend (Node.js)
- [ ] Port 4000 configured
- [ ] CORS enabled for frontend URL
- [ ] Supabase JWT validation working
- [ ] WebSocket endpoint at `/ws`
- [ ] All 40+ API endpoints implemented
- [ ] Rate limiting enabled
- [ ] Health check endpoint working
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Logging configured

### AI Service (Python)
- [ ] Port 8000 configured
- [ ] CORS enabled for frontend URL
- [ ] ML models loaded successfully
- [ ] WebSocket endpoint at `/ws`
- [ ] All 6 AI endpoints implemented
- [ ] Health check endpoint working
- [ ] Model versioning implemented
- [ ] Environment variables set
- [ ] Logging configured

### Testing
- [ ] Health endpoints return 200
- [ ] Authentication works with valid token
- [ ] WebSocket connection succeeds
- [ ] Sample data returned from each endpoint
- [ ] CORS headers present
- [ ] Error responses follow standard format
- [ ] Rate limiting triggers correctly

## Example Implementation

See reference implementations:
- Node.js: `/examples/backend-nodejs/`
- Python: `/examples/ai-service-python/`
