/**
 * Unified API Client for SmartPay Backend & AI Service
 * Features:
 * - Centralized fetch wrapper with error handling
 * - Authentication (JWT from Supabase)
 * - Retry logic (3 attempts with exponential backoff)
 * - Request/response logging
 * - Timeout configuration (30s default)
 * - Type-safe responses
 */

import { createClient } from '@/lib/supabase/client';

export interface APIClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  withAuth?: boolean;
  logRequests?: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  statusCode?: number;
}

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class APIClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;
  private defaultHeaders: Record<string, string>;
  private withAuth: boolean;
  private logRequests: boolean;

  constructor(config: APIClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000; // 30 seconds
    this.retries = config.retries || 3;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    this.withAuth = config.withAuth !== false;
    this.logRequests = config.logRequests !== false;
  }

  private async getAuthToken(): Promise<string | null> {
    if (!this.withAuth) return null;

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIError(
          `Request timeout after ${timeoutMs}ms`,
          408,
          'TIMEOUT_ERROR'
        );
      }
      throw error;
    }
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.retries - 1) {
        throw error;
      }

      const isRetryable =
        error instanceof APIError &&
        (error.status >= 500 || error.status === 429 || error.status === 408);

      if (!isRetryable) {
        throw error;
      }

      const delay = Math.pow(2, attempt) * 1000;
      if (this.logRequests) {
        console.log(
          `Retrying request (attempt ${attempt + 1}/${this.retries}) after ${delay}ms`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, attempt + 1);
    }
  }

  private logRequest(method: string, url: string, data?: any): void {
    if (!this.logRequests) return;

    console.log(`[API ${method}] ${url}`, {
      timestamp: new Date().toISOString(),
      data: data ? JSON.stringify(data).slice(0, 200) : undefined,
    });
  }

  private logResponse(
    method: string,
    url: string,
    status: number,
    duration: number
  ): void {
    if (!this.logRequests) return;

    console.log(`[API ${method}] ${url} - ${status}`, {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
    });
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = Date.now();

    this.logRequest(method, url, data);

    const executeRequest = async (): Promise<T> => {
      const token = await this.getAuthToken();
      const headers: Record<string, string> = {
        ...this.defaultHeaders,
        ...customHeaders,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const options: RequestInit = {
        method,
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
      }

      const response = await this.fetchWithTimeout(url, options, this.timeout);
      const duration = Date.now() - startTime;

      this.logResponse(method, url, response.status, duration);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorCode = 'HTTP_ERROR';
        let errorDetails;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          errorCode = errorData.code || errorCode;
          errorDetails = errorData.details;
        } catch {
          // Response is not JSON, use status text
        }

        throw new APIError(errorMessage, response.status, errorCode, errorDetails);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      return (await response.text()) as unknown as T;
    };

    return this.retryWithBackoff(executeRequest);
  }

  async get<T>(endpoint: string, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, customHeaders);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('POST', endpoint, data, customHeaders);
  }

  async put<T>(
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('PUT', endpoint, data, customHeaders);
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, customHeaders);
  }

  async delete<T>(endpoint: string, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, customHeaders);
  }

  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  getBaseURL(): string {
    return this.baseURL;
  }
}

export const smartPayAPI = new APIClient({
  baseURL:
    process.env.NEXT_PUBLIC_SMARTPAY_BACKEND_URL ||
    process.env.SMARTPAY_BACKEND_URL ||
    'http://localhost:4000',
  timeout: 30000,
  retries: 3,
  withAuth: true,
  logRequests: process.env.NODE_ENV === 'development',
});

export const smartPayAI = new APIClient({
  baseURL:
    process.env.NEXT_PUBLIC_SMARTPAY_AI_URL ||
    process.env.SMARTPAY_AI_URL ||
    'http://localhost:8000',
  timeout: 45000,
  retries: 3,
  withAuth: true,
  logRequests: process.env.NODE_ENV === 'development',
});

export function handleAPIError(error: any): APIError {
  if (error instanceof APIError) {
    return error;
  }

  if (error.response) {
    return new APIError(
      error.response.data?.message || 'API request failed',
      error.response.status,
      error.response.data?.code || 'UNKNOWN_ERROR',
      error.response.data?.details
    );
  }

  if (error.request) {
    return new APIError('Network error', 0, 'NETWORK_ERROR');
  }

  return new APIError(
    error instanceof Error ? error.message : 'Unknown error',
    0,
    'UNKNOWN_ERROR'
  );
}
