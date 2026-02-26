'use client';

import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = "We couldn't load this content. Please try again.",
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center gap-4',
        className
      )}
      role="alert"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 text-error"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-content-muted mt-1">{message}</p>
      </div>
      {onRetry != null && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
