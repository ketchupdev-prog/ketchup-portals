/**
 * Test setup and global configuration
 * Location: src/lib/test-utils/setup.ts
 */

import { beforeAll, afterAll } from 'vitest';

// Global test configuration
beforeAll(() => {
  // Set environment variables for tests
  process.env.NODE_ENV = 'test';
  process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-key';
  
  console.log('🧪 Starting test suite...');
});

afterAll(() => {
  console.log('✅ Test suite complete');
});

// Increase timeout for integration tests
if (typeof globalThis.setTimeout !== 'undefined') {
  globalThis.setTimeout(() => {}, 120000); // 2 minute max timeout
}
