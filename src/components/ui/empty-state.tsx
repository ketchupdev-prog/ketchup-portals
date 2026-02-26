'use client';

import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const defaultIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-16 w-16 text-base-content/30"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center gap-4',
        className
      )}
    >
      {icon ?? defaultIcon}
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        {description != null && (
          <p className="text-sm text-content-muted mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
