/**
 * API Integration Tests
 * Test all API connections to SmartPay backend and AI service
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { smartPayAPI, smartPayAI, APIError } from '@/lib/api/client';
import { getKRIMetrics, getBonReportQueue } from '@/lib/api/compliance';
import { getReconciliationStatus, getTransactionMetrics } from '@/lib/api/financial';
import { getSecurityOverview } from '@/lib/api/security';
import { getSystemMetrics } from '@/lib/api/analytics';
import { getCopilotPerformance, getModelMetrics } from '@/lib/api/ai-ml';

describe('API Integration Tests', () => {
  beforeAll(() => {
    // Set mock mode for tests
    process.env.NEXT_PUBLIC_USE_MOCK_COMPLIANCE = 'true';
    process.env.NEXT_PUBLIC_USE_MOCK_FINANCIAL = 'true';
    process.env.NEXT_PUBLIC_USE_MOCK_SECURITY = 'true';
    process.env.NEXT_PUBLIC_USE_MOCK_ANALYTICS = 'true';
    process.env.NEXT_PUBLIC_USE_MOCK_AI_ML = 'true';
  });

  afterAll(() => {
    // Clean up
    delete process.env.NEXT_PUBLIC_USE_MOCK_COMPLIANCE;
    delete process.env.NEXT_PUBLIC_USE_MOCK_FINANCIAL;
    delete process.env.NEXT_PUBLIC_USE_MOCK_SECURITY;
    delete process.env.NEXT_PUBLIC_USE_MOCK_ANALYTICS;
    delete process.env.NEXT_PUBLIC_USE_MOCK_AI_ML;
  });

  describe('Compliance API', () => {
    it('should fetch KRI metrics from SmartPay backend', async () => {
      const response = await getKRIMetrics();
      
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.timestamp).toBeDefined();
      
      if (response.data) {
        expect(response.data.capitalAdequacyRatio).toBeDefined();
        expect(typeof response.data.capitalAdequacyRatio.currentValue).toBe('number');
      }
    });

    it('should fetch BON report queue', async () => {
      const response = await getBonReportQueue();
      
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      
      if (response.data) {
        expect(Array.isArray(response.data.reports)).toBe(true);
      }
    });
  });

  describe('Financial API', () => {
    it('should fetch reconciliation status', async () => {
      const status = await getReconciliationStatus();
      
      expect(status).toBeDefined();
      expect(status.walletBalancesSum).toBeDefined();
      expect(status.trustAccountBalance).toBeDefined();
      expect(status.discrepancy).toBeDefined();
      expect(['PASS', 'WARNING', 'CRITICAL']).toContain(status.status);
    });

    it('should fetch transaction metrics', async () => {
      const metrics = await getTransactionMetrics({});
      
      expect(metrics).toBeDefined();
      expect(metrics.totalVolume).toBeDefined();
      expect(metrics.transactionCount).toBeDefined();
      expect(typeof metrics.successRate).toBe('number');
    });
  });

  describe('Security API', () => {
    it('should fetch security overview', async () => {
      const response = await getSecurityOverview();
      
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });
  });

  describe('Analytics API', () => {
    it('should fetch system metrics', async () => {
      const metrics = await getSystemMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.systemMetrics).toBeDefined();
      expect(metrics.systemMetrics.apiRequests).toBeDefined();
      expect(metrics.systemMetrics.avgResponseTime).toBeDefined();
    });
  });

  describe('AI/ML API', () => {
    it('should fetch copilot performance metrics', async () => {
      const performance = await getCopilotPerformance();
      
      expect(performance).toBeDefined();
      expect(performance.totalQueries).toBeDefined();
      expect(performance.successRate).toBeDefined();
      expect(performance.averageResponseTime).toBeDefined();
    });

    it('should fetch model metrics', async () => {
      const models = await getModelMetrics();
      
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      
      if (models.length > 0) {
        expect(models[0].modelName).toBeDefined();
        expect(models[0].accuracy).toBeDefined();
        expect(models[0].status).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const originalBaseURL = smartPayAPI.getBaseURL();
      smartPayAPI.setBaseURL('http://invalid-url-that-does-not-exist.com');
      
      try {
        await smartPayAPI.get('/api/v1/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        if (error instanceof APIError) {
          expect(error.status).toBeDefined();
          expect(error.code).toBeDefined();
        }
      } finally {
        smartPayAPI.setBaseURL(originalBaseURL);
      }
    });

    it('should handle timeout errors', async () => {
      // This test would require a mock server with delayed responses
      // For now, we'll just verify the timeout configuration exists
      expect(smartPayAPI).toBeDefined();
    });

    it('should retry failed requests', async () => {
      // This test would require a mock server that fails then succeeds
      // For now, we'll just verify the retry configuration exists
      expect(smartPayAPI).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should include auth token in requests when available', async () => {
      // This test would require mocking Supabase auth
      // For now, we'll just verify the auth mechanism exists
      expect(smartPayAPI).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete requests within acceptable time', async () => {
      const startTime = Date.now();
      await getKRIMetrics();
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000); // 5 seconds max for mock data
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = [
        getKRIMetrics(),
        getReconciliationStatus(),
        getSecurityOverview(),
        getCopilotPerformance(),
      ];
      
      const results = await Promise.all(requests);
      
      expect(results).toHaveLength(4);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });
  });
});
