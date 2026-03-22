# Date handling – Ketchup Portals

How dates and times are stored, sent over the API, and displayed in the UI. Use this when adding new date fields, filters, or report ranges.

---

## 1. Conventions

| Layer | Convention |
|-------|------------|
| **Database** | Store timestamps in **UTC** with timezone (`timestamp with time zone`). Store calendar dates as **date** (no time). |
| **API (JSON)** | Use **ISO 8601** strings: `"2025-02-26T14:30:00.000Z"` for timestamps, `"2025-02-26"` for date-only. |
| **API (query params)** | Use **date-only** for ranges: `from=2025-02-01&to=2025-02-26` (YYYY-MM-DD). |
| **UI display** | Use the **user’s locale** (e.g. `toLocaleString()`, `toLocaleDateString()`, or `date-fns` `format` with a locale). |

---

## 2. Library: date-fns

The project uses **date-fns** for parsing, formatting, and date math. Re-exports live in **`src/lib/date-utils.ts`** so one import covers most needs.

### Exports from `src/lib/date-utils.ts`

| Export | Use |
|--------|-----|
| `format`, `parse`, `parseISO` | Format/parse date strings; `parseISO` for ISO strings from the API. |
| `startOfDay`, `endOfDay`, `startOfWeek`, `endOfWeek`, `startOfMonth`, `endOfMonth` | Range boundaries for filters and reports. |
| `addDays`, `addWeeks`, `addMonths`, `subDays`, `subMonths` | Date arithmetic. |
| `isSameDay`, `isWithinInterval`, `isBefore`, `isAfter`, `differenceInDays` | Comparisons. |
| `getDay`, `getMonth`, `getYear`, `setHours`, `setMinutes`, `setSeconds` | Accessors and setters. |
| `enUS` | Locale for `format(..., { locale: enUS })` when you need an explicit locale. |

**Example**

```ts
import { format, parseISO, startOfMonth, endOfMonth, addDays } from '@/lib/date-utils';

const iso = '2025-02-26T14:30:00.000Z';
const d = parseISO(iso);
format(d, 'PPP');           // e.g. "February 26th, 2025"
format(d, 'yyyy-MM-dd');    // "2025-02-26"
format(d, 'HH:mm');         // "14:30" (in local time)

const start = startOfMonth(new Date());
const end = endOfMonth(new Date());
const nextWeek = addDays(new Date(), 7);
```

---

## 3. Database schema (Drizzle)

- **Timestamps:** `timestamp("column_name", { withTimezone: true })` → PostgreSQL `timestamp with time zone` (stored in UTC).
- **Date-only:** `date("column_name")` → PostgreSQL `date` (e.g. `expiry_date`, `start_date`, `end_date`).

When reading from the DB, Drizzle returns JavaScript `Date` objects for timestamp columns and date columns (time is midnight UTC for `date`). Use `.toISOString()` when building API responses (see below).

---

## 4. API: request and response

### Response bodies (JSON)

- **Timestamps:** Always return ISO 8601 strings: `created_at: row.createdAt.toISOString()`.
- **Date-only:** Return `YYYY-MM-DD`: `expiry_date: row.expiryDate` (if Drizzle returns a string) or `row.expiryDate.toISOString().slice(0, 10)` if it returns a `Date`.

### Query parameters (filters)

- Use **date-only** for range filters: `from`, `to` as `YYYY-MM-DD`.
- Example: `GET /api/v1/field/reports/activity?from=2025-02-01&to=2025-02-26`.
- Parse in the route with `new Date(from)` / `new Date(to)` or `parseISO(from)` for the start of day in local time; for DB comparisons use start/end of day in UTC if needed.

### Request bodies

- Accept **ISO 8601** for timestamps and **YYYY-MM-DD** for date-only fields.
- Example: `start_date: "2025-02-01"`, `issued_at: "2025-02-26T10:00:00.000Z"`.

---

## 5. UI components

| Component | Location | Use |
|-----------|----------|-----|
| **DatePicker** | `src/components/ui/date-picker.tsx` | Native `<input type="date">`. Value is `YYYY-MM-DD`; use for simple date fields and filters. |
| **CalendarDatePicker** | `src/components/ui/calendar-date-picker.tsx` | react-day-picker popover; displays selected date with `format(..., 'PPP')`. Value is `Date \| undefined`. |
| **Scheduler** | `src/components/ui/scheduler.tsx` | react-big-calendar with `dateFnsLocalizer`; uses `date-fns` for formatting. |

### Displaying dates in the UI

- **Date + time (e.g. “requested at”, “created at”):**  
  `new Date(iso).toLocaleString()` or `format(parseISO(iso), 'PPp', { locale: enUS })`.
- **Date only:**  
  `new Date(iso).toLocaleDateString()` or `format(parseISO(iso), 'PPP')`.
- **Short date/time (tables, compact UI):**  
  `new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })` (used in duplicates page).
- **Export filenames:**  
  `new Date().toISOString().slice(0, 10)` → `YYYY-MM-DD` (e.g. `vouchers-2025-02-26.csv`).

Using `toLocaleString()` / `toLocaleDateString()` without a locale uses the browser’s locale. For a fixed locale (e.g. en-GB, Africa/Windhoek), pass it as the first argument or use `date-fns` `format` with the matching `date-fns` locale.

---

## 6. Timezone and locale

- **Server (Neon/Node):** Dates are created and stored in UTC. Use `new Date()` or `toISOString().slice(0, 10)` for “today” in UTC when generating query ranges or defaults.
- **Client:** Display in the user’s locale (or a chosen app locale) via `toLocaleString` / `toLocaleDateString` or `date-fns` `format` with a locale.
- **Namibia:** If you need a fixed timezone (e.g. Africa/Windhoek), use `date-fns-tz` or format in that zone; document the choice in this file.

---

## 7. Quick reference

| Need | Code |
|------|------|
| Parse API timestamp | `parseISO(iso)` or `new Date(iso)` |
| Format for API response | `date.toISOString()` |
| Date-only for API (today) | `new Date().toISOString().slice(0, 10)` |
| Display date + time | `new Date(iso).toLocaleString()` or `format(parseISO(iso), 'PPp')` |
| Display date only | `new Date(iso).toLocaleDateString()` or `format(parseISO(iso), 'PPP')` |
| Start/end of month | `startOfMonth(d)`, `endOfMonth(d)` from `@/lib/date-utils` |
| Date range query params | `from`, `to` as `YYYY-MM-DD` |

---

## 8. References

- Schema and API fields: [DATABASE_AND_API_DESIGN.md](DATABASE_AND_API_DESIGN.md)
- date-fns patterns: [date-fns.org](https://date-fns.org/)
- Re-exports: `src/lib/date-utils.ts`
- Calendar/date components: [COMPONENT_INVENTORY.md](architecture/COMPONENT_INVENTORY.md) / [COMPONENT_BOILERPLATE_INVENTORY.md](COMPONENT_BOILERPLATE_INVENTORY.md)
