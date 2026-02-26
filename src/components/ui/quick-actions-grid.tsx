'use client';

import { cn } from '@/lib/utils';
import { QuickAction, type QuickActionProps } from './quick-action';

export interface QuickActionsGridProps {
  actions: QuickActionProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const gridCols = { 2: 'grid-cols-2', 3: 'grid-cols-2 sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' };

export function QuickActionsGrid(props: QuickActionsGridProps) {
  const { actions, columns = 3, className } = props;
  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {actions.map((action, i) => <QuickAction key={i} {...action} />)}
    </div>
  );
}
