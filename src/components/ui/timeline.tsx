'use client';

import { cn } from '@/lib/utils';

export interface TimelineItemProps {
  title?: React.ReactNode;
  time?: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItemProps[];
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

export function Timeline(props: TimelineProps) {
  const { items, direction = 'vertical', className } = props;
  return (
    <ul className={cn('timeline', direction === 'horizontal' && 'timeline-horizontal', className)}>
      {items.map((item, i) => (
        <li key={i}>
          {item.time != null && <div className="timeline-start">{item.time}</div>}
          <div className="timeline-middle">{item.icon ?? null}</div>
          <div className="timeline-end timeline-box">
            {item.title != null && <div className="font-semibold">{item.title}</div>}
            <div className="text-sm text-content-muted">{item.content}</div>
          </div>
          <hr />
        </li>
      ))}
    </ul>
  );
}
