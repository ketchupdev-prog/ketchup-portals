'use client';

/**
 * Scheduler – Full calendar/scheduler view using react-big-calendar and date-fns localizer.
 * Location: src/components/ui/scheduler.tsx
 * Use for field tasks, maintenance slots, or any date/time events.
 */

import { Calendar, dateFnsLocalizer, type Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { cn } from '@/lib/utils';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

export interface SchedulerEvent extends Event {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  resource?: string | number;
}

export interface SchedulerProps {
  events: SchedulerEvent[];
  onSelectEvent?: (event: SchedulerEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  onRangeChange?: (range: Date[] | { start: Date; end: Date }) => void;
  defaultView?: 'month' | 'week' | 'day' | 'agenda';
  height?: number;
  className?: string;
}

export function Scheduler({
  events,
  onSelectEvent,
  onSelectSlot,
  onRangeChange,
  defaultView = 'month',
  height = 500,
  className,
}: SchedulerProps) {
  return (
    <div className={cn('scheduler rbc-override', className)}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        defaultView={defaultView}
        onSelectEvent={onSelectEvent as (e: Event) => void}
        onSelectSlot={onSelectSlot}
        onRangeChange={onRangeChange}
        style={{ height }}
      />
    </div>
  );
}
