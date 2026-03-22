# Health Check and Monitoring Guide

**Related to:** PERF-001 (99.9% Uptime SLA Monitoring)

**Document Version:** 1.0

**Last Updated:** March 18, 2026

---

## Overview

Ketchup Portals provides comprehensive health check endpoints for external monitoring services (UptimeRobot, Datadog, New Relic, PagerDuty) to verify system availability and performance.

This document explains the health check endpoints, their purposes, and how to integrate them with popular monitoring services.

Versioning policy:
- Canonical API namespace is `/api/v1/*`.
- Operational health and cron endpoints keep their original paths (`/api/health/*`, `/api/cron/*`) and now also support versioned aliases (`/api/v1/health/*`, `/api/v1/cron/*`) for consistency.

---

## Health Check Endpoints

### 1. Basic Health Check

**Endpoint:** `GET /api/health`

**Purpose:** Public endpoint for external monitoring services to check system health.

**Authentication:** None (public)

**Response Format:**

```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2026-03-18T10:30:45.123Z",
  "uptime": 3600,
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 12
    },
    "smtp": {
      "status": "up",
      "responseTime": 45
    },
    "sms": {
      "status": "up",
      "responseTime": 23
    }
  }
}
```

**Status Codes:**
- `200 OK`: System is healthy
- `503 Service Unavailable`: System is degraded or unhealthy

**Status Determination:**
- `healthy`: All checks pass
- `degraded`: Non-critical services fail (SMTP, SMS)
- `unhealthy`: Critical service fails (database)

**Response Time:** < 100ms (target)

---

### 2. Detailed Health Check

**Endpoint:** `GET /api/health/detailed`

**Purpose:** Comprehensive health check with performance metrics and resource usage for internal monitoring.

**Authentication:** Required (portal session + `system.monitor` permission)

**Response Format:**

```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2026-03-18T10:30:45.123Z",
  "uptime": 3600,
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 12,
      "poolSize": 20,
      "activeConnections": 5
    },
    "smtp": {
      "status": "up",
      "responseTime": 45
    },
    "sms": {
      "status": "up",
      "responseTime": 23
    }
  },
  "performance": {
    "apiLatency": {
      "p50": 45,
      "p95": 120,
      "p99": 250
    },
    "errorRate": 0.001,
    "requestsPerMinute": 850
  },
  "resources": {
    "memory": {
      "used": 512,
      "total": 2048,
      "percentage": 25
    },
    "cpu": {
      "percentage": 15
    }
  }
}
```

**Status Codes:**
- `200 OK`: System is healthy
- `401 Unauthorized`: No valid session
- `403 Forbidden`: Missing `system.monitor` permission
- `503 Service Unavailable`: System is degraded or unhealthy

**Use Cases:**
- Internal dashboards
- Performance debugging
- Capacity planning
- Incident investigation

---

### 3. Readiness Check

**Endpoint:** `GET /api/health/ready`

**Purpose:** Check if the application is ready to receive traffic (for load balancers and container orchestrators).

**Authentication:** None (public)

**Response Format:**

```json
{
  "ready": true,
  "checks": {
    "migrations": "up-to-date",
    "config": "loaded",
    "services": "initialized"
  }
}
```

**Status Codes:**
- `200 OK`: Application is ready
- `503 Service Unavailable`: Application is not ready

**Use Cases:**
- Kubernetes readiness probes
- Load balancer health checks
- Container orchestration
- Rolling deployments

---

### 4. Liveness Check

**Endpoint:** `GET /api/health/live`

**Purpose:** Verify the application process is alive (for container orchestrators).

**Authentication:** None (public)

**Response Format:**

```json
{
  "alive": true,
  "timestamp": "2026-03-18T10:30:45.123Z"
}
```

**Status Codes:**
- `200 OK`: Process is alive (always, unless completely dead)

**Use Cases:**
- Kubernetes liveness probes
- Container health checks
- Process monitoring

---

## Monitoring Service Integration

### UptimeRobot Configuration

**Monitor Type:** HTTP(s)

**URL:** `https://portal.ketchup.cc/api/health`

**Monitoring Interval:** 1 minute

**Expected Status Code:** 200

**Keyword to Find:** `"healthy"`

**Alert Threshold:** 3 consecutive failures

**Contact Groups:** DevOps Team, On-Call Engineer

**Configuration Example:**

```
Monitor Name: Ketchup Portals - Production
Monitor Type: HTTP(s)
URL: https://portal.ketchup.cc/api/health
Monitoring Interval: Every 1 minute
Timeout: 10 seconds
HTTP Method: GET
Expected Status Code: 200
Keyword to Find: "healthy"
Alert When:
  - Down for 3 consecutive checks
  - Response time > 5000ms
Notifications:
  - Email: devops@ketchup.cc
  - SMS: +264 xxx xxx xxx (On-Call)
  - Slack: #alerts-production
```

---

### Datadog Configuration

**Check Type:** HTTP Check

**Configuration (YAML):**

```yaml
init_config:

instances:
  - name: Ketchup Portals Health
    url: https://portal.ketchup.cc/api/health
    method: GET
    timeout: 10
    http_response_status_code: 200
    content_match: "healthy"
    check_certificate_expiration: true
    days_warning: 14
    days_critical: 7
    tags:
      - service:ketchup-portals
      - env:production
      - team:devops
    min_collection_interval: 60
```

**Monitors:**

1. **Availability Monitor:**
   - Metric: `http.can_connect`
   - Threshold: Alert on 2+ consecutive failures
   - Severity: Critical

2. **Response Time Monitor:**
   - Metric: `http.response_time`
   - Warning: > 1000ms
   - Critical: > 5000ms

3. **Status Monitor:**
   - Metric: Custom check parsing JSON response
   - Alert on `status != "healthy"`

**Dashboard Widgets:**
- Health status indicator (Green/Yellow/Red)
- Response time graph (last 24 hours)
- Uptime percentage (last 7 days)
- Service-specific health (database, SMTP, SMS)

---

### New Relic Configuration

**Monitor Type:** Synthetic Monitor (API Test)

**Configuration:**

```javascript
// New Relic Synthetic Monitor Script
var assert = require('assert');

$http.get('https://portal.ketchup.cc/api/health', {
  headers: {
    'Accept': 'application/json'
  },
  timeout: 10000
}, function(err, response, body) {
  assert.equal(response.statusCode, 200, 'Expected HTTP 200');
  
  var health = JSON.parse(body);
  assert.equal(health.status, 'healthy', 'Expected healthy status');
  
  assert.ok(health.checks.database.status === 'up', 'Database must be up');
  assert.ok(health.checks.database.responseTime < 100, 'Database response time must be < 100ms');
  
  console.log('Health check passed:', health);
});
```

**Alert Policy:**

- **Condition:** Monitor failure
- **Threshold:** 3 consecutive failures
- **Notification Channels:**
  - Email: devops@ketchup.cc
  - PagerDuty: Production On-Call
  - Slack: #alerts-production

**Frequency:** Every 1 minute

**Locations:** Multiple (US East, EU West, Africa)

---

### PagerDuty Integration

**Service Name:** Ketchup Portals - Production

**Integration Type:** Events API v2

**Escalation Policy:**

1. **Level 1:** On-Call Engineer (immediate)
2. **Level 2:** Team Lead (after 15 minutes)
3. **Level 3:** Engineering Manager (after 30 minutes)

**Alert Severity Mapping:**

- **Critical:** Database down (`unhealthy` status)
  - Notify: Immediately
  - Escalate: After 15 minutes
  
- **Warning:** Non-critical service down (`degraded` status)
  - Notify: After 5 minutes
  - Escalate: After 30 minutes
  
- **Info:** High response time (> 1000ms)
  - Notify: Email only (no page)

**Incident Actions:**

1. Check `/api/health/detailed` for full diagnostic info
2. Review recent deployments in Vercel
3. Check Neon Database status
4. Review application logs
5. Escalate if needed

---

### Prometheus + Grafana Configuration

**Prometheus Scrape Config:**

```yaml
scrape_configs:
  - job_name: 'ketchup-portals-health'
    metrics_path: '/api/health'
    scheme: https
    static_configs:
      - targets: ['portal.ketchup.cc']
    scrape_interval: 60s
    scrape_timeout: 10s
```

**Alerting Rules:**

```yaml
groups:
  - name: ketchup_portals_health
    interval: 60s
    rules:
      - alert: SystemUnhealthy
        expr: ketchup_health_status{status="unhealthy"} == 1
        for: 3m
        labels:
          severity: critical
          team: devops
        annotations:
          summary: "Ketchup Portals is unhealthy"
          description: "Database or critical service is down"

      - alert: SystemDegraded
        expr: ketchup_health_status{status="degraded"} == 1
        for: 5m
        labels:
          severity: warning
          team: devops
        annotations:
          summary: "Ketchup Portals is degraded"
          description: "Non-critical service is down (SMTP/SMS)"

      - alert: HighResponseTime
        expr: ketchup_health_response_time_ms > 1000
        for: 5m
        labels:
          severity: warning
          team: devops
        annotations:
          summary: "Health check response time is high"
          description: "Response time is {{ $value }}ms"
```

**Grafana Dashboard:**

Panel 1: **System Status**
- Type: Stat
- Metric: `ketchup_health_status`
- Display: Green (healthy), Yellow (degraded), Red (unhealthy)

Panel 2: **Response Times**
- Type: Graph
- Metrics:
  - `ketchup_health_response_time_ms{service="database"}`
  - `ketchup_health_response_time_ms{service="smtp"}`
  - `ketchup_health_response_time_ms{service="sms"}`

Panel 3: **Uptime Percentage**
- Type: Stat
- Metric: `ketchup_uptime_percentage_7d`
- Target: 99.9%

Panel 4: **Service Health**
- Type: Table
- Columns: Service, Status, Response Time, Last Check

---

## Testing Health Checks

### Manual Testing

**1. Basic Health Check:**

```bash
curl https://portal.ketchup.cc/api/health

# Expected response:
# HTTP 200 OK
# { "status": "healthy", ... }
```

**2. Detailed Health Check:**

```bash
curl https://portal.ketchup.cc/api/health/detailed \
  -H "Cookie: portal-auth=..."

# Expected response:
# HTTP 200 OK (with valid session)
# HTTP 401 Unauthorized (without session)
# HTTP 403 Forbidden (without system.monitor permission)
```

**3. Readiness Check:**

```bash
curl https://portal.ketchup.cc/api/health/ready

# Expected response:
# HTTP 200 OK
# { "ready": true, "checks": { ... } }
```

**4. Liveness Check:**

```bash
curl https://portal.ketchup.cc/api/health/live

# Expected response:
# HTTP 200 OK
# { "alive": true, "timestamp": "..." }
```

---

### Failure Simulation

**1. Simulate Database Failure:**

```bash
# Stop database (local dev):
docker stop neon-postgres

# Check health:
curl https://localhost:3000/api/health

# Expected:
# HTTP 503 Service Unavailable
# { "status": "unhealthy", "checks": { "database": { "status": "down" } } }
```

**2. Simulate Service Degradation:**

```bash
# Temporarily disable SMTP (set invalid env):
# In .env.local: SMTP_HOST=invalid-host

# Restart app and check:
curl https://localhost:3000/api/health

# Expected:
# HTTP 503 Service Unavailable
# { "status": "degraded", "checks": { "smtp": { "status": "down" } } }
```

**3. Verify Response Times:**

```bash
# Check that all response times are < 100ms
curl https://localhost:3000/api/health | jq '.checks[].responseTime'

# Expected: All values < 100
```

---

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Uptime | 99.9% | < 99.9% over 7 days |
| Response Time | < 100ms | > 1000ms for 5 minutes |
| Database Health | Up | Down for 1 minute |
| Error Rate | < 0.1% | > 1% for 5 minutes |
| Recovery Time | < 5 min | > 15 minutes |

---

## Incident Response

### Critical Alert (Unhealthy Status)

**1. Immediate Actions:**
- Check `/api/health/detailed` for diagnostics
- Verify Neon Database status in console
- Check recent deployments in Vercel
- Review application logs

**2. Escalation Path:**
- Notify: On-Call Engineer (immediate)
- Escalate to Team Lead (after 15 min)
- Escalate to Engineering Manager (after 30 min)

**3. Recovery Procedures:**
- Roll back recent deployment (if applicable)
- Restart application (Vercel redeploy)
- Scale up database resources (if needed)
- Restore from backup (last resort)

---

### Warning Alert (Degraded Status)

**1. Investigation:**
- Identify which service is down (SMTP/SMS)
- Check service provider status page
- Review recent configuration changes
- Verify credentials and API keys

**2. Resolution:**
- Fix service configuration
- Contact service provider if needed
- Monitor for recovery
- Document incident for post-mortem

---

## Monitoring Best Practices

1. **Multiple Monitoring Services:** Use at least 2 independent monitoring services for redundancy.

2. **Geographic Diversity:** Monitor from multiple locations to detect regional issues.

3. **Alert Fatigue Prevention:** Set appropriate thresholds to avoid false positives.

4. **Escalation Policy:** Clear escalation path with defined timeouts.

5. **Regular Testing:** Test monitoring alerts monthly to verify they work.

6. **Post-Incident Review:** Document and review all incidents to improve.

7. **Capacity Planning:** Use detailed health metrics to plan resource scaling.

8. **Dashboard Visibility:** Health status visible on team dashboard at all times.

---

## Troubleshooting

### Common Issues

**1. False Positive Alerts:**
- **Cause:** Network issues between monitor and server
- **Solution:** Use multiple monitoring locations

**2. Slow Response Times:**
- **Cause:** Database query performance
- **Solution:** Check database indexes, connection pool

**3. Intermittent Failures:**
- **Cause:** Cold starts, rate limiting
- **Solution:** Keep endpoint warm, adjust rate limits

**4. Authentication Issues (Detailed Endpoint):**
- **Cause:** Session expiry, missing permissions
- **Solution:** Use service account with `system.monitor` permission

---

## Support

For monitoring issues or questions:

- **Email:** devops@ketchup.cc
- **Slack:** #devops-support
- **PagerDuty:** Page On-Call Engineer (emergencies only)
- **Documentation:** See docs/monitoring/

---

**Document Maintained By:** DevOps Team

**Review Frequency:** Quarterly or after major incidents
