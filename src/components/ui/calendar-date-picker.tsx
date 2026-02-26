'use client';

/**
 * CalendarDatePicker – Calendar popover for single-date selection using react-day-picker v9.
 * Location: src/components/ui/calendar-date-picker.tsx
 * Use when you need a calendar UI instead of native input; integrates with DaisyUI.
 */

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface CalendarDatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  fromDate?: Date;
  toDate?: Date;
  className?: string;
  inputSize?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeClass = { xs: 'input-xs', sm: 'input-sm', md: 'input-md', lg: 'input-lg' };

export function CalendarDatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  label,
  error,
  disabled,
  fromDate,
  toDate,
  className,
  inputSize = 'md',
}: CalendarDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(value ?? undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(value ?? undefined);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleSelect = (date: Date | undefined) => {
    setSelected(date);
    onChange?.(date);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('form-control w-full', className)}>
      {label != null && (
        <label className="label" htmlFor="calendar-date-picker-input">
          <span className="label-text">{label}</span>
        </label>
      )}
      <div className={cn('dropdown dropdown-bottom w-full', open && 'dropdown-open')}>
        <label
          tabIndex={0}
          role="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!disabled) setOpen((o) => !o);
            }
          }}
          className={cn(
            'input input-bordered w-full flex items-center cursor-pointer',
            sizeClass[inputSize],
            error && 'input-error',
            disabled && 'input-disabled'
          )}
          aria-expanded={open}
          aria-haspopup="dialog"
          id="calendar-date-picker-input"
        >
          <span className={selected ? format(selected, 'PPP') : placeholder} />
        </label>
        <div
          tabIndex={0}
          className="dropdown-content z-50 p-4 shadow-lg bg-base-100 rounded-box border border-base-300"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={disabled}
            fromDate={fromDate}
            toDate={toDate}
            onMonthChange={() => {}}
            classNames={{
              root: 'rdp-root',
              month: 'rdp-month',
              month_caption: 'flex justify-between items-center h-9 mb-2',
              nav: 'flex gap-1',
              button_previous: 'btn btn-sm btn-ghost',
              button_next: 'btn btn-sm btn-ghost',
              month_grid: 'w-full border-collapse',
              weekdays: 'rdp-weekdays',
              weekday: 'text-content-muted text-xs p-1',
              week: 'rdp-week',
              day: 'rdp-day',
              day_button: 'btn btn-sm btn-ghost w-9 h-9 p-0 rounded-full',
              selected: 'btn-primary text-primary-content',
              today: 'btn-accent',
              outside: 'text-base-content/30',
              disabled: 'btn-disabled opacity-50',
              hidden: 'invisible',
            }}
          />
        </div>
      </div>
      {error != null && <p className="label text-error text-sm mt-0.5">{error}</p>}
    </div>
  );
}
