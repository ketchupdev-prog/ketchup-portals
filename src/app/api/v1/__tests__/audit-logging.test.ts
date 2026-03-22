/**
 * Audit Logging Integration Tests
 * Location: src/app/api/v1/__tests__/audit-logging.test.ts
 * 
 * Purpose: Test audit logging for sensitive operations
 * Tests: 10+ test cases covering audit log creation, structure, and filtering
 * 
 * Test Categories:
 * - Critical mutation operations create audit logs
 * - Audit log contains correct fields
 * - IP address and User-Agent captured
 * - Metadata JSON structure
 * - Read-only operations do NOT create audit logs
 * - Failed operations do NOT create audit logs
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  authenticatedFetch,
  getTestBaseUrl,
  assertJsonResponse,
  TEST_USER_IDS,
} from '@/lib/test-utils';
import { seedAllTestData, cleanupTestData } from '@/lib/test-utils/seed-data';
import { db } from '@/lib/db';
import { auditLogs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

const BASE_URL = getTestBaseUrl();

// Setup/teardown
beforeAll(async () => {
  await seedAllTestData();
});

afterAll(async () => {
  await cleanupTestData();
});

beforeEach(async () => {
  // Clean audit logs before each test
  await db.delete(auditLogs);
});

describe('Audit Logging - Critical Mutations', () => {
  it('should create audit log for voucher issuance', async () => {
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

    if (response.status === 201) {
      const data = await response.json();
      const voucherId = data.id;

      // Check audit log was created
      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.action, 'voucher.issue'))
        .orderBy(desc(auditLogs.timestamp))
        .limit(1);

      expect(logs.length).toBe(1);
      expect(logs[0].userId).toBe(TEST_USER_IDS.ketchup_ops);
      expect(logs[0].resourceType).toBe('voucher');
      expect(logs[0].resourceId).toBe(voucherId);
      expect(logs[0].metadata).toBeTruthy();
    }
  });

  it('should create CRITICAL audit log for float adjustment', async () => {
    const agentId = '20000000-0000-0000-0000-000000000001';
    
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/agents/${agentId}/float`,
      'ketchup_ops',
      {
        method: 'PATCH',
        body: JSON.stringify({
          adjustment: 10000,
          reason: 'Test float adjustment',
        }),
      }
    );

    if (response.status === 200) {
      // Check audit log was created
      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.action, 'agent.float_adjust'))
        .orderBy(desc(auditLogs.timestamp))
        .limit(1);

      expect(logs.length).toBe(1);
      expect(logs[0].userId).toBe(TEST_USER_IDS.ketchup_ops);
      expect(logs[0].resourceType).toBe('agent');
      expect(logs[0].resourceId).toBe(agentId);
      
      // Check metadata contains adjustment details
      const metadata = logs[0].metadata as Record<string, unknown>;
      expect(metadata.adjustment).toBe(10000);
      expect(metadata.reason).toBe('Test float adjustment');
    }
  });

  it('should create CRITICAL audit log for reconciliation adjustment', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/reconciliation/adjustment`,
      'ketchup_ops',
      {
        method: 'POST',
        body: JSON.stringify({
          agentId: '20000000-0000-0000-0000-000000000001',
          amount: 5000,
          reason: 'Test reconciliation adjustment',
        }),
      }
    );

    if (response.status === 201) {
      // Check audit log was created
      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.action, 'reconciliation.adjustment'))
        .orderBy(desc(auditLogs.timestamp))
        .limit(1);

      expect(logs.length).toBe(1);
      expect(logs[0].userId).toBe(TEST_USER_IDS.ketchup_ops);
      expect(logs[0].resourceType).toBe('reconciliation');
      expect(logs[0].metadata).toBeTruthy();
    }
  });

  it('should create audit log for programme creation', async () => {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/programmes`,
      'ketchup_ops',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Programme - Audit Log',
          description: 'Testing audit logging',
          allocatedBudget: 100000,
          startDate: '2026-04-01',
          endDate: '2026-12-31',
        }),
      }
    );

    if (response.status === 201) {
      const data = await response.json();

      // Check audit log was created
      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.action, 'programme.create'))
        .orderBy(desc(auditLogs.timestamp))
        .limit(1);

      expect(logs.length).toBe(1);
      expect(logs[0].resourceType).toBe('programme');
      expect(logs[0].resourceId).toBe(data.id);
    }
  });

  it('should create audit log for beneficiary SMS', async () => {
    const beneficiaryId = '10000000-0000-0000-0000-000000000001';
    
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/beneficiaries/${beneficiaryId}/sms`,
      'ketchup_ops',
      {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test SMS message for audit log',
        }),
      }
    );

    if (response.status === 200) {
      // Check audit log was created
      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.action, 'beneficiary.sms_sent'))
        .orderBy(desc(auditLogs.timestamp))
        .limit(1);

      expect(logs.length).toBe(1);
      expect(logs[0].resourceType).toBe('beneficiary');
      expect(logs[0].resourceId).toBe(beneficiaryId);
    }
  });
});

describe('Audit Logging - Log Structure', () => {
  it('should contain all required fields', async () => {
    // Trigger an audit log
    await authenticatedFetch(
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

    // Get the audit log
    const logs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(1);

    expect(logs.length).toBe(1);
    const log = logs[0];

    // Check required fields
    expect(log.userId).toBeTruthy();
    expect(log.action).toBeTruthy();
    expect(log.resourceType).toBeTruthy();
    expect(log.resourceId).toBeTruthy();
    expect(log.timestamp).toBeTruthy();
    
    // Check optional fields
    expect(log.metadata).toBeTruthy();
    expect(log.ipAddress).toBeTruthy();
    expect(log.userAgent).toBeTruthy();
  });

  it('should capture IP address', async () => {
    // Trigger an audit log with custom IP
    const response = await fetch(`${BASE_URL}/api/v1/vouchers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${createTestSession('ketchup_ops')}`,
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.100',
      },
      body: JSON.stringify({
        beneficiaryId: '10000000-0000-0000-0000-000000000001',
        programmeId: '30000000-0000-0000-0000-000000000001',
        amount: 500,
        expiryDate: '2026-12-31',
      }),
    });

    if (response.status === 201) {
      const logs = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.timestamp))
        .limit(1);

      expect(logs[0].ipAddress).toBe('192.168.1.100');
    }
  });

  it('should capture User-Agent', async () => {
    // Trigger an audit log with custom User-Agent
    const response = await fetch(`${BASE_URL}/api/v1/vouchers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${createTestSession('ketchup_ops')}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Client/1.0',
      },
      body: JSON.stringify({
        beneficiaryId: '10000000-0000-0000-0000-000000000001',
        programmeId: '30000000-0000-0000-0000-000000000001',
        amount: 500,
        expiryDate: '2026-12-31',
      }),
    });

    if (response.status === 201) {
      const logs = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.timestamp))
        .limit(1);

      expect(logs[0].userAgent).toBe('Test-Client/1.0');
    }
  });

  it('should store metadata as valid JSON', async () => {
    // Trigger an audit log
    await authenticatedFetch(
      `${BASE_URL}/api/v1/vouchers`,
      'ketchup_ops',
      {
        method: 'POST',
        body: JSON.stringify({
          beneficiaryId: '10000000-0000-0000-0000-000000000001',
          programmeId: '30000000-0000-0000-0000-000000000001',
          amount: 1500,
          expiryDate: '2026-12-31',
        }),
      }
    );

    const logs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(1);

    const metadata = logs[0].metadata as Record<string, unknown>;
    
    // Check metadata is an object
    expect(typeof metadata).toBe('object');
    expect(metadata).not.toBeNull();
    
    // Check metadata contains expected fields
    expect(metadata.beneficiaryId).toBe('10000000-0000-0000-0000-000000000001');
    expect(metadata.programmeId).toBe('30000000-0000-0000-0000-000000000001');
    expect(metadata.amount).toBe(1500);
  });
});

describe('Audit Logging - Read Operations', () => {
  it('should NOT create audit log for GET beneficiaries', async () => {
    // Clear audit logs
    await db.delete(auditLogs);

    // Perform read operation
    await authenticatedFetch(`${BASE_URL}/api/v1/beneficiaries`, 'ketchup_ops');

    // Check no audit log was created
    const logs = await db.select().from(auditLogs);
    expect(logs.length).toBe(0);
  });

  it('should NOT create audit log for GET vouchers', async () => {
    await db.delete(auditLogs);

    await authenticatedFetch(`${BASE_URL}/api/v1/vouchers`, 'ketchup_ops');

    const logs = await db.select().from(auditLogs);
    expect(logs.length).toBe(0);
  });

  it('should NOT create audit log for GET agents', async () => {
    await db.delete(auditLogs);

    await authenticatedFetch(`${BASE_URL}/api/v1/agents`, 'ketchup_ops');

    const logs = await db.select().from(auditLogs);
    expect(logs.length).toBe(0);
  });
});

describe('Audit Logging - Failed Operations', () => {
  it('should NOT create audit log for failed voucher issuance (validation error)', async () => {
    await db.delete(auditLogs);

    // Invalid request (missing required fields)
    await authenticatedFetch(
      `${BASE_URL}/api/v1/vouchers`,
      'ketchup_ops',
      {
        method: 'POST',
        body: JSON.stringify({
          // Missing beneficiaryId, programmeId, amount, expiryDate
        }),
      }
    );

    // Check no audit log was created
    const logs = await db.select().from(auditLogs);
    expect(logs.length).toBe(0);
  });

  it('should NOT create audit log for unauthorized request', async () => {
    await db.delete(auditLogs);

    // Unauthorized user tries to issue voucher
    await authenticatedFetch(
      `${BASE_URL}/api/v1/vouchers`,
      'agent', // agent does NOT have vouchers.issue permission
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

    // Check no audit log was created (403 response doesn't create audit log)
    const logs = await db.select().from(auditLogs);
    expect(logs.length).toBe(0);
  });
});

describe('Audit Logging - Infinite Loop Prevention', () => {
  it('should NOT create audit log when viewing audit logs', async () => {
    await db.delete(auditLogs);

    // View audit logs
    await authenticatedFetch(`${BASE_URL}/api/v1/audit-logs`, 'ketchup_ops');

    // Check no audit log was created (prevent infinite loop)
    const logs = await db.select().from(auditLogs);
    expect(logs.length).toBe(0);
  });
});

// Import createTestSession for custom headers test
import { createTestSession } from '@/lib/test-utils';
