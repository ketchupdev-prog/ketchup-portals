/**
 * Date utilities – Re-exports and helpers for date-fns used across calendar, date picker, and scheduler.
 * Location: src/lib/date-utils.ts
 */

export {
  format,
  parse,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subMonths,
  isSameDay,
  isWithinInterval,
  isBefore,
  isAfter,
  differenceInDays,
  getDay,
  getMonth,
  getYear,
  setHours,
  setMinutes,
  setSeconds,
} from 'date-fns';
export { enUS } from 'date-fns/locale';
