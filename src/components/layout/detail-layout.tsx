'use client';

/**
 * DetailLayout – Detail page layout with breadcrumbs, title, subtitle, and tabs (molecule view).
 * Location: src/components/layout/detail-layout.tsx
 */

import { useState, type ReactNode } from 'react';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { Tabs } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface DetailLayoutTab {
  value: string;
  label: string;
  content: ReactNode;
}

export interface DetailLayoutProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  tabs: DetailLayoutTab[];
  defaultTab?: string;
  /** Optional action buttons (e.g. Suspend, Add voucher) */
  actions?: ReactNode;
  className?: string;
}

export function DetailLayout({
  breadcrumbs,
  title,
  subtitle,
  tabs,
  defaultTab,
  actions,
  className = '',
}: DetailLayoutProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.value ?? '');

  return (
    <div className={cn('space-y-6', className)}>
      <Breadcrumbs items={breadcrumbs} />
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">{title}</h1>
          {subtitle != null && <p className="text-content-muted mt-0.5">{subtitle}</p>}
        </div>
        {actions != null && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {tabs.length > 0 ? (
        <Tabs
          tabs={tabs.map((t) => ({ key: t.value, label: t.label, content: t.content }))}
          value={activeTab}
          onChange={setActiveTab}
          variant="bordered"
        />
      ) : null}
    </div>
  );
}
