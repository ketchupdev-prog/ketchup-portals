'use client';

/**
 * Breadcrumbs – Hierarchical navigation trail.
 * Location: src/components/ui/breadcrumbs.tsx
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <div className={cn('breadcrumbs text-sm', className)}>
      <ul>
        {items.map((item, i) => (
          <li key={i}>
            {item.href != null && i < items.length - 1 ? (
              <Link href={item.href} className="text-content-muted hover:text-base-content">
                {item.label}
              </Link>
            ) : (
              <span className={i === items.length - 1 ? 'font-medium' : 'text-content-muted'}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
