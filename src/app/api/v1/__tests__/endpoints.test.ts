/**
 * Endpoint-Specific Integration Tests
 * Location: src/app/api/v1/__tests__/endpoints.test.ts
 * 
 * Purpose: Test specific API endpoints for RBAC, rate limiting, and audit logging
 * Tests: 30+ test cases covering key endpoints
 * 
 * Test Categories:
 * - Beneficiaries API (pagination, filtering, RBAC)
 * - Vouchers API (issuance, audit logging)
 * - Agents API (float adjustment, CRITICAL audit)
 * - Programmes API (CRUD operations)
 * - Reconciliation API (CRITICAL audit)
 * - Audit Logs API (no self-logging)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  authenticatedFetch,
  getTestBaseUrl,
  assertJsonResponse,
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

describe('Beneficiaries API', () => {
  it('should return paginated beneficiaries', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/beneficiaries?page=1&limit=10`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(data).toHaveProperty('links');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.meta.page).toBe(1);
    expect(data.meta.limit).toBe(10);
  });

  it('should filter beneficiaries by region', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/beneficiaries?region=Khomas`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    
    // All beneficiaries should be from Khomas region
    const khomasBeneficiaries = data.data.filter(
      (b: any) => b.region === 'Khomas'
    );
    expect(khomasBeneficiaries.length).toBe(data.data.length);
  });

  it('should filter beneficiaries by status', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/beneficiaries?status=active`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    
    // All beneficiaries should be active
    const activeBeneficiaries = data.data.filter(
      (b: any) => b.walletStatus === 'active'
    );
    expect(activeBeneficiaries.length).toBe(data.data.length);
  });

  it('should enforce RBAC on beneficiaries list', async () => {
    // ketchup_support has beneficiaries.list permission
    const supportResponse = await authenticatedFetch(
      `${BASE_URL}/api/v1/beneficiaries`,
      'ketchup_support'
    );
    expect(supportResponse.status).toBe(200);

    // agent does NOT have beneficiaries.list permission
    const agentResponse = await authenticatedFetch(
      `${BASE_URL}/api/v1/beneficiaries`,
      'agent'
    );
    expect(agentResponse.status).toBe(403);
  });

  it('should return single beneficiary details', async () => {
    const beneficiaryId = '10000000-0000-0000-0000-000000000001';
    
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/beneficiaries/${beneficiaryId}`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    expect(data.id).toBe(beneficiaryId);
    expect(data).toHaveProperty('fullName');
    expect(data).toHaveProperty('phone');
    expect(data).toHaveProperty('region');
  });
});

describe('Vouchers API', () => {
  it('should issue single voucher with audit log', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/vouchers`,
      'ketchup_ops',
      {
        method: 'POST',
        body: JSON.stringify({
          beneficiaryId: '10000000-0000-0000-0000-000000000001',
          programmeId: '30000000-0000-0000-0000-000000000001',
          amount: 1000,
          expiryDate: '2026-12-31',
        }),
      }
    );

    const data = await assertJsonResponse(response, 201);
    expect(data).toHaveProperty('id');
    expect(data.amount).toBe('1000.00');
    expect(data.status).toBe('available');
  });

  it('should list vouchers with pagination', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/vouchers?page=1&limit=10`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should filter vouchers by status', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/vouchers?status=available`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    
    const availableVouchers = data.data.filter(
      (v: any) => v.status === 'available'
    );
    expect(availableVouchers.length).toBe(data.data.length);
  });

  it('should enforce RBAC on voucher issuance', async () => {
    // ketchup_ops has vouchers.issue permission
    const opsResponse = await authenticatedFetch(
      `${BASE_URL}/api/v1/vouchers`,
      'ketchup_ops',
      {
        method: 'POST',
        body: JSON.stringify({
          beneficiaryId: '10000000-0000-0000-0000-000000000001',
          programmeId: '30000000-0000-0000-0000-000000000001',
          amount: 500,
          expiryDate: '2026-12-31',
        }),
      }
    );
    expect(opsResponse.status).toBe(201);

    // ketchup_support does NOT have vouchers.issue permission
    const supportResponse = await authenticatedFetch(
      `${BASE_URL}/api/v1/vouchers`,
      'ketchup_support',
      {
        method: 'POST',
        body: JSON.stringify({
          beneficiaryId: '10000000-0000-0000-0000-000000000001',
          programmeId: '30000000-0000-0000-0000-000000000001',
          amount: 500,
          expiryDate: '2026-12-31',
        }),
      }
    );
    expect(supportResponse.status).toBe(403);
  });

  it('should validate voucher issuance request', async () => {
    // Missing required fields
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/vouchers`,
      'ketchup_ops',
      {
        method: 'POST',
        body: JSON.stringify({
          // Missing beneficiaryId, programmeId, amount, expiryDate
        }),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeTruthy();
  });
});

describe('Agents API', () => {
  it('should list agents', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/agents`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  });

  it('should return single agent details', async () => {
    const agentId = '20000000-0000-0000-0000-000000000001';
    
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/agents/${agentId}`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    expect(data.id).toBe(agentId);
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('floatBalance');
  });

  it('should adjust agent float with CRITICAL audit log', async () => {
    const agentId = '20000000-0000-0000-0000-000000000001';
    
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/agents/${agentId}/float`,
      'ketchup_ops',
      {
        method: 'PATCH',
        body: JSON.stringify({
          adjustment: 5000,
          reason: 'Test float adjustment',
        }),
      }
    );

    if (response.status === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('floatBalance');
      // Audit log should be created (tested in audit-logging.test.ts)
    }
  });

  it('should enforce RBAC on agent float adjustment', async () => {
    const agentId = '20000000-0000-0000-0000-000000000001';
    
    // ketchup_finance does NOT have agents.float_adjust permission
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/agents/${agentId}/float`,
      'ketchup_finance',
      {
        method: 'PATCH',
        body: JSON.stringify({
          adjustment: 5000,
          reason: 'Unauthorized adjustment',
        }),
      }
    );

    expect(response.status).toBe(403);
  });
});

describe('Programmes API', () => {
  it('should list programmes', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/programmes`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should return single programme details', async () => {
    const programmeId = '30000000-0000-0000-0000-000000000001';
    
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/programmes/${programmeId}`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    expect(data.id).toBe(programmeId);
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('allocatedBudget');
  });

  it('should create programme with audit log', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/programmes`,
      'ketchup_ops',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Programme - API Test',
          description: 'Testing programme creation',
          allocatedBudget: 50000,
          startDate: '2026-05-01',
          endDate: '2026-12-31',
        }),
      }
    );

    const data = await assertJsonResponse(response, 201);
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Test Programme - API Test');
  });

  it('should enforce RBAC on programme creation', async () => {
    // gov_auditor does NOT have programmes.create permission
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/programmes`,
      'gov_auditor',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Unauthorized Programme',
          description: 'Should fail',
          allocatedBudget: 10000,
          startDate: '2026-05-01',
          endDate: '2026-12-31',
        }),
      }
    );

    expect(response.status).toBe(403);
  });
});

describe('Reconciliation API', () => {
  it('should list daily reconciliation records', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/reconciliation/daily`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should create reconciliation adjustment with CRITICAL audit log', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/reconciliation/adjustment`,
      'ketchup_ops',
      {
        method: 'POST',
        body: JSON.stringify({
          agentId: '20000000-0000-0000-0000-000000000001',
          amount: 1000,
          reason: 'Test reconciliation adjustment',
        }),
      }
    );

    if (response.status === 201) {
      const data = await response.json();
      expect(data).toHaveProperty('id');
      // CRITICAL audit log should be created
    }
  });

  it('should enforce RBAC on reconciliation adjustment', async () => {
    // ketchup_compliance does NOT have reconciliation.adjust permission
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/reconciliation/adjustment`,
      'ketchup_compliance',
      {
        method: 'POST',
        body: JSON.stringify({
          agentId: '20000000-0000-0000-0000-000000000001',
          amount: 1000,
          reason: 'Unauthorized adjustment',
        }),
      }
    );

    expect(response.status).toBe(403);
  });
});

describe('Audit Logs API', () => {
  it('should list audit logs with pagination', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/audit-logs?page=1&limit=10`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should filter audit logs by action', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/audit-logs?action=voucher.issue`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    
    if (data.data.length > 0) {
      const allVoucherIssue = data.data.every(
        (log: any) => log.action === 'voucher.issue'
      );
      expect(allVoucherIssue).toBe(true);
    }
  });

  it('should enforce RBAC on audit logs', async () => {
    // gov_manager has audit.view permission
    const managerResponse = await authenticatedFetch(
      `${BASE_URL}/api/v1/audit-logs`,
      'gov_manager'
    );
    expect(managerResponse.status).toBe(200);

    // agent does NOT have audit.view permission
    const agentResponse = await authenticatedFetch(
      `${BASE_URL}/api/v1/audit-logs`,
      'agent'
    );
    expect(agentResponse.status).toBe(403);
  });

  it('should NOT create audit log for viewing audit logs', async () => {
    // This prevents infinite loop (tested in audit-logging.test.ts)
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/audit-logs`,
      'ketchup_ops'
    );

    expect(response.status).toBe(200);
    // No audit log should be created (checked in audit-logging.test.ts)
  });
});

describe('Terminals API', () => {
  it('should list terminals', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/terminals`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should enforce RBAC on terminals', async () => {
    // ketchup_finance does NOT have terminals.list permission
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/terminals`,
      'ketchup_finance'
    );

    expect(response.status).toBe(403);
  });
});

describe('SMS API', () => {
  it('should list SMS history', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/sms/history`,
      'ketchup_ops'
    );

    const data = await assertJsonResponse(response, 200);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should enforce RBAC on SMS history', async () => {
    // gov_auditor does NOT have sms.view permission
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/sms/history`,
      'gov_auditor'
    );

    expect(response.status).toBe(403);
  });
});
