/**
 * Alert System for Financial Dashboards
 * Triggers notifications for critical events:
 * - Reconciliation failures
 * - Low transaction success rates
 * - Capital adequacy breaches
 * - High-value transactions
 */

export interface Alert {
  id: string;
  type: 'RECONCILIATION' | 'TRANSACTION' | 'CAPITAL' | 'HIGH_VALUE';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  metadata?: Record<string, any>;
}

const ALERTS_ENDPOINT = process.env.NEXT_PUBLIC_SMARTPAY_BACKEND_URL || 'http://localhost:8080';

export async function getActiveAlerts(): Promise<Alert[]> {
  const response = await fetch(`${ALERTS_ENDPOINT}/api/v1/admin/alerts/active`);
  if (!response.ok) {
    throw new Error(`Failed to fetch alerts: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data || data;
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  const response = await fetch(`${ALERTS_ENDPOINT}/api/v1/admin/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to acknowledge alert: ${response.statusText}`);
  }
}

export async function triggerAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>): Promise<Alert> {
  const response = await fetch(`${ALERTS_ENDPOINT}/api/v1/admin/alerts/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alert),
  });
  if (!response.ok) {
    throw new Error(`Failed to trigger alert: ${response.statusText}`);
  }
  return response.json();
}

export function checkReconciliationAlert(discrepancy: number): Alert | null {
  if (Math.abs(discrepancy) > 10000) {
    return {
      id: `reconciliation-${Date.now()}`,
      type: 'RECONCILIATION',
      severity: 'CRITICAL',
      title: 'Critical Reconciliation Discrepancy',
      message: `Trust account discrepancy of N$${Math.abs(discrepancy).toLocaleString()} exceeds threshold. System halt required.`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      metadata: { discrepancy },
    };
  }
  return null;
}

export function checkTransactionSuccessAlert(successRate: number): Alert | null {
  if (successRate < 0.99) {
    return {
      id: `transaction-${Date.now()}`,
      type: 'TRANSACTION',
      severity: 'WARNING',
      title: 'Low Transaction Success Rate',
      message: `Transaction success rate of ${(successRate * 100).toFixed(1)}% is below 99% threshold.`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      metadata: { successRate },
    };
  }
  return null;
}

export function checkCapitalAdequacyAlert(ratio: number): Alert | null {
  if (ratio < 1.0) {
    return {
      id: `capital-critical-${Date.now()}`,
      type: 'CAPITAL',
      severity: 'CRITICAL',
      title: 'Critical: Capital Adequacy Below 100%',
      message: `Capital adequacy ratio of ${(ratio * 100).toFixed(2)}% is below regulatory minimum. Operations must halt.`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      metadata: { ratio },
    };
  }
  if (ratio < 1.05) {
    return {
      id: `capital-warning-${Date.now()}`,
      type: 'CAPITAL',
      severity: 'WARNING',
      title: 'Warning: Low Capital Cushion',
      message: `Capital adequacy ratio of ${(ratio * 100).toFixed(2)}% is below 105% threshold.`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      metadata: { ratio },
    };
  }
  return null;
}

export function checkHighValueTransactionAlert(amount: number, threshold: number = 50000): Alert | null {
  if (amount > threshold) {
    return {
      id: `high-value-${Date.now()}`,
      type: 'HIGH_VALUE',
      severity: 'INFO',
      title: 'High-Value Transaction Detected',
      message: `Transaction of N$${amount.toLocaleString()} exceeds N$${threshold.toLocaleString()} threshold.`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      metadata: { amount, threshold },
    };
  }
  return null;
}
