/**
 * Comprehensive Error Handling System
 * Centralized error handling with user-friendly messages and logging
 */

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

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
    };
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends APIError {
  constructor(message: string = 'Network request failed') {
    super(message, 0, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends APIError {
  constructor(message: string = 'Request timeout') {
    super(message, 408, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded', public retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class ServerError extends APIError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'SERVER_ERROR');
    this.name = 'ServerError';
  }
}

export interface ErrorContext {
  endpoint?: string;
  method?: string;
  userId?: string;
  timestamp: string;
  userAgent?: string;
}

export function handleAPIError(error: any, context?: ErrorContext): APIError {
  if (error instanceof APIError) {
    logError(error, context);
    return error;
  }

  if (error.response) {
    const { status, data } = error.response;
    const message = data?.message || data?.error || 'API request failed';
    const code = data?.code || getCodeFromStatus(status);

    let apiError: APIError;

    switch (status) {
      case 401:
        apiError = new AuthenticationError(message);
        break;
      case 403:
        apiError = new AuthorizationError(message);
        break;
      case 404:
        apiError = new NotFoundError(message);
        break;
      case 408:
        apiError = new TimeoutError(message);
        break;
      case 429:
        apiError = new RateLimitError(message, data?.retryAfter);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        apiError = new ServerError(message);
        break;
      default:
        apiError = new APIError(message, status, code, data?.details);
    }

    logError(apiError, context);
    return apiError;
  }

  if (error.request) {
    const networkError = new NetworkError('Network error: No response received');
    logError(networkError, context);
    return networkError;
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      const timeoutError = new TimeoutError('Request was aborted');
      logError(timeoutError, context);
      return timeoutError;
    }

    const unknownError = new APIError(error.message, 0, 'UNKNOWN_ERROR');
    logError(unknownError, context);
    return unknownError;
  }

  const unknownError = new APIError(
    'An unknown error occurred',
    0,
    'UNKNOWN_ERROR'
  );
  logError(unknownError, context);
  return unknownError;
}

function getCodeFromStatus(status: number): string {
  const codes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    408: 'TIMEOUT',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMIT',
    500: 'INTERNAL_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT',
  };
  return codes[status] || 'HTTP_ERROR';
}

function logError(error: APIError, context?: ErrorContext): void {
  const logData = {
    error: error.toJSON ? error.toJSON() : error,
    context,
    timestamp: new Date().toISOString(),
  };

  if (error.status >= 500) {
    console.error('[ERROR]', logData);
  } else if (error.status >= 400) {
    console.warn('[WARNING]', logData);
  } else {
    console.log('[INFO]', logData);
  }

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service (e.g., Sentry)
  }
}

export function getUserFriendlyMessage(error: APIError): string {
  if (error instanceof AuthenticationError) {
    return 'Please log in to continue.';
  }

  if (error instanceof AuthorizationError) {
    return 'You do not have permission to perform this action.';
  }

  if (error instanceof NotFoundError) {
    return 'The requested resource could not be found.';
  }

  if (error instanceof NetworkError) {
    return 'Network connection issue. Please check your internet connection.';
  }

  if (error instanceof TimeoutError) {
    return 'The request took too long. Please try again.';
  }

  if (error instanceof RateLimitError) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (error instanceof ServerError) {
    return 'A server error occurred. Our team has been notified.';
  }

  if (error.status >= 400 && error.status < 500) {
    return error.message || 'An error occurred with your request.';
  }

  if (error.status >= 500) {
    return 'A server error occurred. Please try again later.';
  }

  return 'An unexpected error occurred. Please try again.';
}

export function shouldRetry(error: APIError): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof TimeoutError) return true;
  if (error instanceof ServerError) return true;
  if (error instanceof RateLimitError) return true;
  if (error.status === 502 || error.status === 503 || error.status === 504) {
    return true;
  }
  return false;
}

export function getRetryDelay(error: APIError, attempt: number): number {
  if (error instanceof RateLimitError && error.retryAfter) {
    return error.retryAfter * 1000;
  }

  return Math.min(1000 * Math.pow(2, attempt), 30000);
}

export class ErrorBoundary {
  private static errorHandlers: Map<string, (error: APIError) => void> = new Map();

  static registerHandler(errorType: string, handler: (error: APIError) => void): void {
    this.errorHandlers.set(errorType, handler);
  }

  static handle(error: APIError): void {
    const handler = this.errorHandlers.get(error.name);
    if (handler) {
      handler(error);
    } else {
      console.error('Unhandled error:', error);
    }
  }
}
