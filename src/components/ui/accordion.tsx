'use client';

/**
 * Accordion – Collapsible sections. Uses DaisyUI collapse/join.
 * Location: src/components/ui/accordion.tsx
 */

import { cn } from '@/lib/utils';

export interface AccordionItem {
  key: string;
  title: React.ReactNode;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({ items, allowMultiple = false, className = '' }: AccordionProps) {
  return (
    <div className={cn('join join-vertical w-full', className)}>
      {items.map((item) => (
        <div key={item.key} className="collapse collapse-arrow join-item border border-base-300">
          <input
            type={allowMultiple ? 'checkbox' : 'radio'}
            name={allowMultiple ? `accordion-${item.key}` : 'accordion'}
            defaultChecked={item.defaultOpen}
          />
          <div className="collapse-title font-medium">{item.title}</div>
          <div className="collapse-content">{item.content}</div>
        </div>
      ))}
    </div>
  );
}
