# RBAC Implementation Template
## Reusable Pattern for Protecting API Routes (DRY Principle)

**Purpose:** Single source of truth for RBAC implementation across all 100 API routes  
**Status:** Active development template  
**Last Updated:** March 18, 2026

---

## Standard RBAC Pattern (Copy-Paste Template)

### Step 1: Add Imports at Top of File

```typescript
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { getPortalSession } from "@/lib/portal-auth";
```

### Step 2: Add RBAC + Rate Limiting at Start of Handler

```typescript
export async function GET(request: NextRequest) {
  try {
    // RBAC: Require specific permission (SEC-001)
    const auth = await requirePermission(request, "PERMISSION_SLUG", ROUTE);
    if (auth) return auth;

    // Rate limiting (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    // Continue with existing logic...
```

### Step 3: Add Audit Logging for Sensitive Operations

```typescript
    // ... operation completed successfully ...

    // Audit logging: Critical operation (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'ACTION_SLUG',
        resourceType: 'RESOURCE_TYPE',
        resourceId: recordId,
        metadata: {
          // Relevant operation details
        },
      });
    }

    return jsonSuccess(data);
```

---

## Permission Slug Mapping (Quick Reference)

| Route Pattern | Permission Slug | Rate Limit Preset |
|---------------|-----------------|-------------------|
| **Beneficiaries** |
| `GET /beneficiaries` | `beneficiaries.list` | `READ_ONLY` |
| `POST /beneficiaries` | `beneficiaries.list` | `ADMIN` |
| `GET /beneficiaries/[id]` | `beneficiaries.list` | `READ_ONLY` |
| `PUT /beneficiaries/[id]` | `beneficiaries.list` | `ADMIN` |
| `POST /beneficiaries/[id]/sms` | `beneficiaries.sms` | `BULK_SMS` |
| `POST /beneficiaries/bulk-sms` | `beneficiaries.sms` | `BULK_SMS` |
| **Vouchers** |
| `GET /vouchers` | `vouchers.list` | `READ_ONLY` |
| `POST /vouchers/issue` | `vouchers.issue` | `VOUCHER_ISSUE` |
| `GET /vouchers/[id]` | `vouchers.list` | `READ_ONLY` |
| `GET /vouchers/[id]/status` | `vouchers.list` | `READ_ONLY` |
| `GET /vouchers/expiring-soon` | `vouchers.list` | `READ_ONLY` |
| `GET /vouchers/duplicates` | `duplicate_redemptions.list` | `READ_ONLY` |
| `PATCH /vouchers/duplicates/[id]` | `duplicate_redemptions.resolve` | `ADMIN` |
| **Agents** |
| `GET /agents` | `agents.list` | `READ_ONLY` |
| `POST /agents` | `agents.list` | `ADMIN` |
| `GET /agents/[id]` | `agents.list` | `READ_ONLY` |
| `PUT /agents/[id]` | `agents.list` | `ADMIN` |
| `PATCH /agents/[id]/float` | `float_requests.approve` | `FLOAT_APPROVAL` |
| **Reconciliation** |
| `GET /reconciliation/daily` | `reconciliation.view` | `READ_ONLY` |
| `POST /reconciliation/adjustment` | `reconciliation.adjust` | `ADMIN` |
| **Audit Logs** |
| `GET /audit-logs` | `audit.view` | `READ_ONLY` |
| **Programmes** |
| `GET /programmes` | `programmes.list` | `READ_ONLY` |
| `POST /programmes` | `programmes.list` | `ADMIN` |
| `GET /programmes/[id]` | `programmes.list` | `READ_ONLY` |
| `PUT /programmes/[id]` | `programmes.list` | `ADMIN` |
| **Analytics** |
| `GET /analytics/*` | `dashboard.summary` | `READ_ONLY` |

---

## Audit Action Mapping (Quick Reference)

| Operation | Action Slug | Resource Type | When to Log |
|-----------|-------------|---------------|-------------|
| Issue voucher | `voucher.issue` | `voucher` | ✅ Always |
| Expire voucher | `voucher.expire` | `voucher` | ✅ Always |
| Create beneficiary | `beneficiary.create` | `beneficiary` | ✅ Always |
| Update beneficiary | `beneficiary.update` | `beneficiary` | ✅ Always |
| Suspend beneficiary | `beneficiary.suspend` | `beneficiary` | ✅ Always |
| Send SMS | `beneficiary.sms_sent` | `beneficiary` | ✅ Bulk only |
| Approve float | `float_request.approve` | `float_request` | ✅ Always |
| Reject float | `float_request.reject` | `float_request` | ✅ Always |
| Adjust reconciliation | `reconciliation.adjustment` | `reconciliation` | ✅ Always |
| Resolve duplicate | `duplicate_redemption.resolve` | `duplicate_redemption` | ✅ Always |

---

## Complete Example: GET Endpoint (Read-Only)

```typescript
/**
 * GET /api/v1/beneficiaries – List beneficiaries (paginated, filterable).
 * Roles: ketchup_*, gov_* (RBAC enforced: beneficiaries.list permission).
 * Response shape: { data, meta, links } per docs/DATABASE_AND_API_DESIGN.md.
 */

import { NextRequest } from "next/server";
import { listBeneficiaries } from "@/lib/services/beneficiary-service";
import {
  parsePagination,
  paginationLinks,
  jsonPaginated,
  jsonError,
} from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { isValidRegion, normalizeRegion } from "@/lib/regions";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

const ROUTE = "GET /api/v1/beneficiaries";
const basePath = "/api/v1/beneficiaries";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require beneficiaries.list permission (SEC-001)
    const auth = await requirePermission(request, "beneficiaries.list", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    // Existing logic continues unchanged...
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    // ... rest of implementation
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
```

---

## Complete Example: POST Endpoint (Mutation with Audit)

```typescript
/**
 * POST /api/v1/vouchers/issue – Issue single voucher.
 * Roles: ketchup_ops (RBAC enforced: vouchers.issue permission).
 * Secured: RBAC, rate limit, audit logging.
 */

import { NextRequest } from "next/server";
import { issueVoucher } from "@/lib/services/voucher-service";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getPortalSession } from "@/lib/portal-auth";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";

const ROUTE = "POST /api/v1/vouchers/issue";

export async function POST(request: NextRequest) {
  try {
    // RBAC: Require vouchers.issue permission (SEC-001)
    const auth = await requirePermission(request, "vouchers.issue", ROUTE);
    if (auth) return auth;

    // Rate limiting: Voucher issuance (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.VOUCHER_ISSUE);
    if (rateLimitResponse) return rateLimitResponse;

    // ... validate input, issue voucher ...

    const result = await issueVoucher({
      beneficiaryId: beneficiary_id,
      programmeId: programme_id,
      amount,
      expiryDate: expiry_date,
    });

    // Audit logging: Critical financial operation (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'voucher.issue',
        resourceType: 'voucher',
        resourceId: result.id,
        metadata: {
          beneficiaryId: beneficiary_id,
          programmeId: programme_id,
          amount: amount.toString(),
          expiryDate: expiry_date,
        },
      });
    }

    return jsonSuccess({ id: result.id, status: result.status }, { status: 201 });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
```

---

## Boy Scout Rule Checklist

When adding RBAC to existing routes, also:

1. ✅ **Update route JSDoc** to mention RBAC enforcement
2. ✅ **Add descriptive error logging** if missing
3. ✅ **Ensure consistent import order** (stdlib → internal → external)
4. ✅ **Verify `ROUTE` constant** matches actual route path
5. ✅ **Check error responses** use proper status codes (401, 403, 500)
6. ✅ **Add missing TypeScript types** if any parameters are `any`
7. ✅ **Simplify complex logic** if opportunity arises (refactor opportunity)

---

## Testing Checklist

For each protected route, manually verify:

```bash
# 1. Unauthenticated request → 401 Unauthorized
curl -X GET http://localhost:3000/api/v1/beneficiaries
# Expected: { "error": "Unauthorized", "code": "Unauthorized" }

# 2. Authenticated without permission → 403 Forbidden
curl -X GET http://localhost:3000/api/v1/beneficiaries \
  -H "Cookie: portal-auth=<agent_role_token>"
# Expected: { "error": "Forbidden", "code": "Forbidden" }

# 3. Authenticated with permission → 200 OK
curl -X GET http://localhost:3000/api/v1/beneficiaries \
  -H "Cookie: portal-auth=<ketchup_ops_token>"
# Expected: { "data": [...], "meta": {...} }

# 4. Rate limit exceeded → 429 Too Many Requests
for i in {1..300}; do
  curl -X GET http://localhost:3000/api/v1/beneficiaries
done
# Expected (after limit): { "error": "Too Many Requests", "code": "RateLimitExceeded" }
```

---

## Integration Test Template

```typescript
// src/app/api/v1/beneficiaries/__tests__/route.test.ts
describe('GET /api/v1/beneficiaries', () => {
  it('returns 401 when not authenticated', async () => {
    const response = await fetch('/api/v1/beneficiaries');
    expect(response.status).toBe(401);
  });

  it('returns 403 when user lacks beneficiaries.list permission', async () => {
    const response = await authenticatedFetch('/api/v1/beneficiaries', {
      role: 'agent', // agent role does not have beneficiaries.list
    });
    expect(response.status).toBe(403);
  });

  it('returns 200 when user has beneficiaries.list permission', async () => {
    const response = await authenticatedFetch('/api/v1/beneficiaries', {
      role: 'ketchup_ops', // has beneficiaries.list
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
  });

  it('returns 429 when rate limit exceeded', async () => {
    // Make 201 requests (exceeds READ_ONLY limit of 200/min)
    for (let i = 0; i < 201; i++) {
      await authenticatedFetch('/api/v1/beneficiaries', { role: 'ketchup_ops' });
    }
    const response = await authenticatedFetch('/api/v1/beneficiaries', { role: 'ketchup_ops' });
    expect(response.status).toBe(429);
  });
});
```

---

## Common Pitfalls to Avoid

❌ **Don't add RBAC after existing logic**
```typescript
// BAD: RBAC check comes too late
export async function GET(request: NextRequest) {
  const data = await expensiveQuery(); // Already executed before auth!
  const auth = await requirePermission(request, "permission", ROUTE);
  if (auth) return auth;
}
```

✅ **Do add RBAC at the very start**
```typescript
// GOOD: RBAC check happens first
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "permission", ROUTE);
  if (auth) return auth;
  
  const data = await expensiveQuery(); // Only executed if authorized
}
```

---

❌ **Don't forget rate limiting**
```typescript
// BAD: Missing rate limiting (vulnerable to DoS)
const auth = await requirePermission(request, "permission", ROUTE);
if (auth) return auth;
// Continues without rate limit...
```

✅ **Do add rate limiting after RBAC**
```typescript
// GOOD: Both RBAC and rate limiting
const auth = await requirePermission(request, "permission", ROUTE);
if (auth) return auth;

const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
if (rateLimitResponse) return rateLimitResponse;
```

---

❌ **Don't audit read-only operations**
```typescript
// BAD: Audit logging on every GET request (DB bloat)
const data = await listBeneficiaries();

await createAuditLog({ action: 'beneficiary.view' }); // Unnecessary!
```

✅ **Do audit only mutations**
```typescript
// GOOD: Audit only state-changing operations
const result = await updateBeneficiary({ status: 'suspended' });

await createAuditLog({
  action: 'beneficiary.suspend', // Critical mutation
  resourceId: result.id,
});
```

---

## Quick Decision Tree

**Should I add audit logging?**
```
Is this operation:
  - Changing data (POST, PUT, PATCH, DELETE)? → YES, audit log
  - Financial (vouchers, float, reconciliation)? → YES, audit log
  - User management (create, role change)? → YES, audit log
  - Read-only (GET)? → NO, skip audit log
```

**Which rate limit preset?**
```
Endpoint type:
  - Auth (login, register, forgot password)? → RATE_LIMITS.AUTH (5/min)
  - Password change? → RATE_LIMITS.PASSWORD_CHANGE (3/min)
  - Voucher issuance? → RATE_LIMITS.VOUCHER_ISSUE (10/min)
  - Bulk SMS? → RATE_LIMITS.BULK_SMS (5/min)
  - Float approval? → RATE_LIMITS.FLOAT_APPROVAL (20/min)
  - Admin mutations? → RATE_LIMITS.ADMIN (50/min)
  - Read-only? → RATE_LIMITS.READ_ONLY (200/min)
  - Unknown? → RATE_LIMITS.GLOBAL (100/min)
```

---

## File Organization (DRY Principle)

All RBAC implementation uses these shared modules:

```
src/lib/
├── require-permission.ts      ← requirePermission(), requireAnyPermission()
├── permissions.ts              ← LEGACY_ROLE_PERMISSIONS, getPermissionsForUser()
├── middleware/
│   └── rate-limit.ts          ← checkRateLimit(), RATE_LIMITS presets
├── services/
│   └── audit-log-service.ts   ← createAuditLog(), createAuditLogFromRequest()
└── portal-auth.ts             ← getPortalSession()
```

**Never duplicate logic** - always import from these modules.

---

## Document Control

**Created:** March 18, 2026  
**Purpose:** DRY principle - single source of truth for RBAC implementation  
**Owner:** Backend Team  
**Usage:** Copy patterns from this template for all 100 API routes
