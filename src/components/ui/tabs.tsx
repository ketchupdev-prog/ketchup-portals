'use client';

/**
 * Tabs – Tabbed interface for detail views. Uses DaisyUI tabs.
 * Location: src/components/ui/tabs.tsx
 */

import { cn } from '@/lib/utils';

export interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (key: string) => void;
  variant?: 'bordered' | 'lifted' | 'boxed';
  className?: string;
}

export function Tabs({ tabs, value, onChange, variant = 'bordered', className = '' }: TabsProps) {
  return (
    <div className={cn('tabs tabs-' + variant, className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={value === tab.key}
          className={cn('tab', value === tab.key && 'tab-active')}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
      <div className="w-full mt-4" role="tabpanel">
        {tabs.find((t) => t.key === value)?.content}
      </div>
    </div>
  );
}
