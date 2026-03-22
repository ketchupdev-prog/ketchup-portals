'use client';

/**
 * Tabs – Tabbed interface for detail views. Uses DaisyUI tabs.
 * Location: src/components/ui/tabs.tsx
 * 
 * Supports both APIs:
 * 1. DaisyUI pattern: <Tabs tabs={[...]} value={...} onChange={...} />
 * 2. shadcn/ui pattern: <Tabs><TabsList><TabsTrigger /></TabsList><TabsContent /></Tabs>
 */

import { cn } from '@/lib/utils';
import React, { createContext, useContext, useState } from 'react';

// DaisyUI API (original)
export interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs?: TabItem[]; // Optional for shadcn API
  value?: string;
  onChange?: (key: string) => void;
  variant?: 'bordered' | 'lifted' | 'boxed';
  className?: string;
  defaultValue?: string;
  children?: React.ReactNode;
}

// shadcn/ui Context for new API
const TabsContext = createContext<{
  value: string;
  onChange: (value: string) => void;
} | null>(null);

// Main Tabs component (supports both APIs)
export function Tabs({ tabs, value: controlledValue, onChange, variant = 'bordered', className = '', defaultValue, children }: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || '');
  const value = controlledValue ?? uncontrolledValue;
  const handleChange = onChange ?? setUncontrolledValue;

  // If tabs array provided, use DaisyUI API
  if (tabs) {
    return (
      <div className={cn('tabs tabs-' + variant, className)} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={value === tab.key}
            className={cn('tab', value === tab.key && 'tab-active')}
            onClick={() => handleChange(tab.key)}
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

  // Otherwise use shadcn/ui API with children
  return (
    <TabsContext.Provider value={{ value, onChange: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// shadcn/ui sub-components
export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('tabs tabs-boxed mb-4', className)} role="tablist">{children}</div>;
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  return (
    <button
      type="button"
      role="tab"
      aria-selected={context.value === value}
      className={cn('tab', context.value === value && 'tab-active', className)}
      onClick={() => context.onChange(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return (
    <div className={cn('mt-4', className)} role="tabpanel">
      {children}
    </div>
  );
}
