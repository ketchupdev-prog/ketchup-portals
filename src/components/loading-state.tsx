'use client';

import { cn } from '@/lib/utils';

export type LoadingType = 'spinner' | 'skeleton' | 'dots';

export interface LoadingStateProps {
  type?: LoadingType;
  message?: string;
  fullscreen?: boolean;
  className?: string;
}

export function LoadingState({
  type = 'spinner',
  message,
  fullscreen = false,
  className = '',
}: LoadingStateProps) {
  const containerClass = fullscreen
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-base-100/90 z-50'
    : 'flex flex-col items-center justify-center p-8 gap-4';

  return (
    <div
      className={cn(containerClass, className)}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      {type === 'spinner' && (
        <span className="loading loading-spinner loading-lg text-primary" />
      )}
      {type === 'dots' && (
        <span className="loading loading-dots loading-lg text-primary" />
      )}
      {type === 'skeleton' && (
        <div className="flex flex-col gap-3 w-full max-w-md">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-4 w-5/6" />
        </div>
      )}
      {message != null && <p className="text-sm text-content-muted">{message}</p>}
    </div>
  );
}
