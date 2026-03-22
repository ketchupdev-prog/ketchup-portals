# Integration Tests Documentation

**Last Updated:** March 18, 2026  
**Author:** Backend Engineering Team  
**Status:** ✅ Active

---

## Table of Contents

1. [Overview](#overview)
2. [Test Coverage](#test-coverage)
3. [Running Tests Locally](#running-tests-locally)
4. [Test Structure](#test-structure)
5. [Test Utilities](#test-utilities)
6. [Test Data](#test-data)
7. [Debugging Tests](#debugging-tests)
8. [CI/CD Integration](#cicd-integration)
9. [Coverage Goals](#coverage-goals)
10. [Best Practices](#best-practices)

---

## Overview

This test suite provides comprehensive integration testing for RBAC-protected API routes in the Ketchup Portals project. The tests cover:

- **RBAC (Role-Based Access Control):** 20+ test cases
- **Rate Limiting:** 10+ test cases
- **Audit Logging:** 10+ test cases
- **Endpoint-Specific Tests:** 30+ test cases

**Total Test Cases:** 70+

**Testing Framework:** Vitest (recommended for Next.js 16)

---

## Test Coverage

### Test Categories

#### 1. RBAC Tests (`src/app/api/v1/__tests__/rbac.test.ts`)

- ✅ Unauthenticated requests → 401 Unauthorized
- ✅ Authenticated without permission → 403 Forbidden
- ✅ Authenticated with correct permission → 200 OK
- ✅ Multiple permission options (requireAnyPermission)
- ✅ Role-specific access patterns (ketchup_ops, ketchup_finance, agent, etc.)

#### 2. Rate Limiting Tests (`src/app/api/v1/__tests__/rate-limit.test.ts`)

- ✅ READ_ONLY preset: 201st request → 429
- ✅ ADMIN preset: 51st request → 429
- ✅ AUTH preset: 6th request → 429
- ✅ Retry-After header present in 429 response
- ✅ Rate limit resets after window expires
- ✅ Different users have separate limits

#### 3. Audit Logging Tests (`src/app/api/v1/__tests__/audit-logging.test.ts`)

- ✅ Critical mutations create audit logs (voucher issue, float adjust)
- ✅ Audit log contains correct fields (userId, action, resourceType, resourceId, metadata)
- ✅ IP address and User-Agent captured
- ✅ Metadata JSON structure is correct
- ✅ Read-only operations do NOT create audit logs
- ✅ Failed operations do NOT create audit logs

#### 4. Endpoint-Specific Tests (`src/app/api/v1/__tests__/endpoints.test.ts`)

- ✅ Beneficiaries API (pagination, filtering, RBAC)
- ✅ Vouchers API (issuance with audit)
- ✅ Agents API (float adjustment with CRITICAL audit)
- ✅ Programmes API (CRUD operations)
- ✅ Reconciliation API (CRITICAL audit)
- ✅ Audit Logs API (no self-logging)

---

## Running Tests Locally

### Prerequisites

1. **Node.js 20+** installed
2. **PostgreSQL database** (Neon or local)
3. **Environment variables** configured

### Setup Test Database

Option 1: Use Neon test branch (recommended)

```bash
# Create a test branch in Neon
neon branches create test-$(date +%s) --parent main
```

Option 2: Use local PostgreSQL

```bash
# Create test database
createdb ketchup_test

# Set environment variable
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ketchup_test"
```

### Install Dependencies

```bash
npm install
```

### Run Migrations

```bash
npm run db:push
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/app/api/v1/__tests__/rbac.test.ts

# Run tests with coverage
npm test -- --coverage

# Run tests with UI
npm test -- --ui
```

### Environment Variables

Create a `.env.test` file:

```env
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ketchup_test
TEST_BASE_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret-key
```

---

## Test Structure

### File Organization

```
src/
├── app/
│   └── api/
│       └── v1/
│           └── __tests__/
│               ├── rbac.test.ts          # RBAC tests
│               ├── rate-limit.test.ts    # Rate limiting tests
│               ├── audit-logging.test.ts # Audit logging tests
│               └── endpoints.test.ts     # Endpoint-specific tests
└── lib/
    └── test-utils/
        ├── index.ts                      # Test utilities
        └── seed-data.ts                  # Test data seeding
```

### Test File Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  authenticatedFetch,
  getTestBaseUrl,
  assertJsonResponse,
} from '@/lib/test-utils';
import { seedAllTestData, cleanupTestData } from '@/lib/test-utils/seed-data';

const BASE_URL = getTestBaseUrl();

beforeAll(async () => {
  await seedAllTestData();
});

afterAll(async () => {
  await cleanupTestData();
});

describe('Feature Name', () => {
  it('should do something', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/endpoint`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    expect(data).toHaveProperty('expectedField');
  });
});
```

---

## Test Utilities

### Core Utilities (`src/lib/test-utils/index.ts`)

#### `createTestSession(role, userId?, email?)`

Create a test JWT token for authentication.

```typescript
const token = createTestSession('ketchup_ops');
// Returns: base64url encoded JWT payload
```

#### `authenticatedFetch(url, role, options?)`

Make an authenticated HTTP request.

```typescript
const response = await authenticatedFetch(
  '/api/v1/beneficiaries',
  'ketchup_ops'
);
```

#### `unauthenticatedFetch(url, options?)`

Make an unauthenticated HTTP request (for testing 401).

```typescript
const response = await unauthenticatedFetch('/api/v1/beneficiaries');
expect(response.status).toBe(401);
```

#### `assertJsonResponse(response, expectedStatus)`

Assert response status and parse JSON.

```typescript
const data = await assertJsonResponse(response, 200);
expect(data).toHaveProperty('data');
```

#### `getRetryAfter(response)`

Extract Retry-After header from 429 response.

```typescript
const retryAfter = getRetryAfter(response);
expect(retryAfter).toBeGreaterThan(0);
```

#### `waitForRateLimitReset(windowSeconds)`

Wait for rate limit window to reset.

```typescript
await waitForRateLimitReset(60); // Wait 60 seconds
```

### Test Data Utilities (`src/lib/test-utils/seed-data.ts`)

#### `seedAllTestData()`

Seed all test data (users, beneficiaries, agents, programmes, vouchers).

```typescript
await seedAllTestData();
```

#### `cleanupTestData()`

Clean up test data after tests.

```typescript
await cleanupTestData();
```

---

## Test Data

### Test Users

| Role | User ID | Email | Password |
|------|---------|-------|----------|
| ketchup_ops | `00000000-0000-0000-0000-000000000001` | ketchup_ops@test.com | TestPassword123! |
| ketchup_finance | `00000000-0000-0000-0000-000000000002` | ketchup_finance@test.com | TestPassword123! |
| ketchup_compliance | `00000000-0000-0000-0000-000000000003` | ketchup_compliance@test.com | TestPassword123! |
| gov_manager | `00000000-0000-0000-0000-000000000005` | gov_manager@test.com | TestPassword123! |
| agent | `00000000-0000-0000-0000-000000000007` | agent@test.com | TestPassword123! |

### Test Beneficiaries

- 5 test beneficiaries in different regions (Khomas, Erongo, Otjozondjupa, Oshana)
- IDs: `10000000-0000-0000-0000-00000000000X`

### Test Agents

- 3 test agents with varying float balances
- IDs: `20000000-0000-0000-0000-00000000000X`

### Test Programmes

- 2 test programmes (Food Vouchers, Education Support)
- IDs: `30000000-0000-0000-0000-00000000000X`

### Test Vouchers

- 3 test vouchers (available, redeemed, available)
- IDs: `40000000-0000-0000-0000-00000000000X`

---

## Debugging Tests

### Verbose Output

```bash
npm test -- --reporter=verbose
```

### Run Single Test

```bash
npm test -- --grep "should return 401 for unauthenticated request"
```

### Debug Mode

```bash
npm test -- --inspect-brk
# Open chrome://inspect in Chrome
```

### View Test Logs

```bash
npm test -- --reporter=dot 2>&1 | tee test.log
```

### Common Issues

#### 1. Database Connection Errors

```bash
# Check database is running
psql $DATABASE_URL -c "SELECT 1"

# Reset database
npm run db:push
```

#### 2. Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

#### 3. Test Data Conflicts

```bash
# Clean up test data manually
npm run test -- --cleanup-only
```

#### 4. Rate Limit Flakiness

```bash
# Increase timeouts in rate-limit.test.ts
# Or run rate limit tests in isolation
npm test -- src/app/api/v1/__tests__/rate-limit.test.ts
```

---

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- **Pull Requests** to `main` or `develop`
- **Pushes** to `main` or `develop`

### Workflow Steps

1. **Checkout code**
2. **Setup Node.js 20**
3. **Install dependencies**
4. **Setup PostgreSQL test database**
5. **Run migrations**
6. **Run tests with coverage**
7. **Upload coverage reports to Codecov**
8. **Comment PR with coverage**

### View Results

- **GitHub Actions:** https://github.com/{org}/{repo}/actions
- **Codecov:** https://codecov.io/gh/{org}/{repo}

---

## Coverage Goals

### Target: 75% Coverage

| Metric | Target | Current |
|--------|--------|---------|
| Lines | 75% | TBD |
| Functions | 75% | TBD |
| Branches | 70% | TBD |
| Statements | 75% | TBD |

### Generate Coverage Report

```bash
npm test -- --coverage
```

### View Coverage HTML Report

```bash
open coverage/index.html
```

### Exclude from Coverage

```typescript
/* istanbul ignore next */
function debugOnlyFunction() {
  // This won't count towards coverage
}
```

---

## Best Practices

### 1. DRY Principle

Use test utilities to avoid duplication:

```typescript
// ✅ Good: Use utility
const response = await authenticatedFetch('/api/v1/beneficiaries', 'ketchup_ops');

// ❌ Bad: Duplicate auth logic
const token = createTestSession('ketchup_ops');
const response = await fetch('/api/v1/beneficiaries', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 2. Boy Scout Rule

Leave tests cleaner than you found them:

```typescript
// Always clean up after tests
afterEach(async () => {
  await cleanupTestData();
});
```

### 3. Test Independence

Each test should be independent:

```typescript
// ✅ Good: Fresh data per test
beforeEach(async () => {
  await seedAllTestData();
});

// ❌ Bad: Tests depend on each other
it('test 1', () => { /* creates data */ });
it('test 2', () => { /* uses data from test 1 */ });
```

### 4. Clear Assertions

Use descriptive error messages:

```typescript
// ✅ Good: Clear message
expect(response.status, 'ketchup_finance should NOT access terminals').toBe(403);

// ❌ Bad: No message
expect(response.status).toBe(403);
```

### 5. Avoid Flakiness

- Use proper timeouts for rate limit tests
- Wait for async operations to complete
- Don't rely on exact timing

```typescript
// ✅ Good: Wait for rate limit reset
await waitForRateLimitReset(60);

// ❌ Bad: Hardcoded sleep
await new Promise(r => setTimeout(r, 60000));
```

---

## Additional Resources

- **Vitest Documentation:** https://vitest.dev/
- **Neon Test Branches:** https://neon.tech/docs/guides/branching
- **RBAC Implementation (archived snapshot):** `docs/archive/security-snapshots/RBAC_COMPLETION_REPORT.md`
- **Rate Limiting:** `src/lib/middleware/rate-limit.ts`
- **Audit Logging:** `src/lib/services/audit-log-service.ts`

---

## Support

For questions or issues:

1. Check existing tests for examples
2. Review test utilities documentation
3. Ask in #engineering Slack channel
4. Create a GitHub issue with `test` label

---

**Document Control:**

- **Last Updated:** March 18, 2026
- **Next Review:** April 1, 2026
- **Owner:** QA Engineer
