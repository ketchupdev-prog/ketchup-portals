'use client';

import { cn } from '@/lib/utils';

export interface SearchHeaderProps {
  title: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  action?: React.ReactNode;
  className?: string;
}

export function SearchHeader({
  title,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  action,
  className = '',
}: SearchHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4', className)}>
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <label className="input input-bordered input-sm flex items-center gap-2 w-full sm:w-64" aria-label="Search">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-4 h-4 opacity-70"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            className="grow"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </label>
        {action}
      </div>
    </div>
  );
}
