'use client';

import { cn } from '@/lib/utils';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2', className)}>
      <div>
        <h2 className="text-lg font-semibold text-base-content">{title}</h2>
        {description != null && <p className="text-sm text-content-muted mt-0.5">{description}</p>}
      </div>
      {action != null && <div className="shrink-0">{action}</div>}
    </div>
  );
}
