'use client';

/**
 * DescriptionList – Key-value pairs (dl/dt/dd) for details view.
 * Location: src/components/ui/description-list.tsx
 */

import { cn } from '@/lib/utils';

export interface DescriptionListItem {
  term: string;
  description: React.ReactNode;
}

export interface DescriptionListProps {
  items: DescriptionListItem[];
  layout?: 'stack' | 'grid' | 'inline';
  className?: string;
}

export function DescriptionList({
  items,
  layout = 'stack',
  className = '',
}: DescriptionListProps) {
  const layoutClass =
    layout === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2'
      : layout === 'inline'
        ? 'space-y-1'
        : 'space-y-2';

  return (
    <dl className={cn(layoutClass, className)}>
      {items.map((item, i) => (
        <div key={i} className={layout === 'inline' ? 'flex gap-2' : ''}>
          <dt className={cn('font-medium text-base-content', layout === 'inline' && 'shrink-0')}>
            {item.term}
          </dt>
          <dd className={cn('text-base-content', layout === 'inline' && '')}>{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}
