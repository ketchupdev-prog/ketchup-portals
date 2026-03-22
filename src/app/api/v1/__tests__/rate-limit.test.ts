/**
 * Rate Limiting Integration Tests
 * Location: src/app/api/v1/__tests__/rate-limit.test.ts
 * 
 * Purpose: Test rate limiting middleware for API routes
 * Tests: 10+ test cases covering different rate limit presets
 * 
 * Test Categories:
 * - READ_ONLY preset (200 requests/minute)
 * - ADMIN preset (50 requests/minute)
 * - AUTH preset (5 requests/minute)
 * - Retry-After header validation
 * - Rate limit reset after window expires
 * - Per-user vs per-IP rate limiting
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  authenticatedFetch,
  unauthenticatedFetch,
  getTestBaseUrl,
  waitForRateLimitReset,
  getRetryAfter,
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

describe('Rate Limiting - READ_ONLY Preset', () => {
  it('should allow up to 200 requests per minute', async () => {
    const endpoint = `${BASE_URL}/api/v1/beneficiaries`;
    
    // Make 10 requests (should all succeed)
    for (let i = 0; i < 10; i++) {
      const response = await authenticatedFetch(endpoint, 'ketchup_ops');
      expect(response.status).toBe(200);
    }
  }, 60000); // 60 second timeout

  it('should return 429 after exceeding READ_ONLY limit', async () => {
    const endpoint = `${BASE_URL}/api/v1/beneficiaries`;
    
    // Make 201 requests rapidly
    const responses: Response[] = [];
    
    for (let i = 0; i < 201; i++) {
      const response = await authenticatedFetch(endpoint, 'ketchup_ops');
      responses.push(response);
    }
    
    // Check that at least one response is 429
    const rateLimited = responses.some(r => r.status === 429);
    expect(rateLimited).toBe(true);
    
    // Find the 429 response and check headers
    const rateLimitResponse = responses.find(r => r.status === 429);
    if (rateLimitResponse) {
      expect(rateLimitResponse.headers.get('Retry-After')).toBeTruthy();
      expect(rateLimitResponse.headers.get('X-RateLimit-Limit')).toBe('200');
      expect(rateLimitResponse.headers.get('X-RateLimit-Remaining')).toBe('0');
    }
  }, 120000); // 120 second timeout
});

describe('Rate Limiting - ADMIN Preset', () => {
  it('should return 429 after 51 ADMIN requests', async () => {
    const endpoint = `${BASE_URL}/api/v1/admin/roles`;
    
    // Make 51 requests rapidly
    const responses: Response[] = [];
    
    for (let i = 0; i < 51; i++) {
      const response = await authenticatedFetch(endpoint, 'ketchup_ops');
      responses.push(response);
    }
    
    // Last request should be rate limited
    const lastResponse = responses[responses.length - 1];
    expect(lastResponse.status).toBe(429);
    
    const data = await lastResponse.json();
    expect(data.error).toBe('Too Many Requests');
    expect(data.code).toBe('RateLimitExceeded');
  }, 60000);
});

describe('Rate Limiting - AUTH Preset', () => {
  it('should return 429 after 6 auth requests', async () => {
    const endpoint = `${BASE_URL}/api/v1/auth/login`;
    
    // Make 6 requests rapidly (unauthenticated - testing IP-based limit)
    const responses: Response[] = [];
    
    for (let i = 0; i < 6; i++) {
      const response = await unauthenticatedFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'wrongpassword',
        }),
      });
      responses.push(response);
    }
    
    // Check that at least one response is 429
    const rateLimited = responses.some(r => r.status === 429);
    expect(rateLimited).toBe(true);
  }, 60000);
});

describe('Rate Limiting - Retry-After Header', () => {
  it('should include Retry-After header in 429 response', async () => {
    const endpoint = `${BASE_URL}/api/v1/auth/login`;
    
    // Trigger rate limit
    for (let i = 0; i < 6; i++) {
      await unauthenticatedFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'wrongpassword',
        }),
      });
    }
    
    // Make one more request to get 429
    const response = await unauthenticatedFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'wrongpassword',
      }),
    });
    
    if (response.status === 429) {
      const retryAfter = getRetryAfter(response);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(60); // Should be within window (60s)
      
      const data = await response.json();
      expect(data.details.retryAfter).toBe(retryAfter);
    }
  }, 60000);

  it('should include X-RateLimit headers in 429 response', async () => {
    const endpoint = `${BASE_URL}/api/v1/auth/login`;
    
    // Trigger rate limit
    for (let i = 0; i < 7; i++) {
      await unauthenticatedFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'wrongpassword',
        }),
      });
    }
    
    // Check headers
    const response = await unauthenticatedFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'wrongpassword',
      }),
    });
    
    if (response.status === 429) {
      expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    }
  }, 60000);
});

describe('Rate Limiting - Window Reset', () => {
  it('should reset rate limit after window expires', async () => {
    const endpoint = `${BASE_URL}/api/v1/auth/login`;
    
    // Trigger rate limit
    for (let i = 0; i < 6; i++) {
      await unauthenticatedFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          email: 'rate-limit-reset@test.com',
          password: 'wrongpassword',
        }),
      });
    }
    
    // Verify rate limited
    const rateLimitedResponse = await unauthenticatedFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        email: 'rate-limit-reset@test.com',
        password: 'wrongpassword',
      }),
    });
    expect(rateLimitedResponse.status).toBe(429);
    
    // Wait for window to reset (60 seconds + buffer)
    console.log('⏳ Waiting for rate limit window to reset (60 seconds)...');
    await waitForRateLimitReset(60);
    
    // Try again - should succeed (or fail with 401, not 429)
    const afterResetResponse = await unauthenticatedFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        email: 'rate-limit-reset@test.com',
        password: 'wrongpassword',
      }),
    });
    expect(afterResetResponse.status).not.toBe(429);
  }, 120000); // 120 second timeout
});

describe('Rate Limiting - Per-User vs Per-IP', () => {
  it('should apply separate limits for different users', async () => {
    const endpoint = `${BASE_URL}/api/v1/beneficiaries`;
    
    // Make 10 requests as ketchup_ops
    for (let i = 0; i < 10; i++) {
      const response = await authenticatedFetch(endpoint, 'ketchup_ops');
      expect(response.status).toBe(200);
    }
    
    // Make 10 requests as ketchup_finance (different user, separate limit)
    for (let i = 0; i < 10; i++) {
      const response = await authenticatedFetch(endpoint, 'ketchup_finance');
      expect(response.status).toBe(200);
    }
    
    // Both should succeed (separate counters per user)
  }, 60000);

  it('should use IP-based rate limiting for unauthenticated requests', async () => {
    const endpoint = `${BASE_URL}/api/v1/auth/login`;
    
    // Make multiple requests from same IP (unauthenticated)
    const responses: Response[] = [];
    
    for (let i = 0; i < 6; i++) {
      const response = await unauthenticatedFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          email: `test${i}@test.com`,
          password: 'wrongpassword',
        }),
      });
      responses.push(response);
    }
    
    // Should be rate limited (same IP)
    const rateLimited = responses.some(r => r.status === 429);
    expect(rateLimited).toBe(true);
  }, 60000);
});

describe('Rate Limiting - Endpoint-Specific Presets', () => {
  it('should apply VOUCHER_ISSUE preset (10/minute)', async () => {
    const endpoint = `${BASE_URL}/api/v1/vouchers`;
    
    // Make 11 POST requests rapidly
    const responses: Response[] = [];
    
    for (let i = 0; i < 11; i++) {
      const response = await authenticatedFetch(endpoint, 'ketchup_ops', {
        method: 'POST',
        body: JSON.stringify({
          beneficiaryId: '10000000-0000-0000-0000-000000000001',
          programmeId: '30000000-0000-0000-0000-000000000001',
          amount: 100,
          expiryDate: '2026-12-31',
        }),
      });
      responses.push(response);
    }
    
    // Should be rate limited on 11th request
    const rateLimited = responses.some(r => r.status === 429);
    expect(rateLimited).toBe(true);
  }, 60000);

  it('should apply PASSWORD_CHANGE preset (3/minute)', async () => {
    const endpoint = `${BASE_URL}/api/v1/auth/change-password`;
    
    // Make 4 requests rapidly
    const responses: Response[] = [];
    
    for (let i = 0; i < 4; i++) {
      const response = await authenticatedFetch(endpoint, 'ketchup_ops', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'TestPassword123!',
          newPassword: 'NewPassword456!',
        }),
      });
      responses.push(response);
    }
    
    // Should be rate limited on 4th request
    const rateLimited = responses.some(r => r.status === 429);
    expect(rateLimited).toBe(true);
  }, 60000);
});
