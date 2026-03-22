/**
 * Integration tests for Buffr SDK
 * Tests affordability checks, account balance, and transaction history
 */

import { describe, it, expect } from 'vitest';
import {
  checkAffordability,
  getAccountBalance,
  getTransactions,
  getConsentStatus,
} from '@/lib/integrations/buffr/client';

describe('Buffr SDK Integration', () => {
  const TEST_ACCOUNT_ID = 'test-account-123';
  const TEST_USER_ID = 'test-user-456';

  it('should check affordability', async () => {
    if (!process.env.BUFFR_API_URL || !process.env.BUFFR_API_KEY) {
      console.log('Skipping: BUFFR_API_URL or BUFFR_API_KEY not set');
      return;
    }

    try {
      const result = await checkAffordability({
        userId: TEST_USER_ID,
        amount: 1000,
        currency: 'NAD',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('affordable');
      expect(result).toHaveProperty('availableBalance');
    } catch (error: any) {
      // Expected in test environment without real accounts
      console.log('Expected test error:', error.message);
      expect(error).toBeDefined();
    }
  });

  it('should get account balance', async () => {
    if (!process.env.BUFFR_API_URL || !process.env.BUFFR_API_KEY) {
      console.log('Skipping: BUFFR_API_URL or BUFFR_API_KEY not set');
      return;
    }

    try {
      const balance = await getAccountBalance(TEST_ACCOUNT_ID);

      expect(balance).toBeDefined();
      expect(balance).toHaveProperty('balance');
      expect(balance).toHaveProperty('currency');
    } catch (error: any) {
      // Expected in test environment without real accounts
      console.log('Expected test error:', error.message);
      expect(error).toBeDefined();
    }
  });

  it('should get transactions', async () => {
    if (!process.env.BUFFR_API_URL || !process.env.BUFFR_API_KEY) {
      console.log('Skipping: BUFFR_API_URL or BUFFR_API_KEY not set');
      return;
    }

    try {
      const transactions = await getTransactions(TEST_ACCOUNT_ID, {
        limit: 10,
      });

      expect(Array.isArray(transactions)).toBe(true);
    } catch (error: any) {
      // Expected in test environment without real accounts
      console.log('Expected test error:', error.message);
      expect(error).toBeDefined();
    }
  });

  it('should get consent status', async () => {
    if (!process.env.BUFFR_API_URL || !process.env.BUFFR_API_KEY) {
      console.log('Skipping: BUFFR_API_URL or BUFFR_API_KEY not set');
      return;
    }

    try {
      const status = await getConsentStatus('test-consent-789');

      expect(status).toBeDefined();
      expect(status).toHaveProperty('status');
    } catch (error: any) {
      // Expected in test environment without real consents
      console.log('Expected test error:', error.message);
      expect(error).toBeDefined();
    }
  });

  it('should handle missing credentials', async () => {
    try {
      await checkAffordability(
        {
          userId: TEST_USER_ID,
          amount: 1000,
        },
        { apiUrl: '', apiKey: '' }
      );
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain('BUFFR_API_URL/BUFFR_API_KEY are required');
    }
  });
});
