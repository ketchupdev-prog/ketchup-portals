'use client';

/**
 * Pagination – Standalone pagination controls. Uses DaisyUI join for buttons.
 * Location: src/components/ui/pagination.tsx
 */

import { cn } from '@/lib/utils';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPrevNext?: boolean;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  showPrevNext = true,
  className = '',
}: PaginationProps) {
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;
  const pages: number[] = [];
  const radius = 1;
  for (let i = Math.max(1, page - radius); i <= Math.min(totalPages, page + radius); i++) {
    pages.push(i);
  }
  if (totalPages > 0 && pages[0] > 1) pages.unshift(1);
  if (totalPages > 0 && pages[pages.length - 1] < totalPages) pages.push(totalPages);

  return (
    <div className={cn('join', className)} role="navigation" aria-label="Pagination">
      {showPrevNext && (
        <button
          type="button"
          className="join-item btn btn-sm"
          disabled={prevDisabled}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          «
        </button>
      )}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={cn('join-item btn btn-sm', p === page && 'btn-active')}
          onClick={() => onPageChange(p)}
          aria-label={`Page ${p}`}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      {showPrevNext && (
        <button
          type="button"
          className="join-item btn btn-sm"
          disabled={nextDisabled}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          »
        </button>
      )}
    </div>
  );
}
