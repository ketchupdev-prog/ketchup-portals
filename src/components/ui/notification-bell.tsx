'use client';

/**
 * NotificationBell – Real-time notifications indicator with optional count badge.
 * Location: src/components/ui/notification-bell.tsx
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface NotificationBellProps {
  count?: number;
  href?: string;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

export function NotificationBell({
  count = 0,
  href,
  onClick,
  className = '',
  ariaLabel = 'Notifications',
}: NotificationBellProps) {
  const showBadge = count > 0;
  const label = showBadge ? `${count} unread notifications` : ariaLabel;

  const content = (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {showBadge && (
        <span className="badge badge-sm badge-error absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </>
  );

  const wrapperClass = cn(
    'btn btn-ghost btn-circle btn-sm relative inline-flex items-center justify-center',
    className
  );

  if (href != null) {
    return (
      <Link href={href} className={wrapperClass} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={wrapperClass} onClick={onClick} aria-label={label}>
      {content}
    </button>
  );
}
