/**
 * Test utilities for integration tests
 * Location: src/lib/test-utils/index.ts
 * 
 * Purpose: Provide reusable test helpers for authentication, requests, and data seeding
 * Used by: All integration tests in src/app/api/v1/__tests__/
 */

import { type PortalSession } from '@/lib/portal-auth';

/**
 * Create a test session token (base64url encoded JWT payload)
 * Mimics the real portal-auth system
 * 
 * @param role - Role slug (e.g., 'ketchup_ops', 'agent', 'gov_manager')
 * @param userId - Optional user ID (defaults to role-specific test user)
 * @param email - Optional email (defaults to role@test.com)
 * @returns Base64url encoded token string
 */
export function createTestSession(
  role: string,
  userId?: string,
  email?: string
): string {
  const session: PortalSession = {
    userId: userId ?? `test-user-${role}`,
    email: email ?? `${role}@test.com`,
    role,
    exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
  };

  const json = JSON.stringify(session);
  return Buffer.from(json, 'utf-8').toString('base64url');
}

/**
 * Create an expired test session token (for testing 401 responses)
 */
export function createExpiredTestSession(role: string): string {
  const session: PortalSession = {
    userId: `test-user-${role}`,
    email: `${role}@test.com`,
    role,
    exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
  };

  const json = JSON.stringify(session);
  return Buffer.from(json, 'utf-8').toString('base64url');
}

/**
 * Make an authenticated fetch request
 * 
 * @param url - API endpoint URL (e.g., '/api/v1/beneficiaries')
 * @param role - Role slug (e.g., 'ketchup_ops')
 * @param options - Fetch options (method, body, etc.)
 * @returns Fetch response
 */
export async function authenticatedFetch(
  url: string,
  role: string,
  options?: RequestInit
): Promise<Response> {
  const token = createTestSession(role);
  
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Make an unauthenticated fetch request (for testing 401 responses)
 */
export async function unauthenticatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Test user IDs by role (consistent across tests)
 */
export const TEST_USER_IDS = {
  ketchup_ops: '00000000-0000-0000-0000-000000000001',
  ketchup_finance: '00000000-0000-0000-0000-000000000002',
  ketchup_compliance: '00000000-0000-0000-0000-000000000003',
  ketchup_support: '00000000-0000-0000-0000-000000000004',
  gov_manager: '00000000-0000-0000-0000-000000000005',
  gov_auditor: '00000000-0000-0000-0000-000000000006',
  agent: '00000000-0000-0000-0000-000000000007',
  field_tech: '00000000-0000-0000-0000-000000000008',
  field_lead: '00000000-0000-0000-0000-000000000009',
} as const;

/**
 * Permission mappings for testing (mirrors src/lib/permissions.ts)
 */
export const TEST_PERMISSIONS = {
  ketchup_ops: [
    'dashboard.summary',
    'float_requests.list',
    'float_requests.approve',
    'beneficiaries.list',
    'beneficiaries.sms',
    'agents.list',
    'vouchers.list',
    'vouchers.issue',
    'vouchers.expire',
    'audit.view',
    'admin.manage_users',
    'admin.manage_roles',
    'reconciliation.view',
    'reconciliation.adjust',
    'ussd.view',
    'terminals.list',
    'terminals.manage',
    'assets.manage',
    'incidents.manage',
    'sms.view',
    'programmes.list',
  ],
  ketchup_finance: [
    'dashboard.summary',
    'float_requests.list',
    'float_requests.approve',
    'beneficiaries.list',
    'agents.list',
    'vouchers.list',
    'audit.view',
    'reconciliation.view',
    'reconciliation.adjust',
  ],
  ketchup_compliance: [
    'dashboard.summary',
    'beneficiaries.list',
    'audit.view',
    'duplicate_redemptions.list',
    'duplicate_redemptions.resolve',
    'incidents.manage',
  ],
  ketchup_support: [
    'dashboard.summary',
    'beneficiaries.list',
    'agents.list',
    'float_requests.list',
  ],
  gov_manager: [
    'dashboard.summary',
    'programmes.list',
    'government.reports',
    'audit.view',
  ],
  gov_auditor: ['programmes.list', 'government.reports', 'audit.view'],
  agent: [
    'agent.dashboard',
    'agent.float.request',
    'agent.parcels',
    'agent.transactions',
  ],
  field_tech: ['field.tasks', 'field.map', 'field.assets', 'assets.manage'],
  field_lead: [
    'field.tasks',
    'field.map',
    'field.assets',
    'field.tasks.assign',
    'assets.manage',
    'incidents.manage',
  ],
} as const;

/**
 * Helper: Check if role has permission (for test assertions)
 */
export function roleHasPermission(role: string, permission: string): boolean {
  const permissions = TEST_PERMISSIONS[role as keyof typeof TEST_PERMISSIONS] as readonly string[] | undefined;
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Helper: Get base URL for tests (handles different environments)
 */
export function getTestBaseUrl(): string {
  // Check if running in CI/CD
  if (process.env.CI) {
    return process.env.TEST_BASE_URL || 'http://localhost:3000';
  }
  
  // Check if Next.js dev server is running
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Default to localhost
  return 'http://localhost:3000';
}

/**
 * Helper: Wait for rate limit window to reset
 * Useful for rate limiting tests
 */
export function waitForRateLimitReset(windowSeconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, windowSeconds * 1000 + 100); // Add 100ms buffer
  });
}

/**
 * Helper: Generate random email for test users
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}@test.com`;
}

/**
 * Helper: Generate random phone number for test users
 */
export function generateTestPhone(): string {
  const random = Math.floor(Math.random() * 100000000);
  return `+264${String(random).padStart(8, '0')}`;
}

/**
 * Helper: Assert response is JSON with expected status
 */
export async function assertJsonResponse(
  response: Response,
  expectedStatus: number
): Promise<any> {
  if (response.status !== expectedStatus) {
    const text = await response.text();
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}. Body: ${text}`
    );
  }

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    throw new Error(
      `Expected JSON response, got content-type: ${contentType}`
    );
  }

  return response.json();
}

/**
 * Helper: Extract Retry-After header from 429 response
 */
export function getRetryAfter(response: Response): number | null {
  const retryAfter = response.headers.get('Retry-After');
  return retryAfter ? parseInt(retryAfter, 10) : null;
}

/**
 * Role test scenarios for RBAC testing
 */
export const ROLE_TEST_SCENARIOS = [
  {
    role: 'ketchup_ops',
    description: 'Ketchup Ops (superuser)',
    shouldAccess: [
      '/api/v1/beneficiaries',
      '/api/v1/vouchers',
      '/api/v1/agents',
      '/api/v1/audit-logs',
      '/api/v1/reconciliation/daily',
    ],
    shouldNotAccess: [],
  },
  {
    role: 'ketchup_finance',
    description: 'Ketchup Finance',
    shouldAccess: [
      '/api/v1/beneficiaries',
      '/api/v1/agents',
      '/api/v1/audit-logs',
    ],
    shouldNotAccess: ['/api/v1/admin/roles', '/api/v1/terminals'],
  },
  {
    role: 'ketchup_compliance',
    description: 'Ketchup Compliance',
    shouldAccess: [
      '/api/v1/beneficiaries',
      '/api/v1/portal/duplicate-redemptions',
    ],
    shouldNotAccess: ['/api/v1/reconciliation/adjustment', '/api/v1/agents'],
  },
  {
    role: 'gov_manager',
    description: 'Government Manager',
    shouldAccess: ['/api/v1/audit-logs'],
    shouldNotAccess: ['/api/v1/vouchers', '/api/v1/agents'],
  },
  {
    role: 'agent',
    description: 'Agent',
    shouldAccess: [],
    shouldNotAccess: [
      '/api/v1/beneficiaries',
      '/api/v1/vouchers',
      '/api/v1/audit-logs',
    ],
  },
] as const;
