/**
 * RBAC Integration Tests
 * Location: src/app/api/v1/__tests__/rbac.test.ts
 * 
 * Purpose: Test Role-Based Access Control (RBAC) for all API routes
 * Tests: 20+ test cases covering authentication, authorization, and permission checks
 * 
 * Test Categories:
 * - Unauthenticated requests (401)
 * - Authenticated without permission (403)
 * - Authenticated with correct permission (200/201)
 * - Multiple permission options (requireAnyPermission)
 * - Role-specific access patterns
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  authenticatedFetch,
  unauthenticatedFetch,
  createExpiredTestSession,
  getTestBaseUrl,
  assertJsonResponse,
  ROLE_TEST_SCENARIOS,
} from '@/lib/test-utils';
import { seedAllTestData, cleanupTestData } from '@/lib/test-utils/seed-data';

const BASE_URL = getTestBaseUrl();

// Setup/teardown
beforeAll(async () => {
  await seedAllTestData();
});

afterAll(async () => {
  await cleanupTestData();
});

describe('RBAC - Authentication Tests', () => {
  it('should return 401 for unauthenticated request', async () => {
    const response = await unauthenticatedFetch(`${BASE_URL}/api/v1/beneficiaries`);
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 for expired token', async () => {
    const expiredToken = createExpiredTestSession('ketchup_ops');
    
    const response = await fetch(`${BASE_URL}/api/v1/beneficiaries`, {
      headers: {
        Authorization: `Bearer ${expiredToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    expect(response.status).toBe(401);
  });

  it('should return 401 for malformed token', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/beneficiaries`, {
      headers: {
        Authorization: 'Bearer invalid-token-here',
        'Content-Type': 'application/json',
      },
    });
    
    expect(response.status).toBe(401);
  });

  it('should accept valid Bearer token', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/beneficiaries`,
      'ketchup_ops'
    );
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
  });
});

describe('RBAC - Authorization Tests', () => {
  it('should return 403 when role lacks required permission', async () => {
    // ketchup_support does NOT have 'vouchers.issue' permission
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/vouchers`,
      'ketchup_support',
      { method: 'POST' }
    );
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Forbidden');
  });

  it('should return 200 when role has required permission', async () => {
    // ketchup_ops has 'beneficiaries.list' permission
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/beneficiaries`,
      'ketchup_ops'
    );
    
    expect(response.status).toBe(200);
  });

  it('should allow ketchup_ops to access admin endpoints', async () => {
    // ketchup_ops has 'admin.manage_roles' permission
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/admin/roles`,
      'ketchup_ops'
    );
    
    expect(response.status).toBe(200);
  });

  it('should deny ketchup_support access to admin endpoints', async () => {
    // ketchup_support does NOT have 'admin.manage_roles' permission
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/admin/roles`,
      'ketchup_support'
    );
    
    expect(response.status).toBe(403);
  });
});

describe('RBAC - requireAnyPermission Tests', () => {
  it('should allow access if ANY permission matches (ketchup_ops)', async () => {
    // Dashboard summary requires ANY of: dashboard.summary, agent.dashboard, gov.dashboard
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/portal/dashboard/summary`,
      'ketchup_ops' // Has dashboard.summary
    );
    
    expect(response.status).toBe(200);
  });

  it('should allow access if ANY permission matches (gov_manager)', async () => {
    // Audit logs require ANY of: audit.view, government.reports
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/audit-logs`,
      'gov_manager' // Has audit.view
    );
    
    expect(response.status).toBe(200);
  });

  it('should deny access if NO permissions match', async () => {
    // Audit logs require audit.view OR government.reports
    // agent has NEITHER
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/audit-logs`,
      'agent'
    );
    
    expect(response.status).toBe(403);
  });
});

describe('RBAC - Role-Specific Access Patterns', () => {
  describe('ketchup_ops (superuser)', () => {
    it('should access beneficiaries endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/beneficiaries`,
        'ketchup_ops'
      );
      expect(response.status).toBe(200);
    });

    it('should access vouchers endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/vouchers`,
        'ketchup_ops'
      );
      expect(response.status).toBe(200);
    });

    it('should access agents endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/agents`,
        'ketchup_ops'
      );
      expect(response.status).toBe(200);
    });

    it('should access reconciliation endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/reconciliation/daily`,
        'ketchup_ops'
      );
      expect(response.status).toBe(200);
    });

    it('should access terminals endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/terminals`,
        'ketchup_ops'
      );
      expect(response.status).toBe(200);
    });
  });

  describe('ketchup_finance', () => {
    it('should access beneficiaries endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/beneficiaries`,
        'ketchup_finance'
      );
      expect(response.status).toBe(200);
    });

    it('should access reconciliation endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/reconciliation/daily`,
        'ketchup_finance'
      );
      expect(response.status).toBe(200);
    });

    it('should NOT access terminals endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/terminals`,
        'ketchup_finance'
      );
      expect(response.status).toBe(403);
    });

    it('should NOT access admin endpoints', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/admin/roles`,
        'ketchup_finance'
      );
      expect(response.status).toBe(403);
    });
  });

  describe('ketchup_compliance', () => {
    it('should access duplicate redemptions endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/portal/duplicate-redemptions`,
        'ketchup_compliance'
      );
      expect(response.status).toBe(200);
    });

    it('should NOT access reconciliation endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/reconciliation/adjustment`,
        'ketchup_compliance'
      );
      expect(response.status).toBe(403);
    });

    it('should NOT access agents endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/agents`,
        'ketchup_compliance'
      );
      expect(response.status).toBe(403);
    });
  });

  describe('gov_manager', () => {
    it('should access audit logs endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/audit-logs`,
        'gov_manager'
      );
      expect(response.status).toBe(200);
    });

    it('should NOT access vouchers endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/vouchers`,
        'gov_manager'
      );
      expect(response.status).toBe(403);
    });

    it('should NOT access agents endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/agents`,
        'gov_manager'
      );
      expect(response.status).toBe(403);
    });
  });

  describe('agent', () => {
    it('should NOT access beneficiaries endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/beneficiaries`,
        'agent'
      );
      expect(response.status).toBe(403);
    });

    it('should NOT access vouchers endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/vouchers`,
        'agent'
      );
      expect(response.status).toBe(403);
    });

    it('should NOT access audit logs endpoint', async () => {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/audit-logs`,
        'agent'
      );
      expect(response.status).toBe(403);
    });
  });
});

describe('RBAC - Cross-Role Validation', () => {
  it('should test all role scenarios systematically', async () => {
    for (const scenario of ROLE_TEST_SCENARIOS) {
      // Test endpoints that should be accessible
      for (const endpoint of scenario.shouldAccess) {
        const response = await authenticatedFetch(
          `${BASE_URL}${endpoint}`,
          scenario.role
        );
        
        expect(
          response.status,
          `${scenario.description} should access ${endpoint}`
        ).toBeLessThan(400); // Success (200-399)
      }

      // Test endpoints that should NOT be accessible
      for (const endpoint of scenario.shouldNotAccess) {
        const response = await authenticatedFetch(
          `${BASE_URL}${endpoint}`,
          scenario.role
        );
        
        expect(
          response.status,
          `${scenario.description} should NOT access ${endpoint}`
        ).toBe(403);
      }
    }
  });
});
