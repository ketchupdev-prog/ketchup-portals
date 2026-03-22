/**
 * Buffr Connect SDK Client for Ketchup Portals
 * 
 * Integrates with Buffr Connect API for:
 * - Open Banking account access (AIS)
 * - Affordability checks
 * - Transaction history
 * - Consent management
 * 
 * Shared Supabase Auth: Uses session tokens from Supabase (cjmtcxfpwjbpbctjseex)
 * 
 * Location: src/lib/integrations/buffr/client.ts
 */

const BUFFR_API_URL = process.env.BUFFR_API_URL || process.env.BUFFR_CONNECT_URL;
const BUFFR_API_KEY = process.env.BUFFR_API_KEY;

interface BuffrConfig {
  apiUrl?: string;
  apiKey?: string;
  accessToken?: string;
}

interface AccountBalance {
  accountId: string;
  balance: number;
  currency: string;
  availableBalance?: number;
  timestamp: string;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  timestamp: string;
  type: 'credit' | 'debit';
}

interface AffordabilityCheckRequest {
  userId: string;
  amount: number;
  currency?: string;
}

interface AffordabilityCheckResponse {
  affordable: boolean;
  availableBalance: number;
  recommendedAmount?: number;
  reasons?: string[];
}

interface ConsentStatus {
  consentId: string;
  status: 'active' | 'expired' | 'revoked';
  expiresAt: string;
  permissions: string[];
}

function assertConfigured(config?: BuffrConfig) {
  const apiUrl = config?.apiUrl || BUFFR_API_URL;
  const apiKey = config?.apiKey || BUFFR_API_KEY;
  
  if (!apiUrl || !apiKey) {
    throw new Error('BUFFR_API_URL/BUFFR_API_KEY are required for Buffr integration');
  }
}

export async function buffrFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  config?: BuffrConfig
): Promise<T> {
  assertConfigured(config);

  const apiUrl = config?.apiUrl || BUFFR_API_URL;
  const apiKey = config?.apiKey || BUFFR_API_KEY;
  const accessToken = config?.accessToken;

  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: accessToken ? `Bearer ${accessToken}` : `Bearer ${apiKey}`,
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Buffr API request failed (${response.status}): ${body}`);
  }

  return (await response.json()) as T;
}

/**
 * Get account balance for a beneficiary
 */
export async function getAccountBalance(
  accountId: string,
  config?: BuffrConfig
): Promise<AccountBalance> {
  return buffrFetch<AccountBalance>(`/ais/balance/${accountId}`, {}, config);
}

/**
 * Get transaction history for an account
 */
export async function getTransactions(
  accountId: string,
  params?: { from?: string; to?: string; limit?: number },
  config?: BuffrConfig
): Promise<Transaction[]> {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.limit) query.set('limit', params.limit.toString());

  const endpoint = `/ais/transactions/${accountId}${query.toString() ? `?${query}` : ''}`;
  return buffrFetch<Transaction[]>(endpoint, {}, config);
}

/**
 * Check if user can afford a specific amount (affordability assessment)
 */
export async function checkAffordability(
  request: AffordabilityCheckRequest,
  config?: BuffrConfig
): Promise<AffordabilityCheckResponse> {
  return buffrFetch<AffordabilityCheckResponse>(
    '/affordability/check',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
    config
  );
}

/**
 * Get consent status for a user
 */
export async function getConsentStatus(
  consentId: string,
  config?: BuffrConfig
): Promise<ConsentStatus> {
  return buffrFetch<ConsentStatus>(`/consents/${consentId}`, {}, config);
}

/**
 * Initiate Open Banking consent flow
 */
export async function initiateConsent(
  userId: string,
  permissions: string[],
  config?: BuffrConfig
): Promise<{ consentUrl: string; consentId: string }> {
  return buffrFetch<{ consentUrl: string; consentId: string }>(
    '/consents/initiate',
    {
      method: 'POST',
      body: JSON.stringify({ userId, permissions }),
    },
    config
  );
}

/**
 * Revoke an existing consent
 */
export async function revokeConsent(
  consentId: string,
  config?: BuffrConfig
): Promise<{ success: boolean }> {
  return buffrFetch<{ success: boolean }>(
    `/consents/${consentId}/revoke`,
    {
      method: 'POST',
    },
    config
  );
}
