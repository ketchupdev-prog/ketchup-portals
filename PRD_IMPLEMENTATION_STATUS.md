# Ketchup Portals – PRD Implementation Status

**Reference:** `KETCHUP_PORTALS_PRD.md` (v1.3)  
**Last checked:** Against current codebase (routes, components, pages).  
**Updated:** Offline Redemption Integrity (§3.2.11); §7.4 Notifications & Outbound Communications (SMS, email, push) added to PRD; implementation status below.

---

## Summary

| Area | Implemented | Partial | Not implemented |
|------|-------------|---------|-----------------|
| **Ketchup Portal** | Core list/detail, reconciliation, compliance, audit, mobile units; **audit**, **USSD viewer**, **reconciliation** wired to `/api/v1`; **Dashboard** counts from API; **Beneficiary detail** from API (lib/data/beneficiary + notFound); **Beneficiaries list** filters in URL (?region=, status=, verification=); **§3.2.11 Offline Redemption Integrity** – Duplicate Redemptions screen (`/ketchup/vouchers/duplicates`), Advance Ledger tab on beneficiary detail, sidebar link; APIs: voucher status, duplicate-redemptions list/PATCH, advance-ledger, summary | Voucher/agent details (some actions); PDF reports | Network Map, Terminal Inventory, App Analytics, expiry alerts, some detail actions |
| **Government Portal** | Programmes, unverified, vouchers wired to `/api/v1` (list, create, filter, export CSV); **Duplicate Redemption Metrics** on Voucher Monitoring page (read-only: duplicates detected, outstanding advances NAD, recovery rate %) | Dashboard, reports (PDF) | Auth, audit exports |
| **Agent Portal** | Dashboard, float, parcels wired to `/api/v1/agent/*` (demo `agent_id` until auth); **Profile** from GET `/api/v1/agents/[id]`; **Settlement** download as CSV on Float page | Auth |
| **Field Ops Portal** | Map, assets, tasks wired to `/api/v1/field/*` (map GeoJSON, assets list, tasks list/create/PATCH) | Route planning, activity reports | Auth |
| **Common** | Layout, sidebar, header, CSV export, toasts; **calendar/date/scheduler** (date-fns, react-day-picker v9, react-big-calendar) | Search/filter on some lists | Auth (Supabase), 2FA, PDF reports, Realtime |
| **Backend** | Database & API Design doc, Drizzle schema (Neon), full `/api/v1` (auth, beneficiaries, vouchers, agents, terminals, assets, reconciliation, audit, incidents, analytics, USSD, programmes, agent/*, field/*), beneficiaries & vouchers UI wired to API; **Offline Redemption Integrity**: `duplicate_redemption_events`, `beneficiary_advances`, `advance_recovery_transactions` tables; `duplicate-redemption-service.ts`; GET `/api/v1/vouchers/[id]/status`, GET/PATCH duplicate-redemptions, GET advance-ledger, GET advance-ledger/summary | — | RBAC, OpenAPI, Supabase Auth |

**Verdict:** **Partial** – Major UI and API gaps are closed. **Offline Redemption Integrity & Advance Recovery (PRD §3.2.11, §3.3.11)** implemented: schema (3 tables), migration, service, voucher status + duplicate-redemptions + advance-ledger APIs, Ketchup Duplicate Redemptions page, Advance Ledger tab, Government duplicate metrics. Backend: **Database & API Design** in `docs/DATABASE_AND_API_DESIGN.md` (PRD §29); **Drizzle schema** (Neon) + **`docs/NEON_SETUP.md`**; **full `/api/v1`** (all endpoint groups implemented); **Beneficiaries** and **Vouchers** list pages load from `/api/v1/beneficiaries` and `/api/v1/vouchers`. Remaining: Supabase Auth, RBAC on routes, OpenAPI YAML.

---

## 1. Ketchup Portal (§3)

### ✅ Implemented

| PRD Section | What exists |
|-------------|-------------|
| **§3.2.1 Dashboard** | KPI-style cards (DrillDownCard), DashboardCards, RecentActivity. **Counts from API** (beneficiaries, vouchers, agents, active vouchers) via `KetchupDashboard` client component. |
| **§3.2.2 Beneficiary list** | List with filters (region, verification, wallet, programme), columns (name, phone, region, last proof-of-life, wallet status), Export CSV, Send SMS reminder (confirm + toast). **Filters persisted in URL** (?region=, status=, verification=). |
| **§3.2.2 Beneficiary detail** | DetailLayout with tabs: Information, Vouchers (table), Transactions (table), Proof of Life (timeline). **Data from API** via `lib/data/beneficiary.ts` (getBeneficiary, getBeneficiaryVouchers, getBeneficiaryTransactions, getProofOfLifeEvents); 404 when not found. |
| **§3.2.3 Voucher list** | Filters (status, programme), columns (ID, amount, programme, beneficiary, status, expiry, issued), row click to detail. |
| **§3.2.3 Issue Voucher** | Modal: Single (beneficiary search + amount) and Batch (CSV upload, preview). Toasts on submit. |
| **§3.2.3 Voucher detail** | Lifecycle tab (issued, redeemed, method, beneficiary link). Sample data. |
| **§3.2.4 Agent list** | Filters (region, status), columns (name, location, float, last transaction, terminal ID, status), row click to detail. |
| **§3.2.4 Agent detail** | Tabs: Profile, Transactions, Parcel inventory, Terminal. Sample data. |
| **§3.2.5 Mobile Units & ATMs** | List view (tabs: Mobile units, ATMs), Map view (Leaflet + markers), Unit/ATM detail (details + maintenance history, link to create task). |
| **§3.2.6 Trust Reconciliation** | Internal/Bank/Discrepancy cards, day transactions table, Flag discrepancy, Add adjustment modal (reason + amount). |
| **§3.2.7 Compliance & Audit** | Compliance: tabs (Incident reports, Unverified beneficiaries, Audit logs link). Audit: search, filters (user, action, date), table, Export CSV. |
| **§3.2.11 Offline Redemption Integrity & Advance Recovery** | **Duplicate Redemptions** screen at `/ketchup/vouchers/duplicates`: metric cards (duplicate events detected, NAD over-disbursed, outstanding advances), filters (status, date range), DataTable with **Actions** column (Ledger / Hide, Resolve); inline **Advance ledger** panel per beneficiary from GET `/api/v1/beneficiaries/{id}/advance-ledger`. Resolve modal (status + resolution notes → PATCH). **Advance Ledger** tab on beneficiary detail (outstanding balance + advances table). Sidebar link “Duplicate Redemptions”. APIs: GET `/api/v1/vouchers/duplicates`, PATCH `/api/v1/vouchers/duplicates/{id}`, GET `/api/v1/beneficiaries/{id}/advance-ledger`, GET `/api/v1/advance-ledger/summary`. |

### ⚠️ Partial / Missing

| PRD Section | Gap |
|-------------|-----|
| **§3.2.2 Beneficiary detail** | **Done:** Suspend/Reactivate, Add voucher, Trigger proof-of-life (BeneficiaryDetailActions). **Done:** Advance Ledger tab (outstanding + advances table). |
| **§3.2.3 Vouchers** | **Done:** Expiry alerts (next 7 days) + Send reminder SMS; list/detail exist. Expire now: optional on detail. |
| **§3.2.4 Agents** | **Done:** Terminal Inventory page (list, assign to agent). Agent enrolment and Adjust float: UI placeholders. |
| **§3.2.5 Mobile Units** | Unit/ATM creation form: not implemented. |
| **§3.2.8 Integrated Network Map** | **Done:** Network Map page with layers (agents, ATMs, units), filters, coverage toggle. |
| **§3.2.9 Beneficiary Platform Admin** | **Done:** App Analytics page (DAU/MAU, redemption rate, channel chart, app user list). |
| **§3.2.10 USSD Session Viewer** | **Done:** USSD Viewer page (session list, filter by user/date, session detail with menu steps). |

---

## 2. Government Portal (§4)

### ✅ Implemented

- Routes: `/government`, `/government/dashboard`, `/government/programmes`, `/government/reports`.
- Sidebar + layout.
- Placeholder content (title + short description) on each page.

### ✅ Implemented (UI + sample data)

| PRD Section | Status |
|-------------|--------|
| **§4.2.1 Programme Dashboard** | **Done:** Summary cards, bar chart by programme, verification metrics, link to unverified. |
| **§4.2.2 Beneficiary Verification Status** | **Done:** Unverified page (filters, export CSV). |
| **§4.2.3 Voucher Monitoring** | **Done:** Vouchers page (filters, export button). **Duplicate Redemption Metrics** (read-only): section “Offline Duplicate Redemptions” with cards – Duplicates detected, Outstanding advances (NAD), Recovery rate % – from GET advance-ledger/summary (optional programme_id). |
| **§4.2.4 Audit Exports** | **Done:** Reports page (select report type, Generate PDF). |
| **§4.2.5 Programme Configuration** | **Done:** Programmes page (list, Add programme modal). Config page stub. |

---

## 3. Agent Portal (§5)

### ✅ Implemented

- Routes: `/agent`, `/agent/dashboard`, `/agent/float`, `/agent/transactions`, `/agent/parcels`, `/agent/profile`.
- Sidebar + layout.
- Placeholder content on each page.

### ✅ Implemented (UI + sample data)

| PRD Section | Status |
|-------------|--------|
| **§5.2.1 Dashboard** | **Done:** Float card, recent transactions table, parcel count, low-float alert. |
| **§5.2.2 Float Management** | **Done:** Float page (balance, history table, Request top-up modal, Settlement download). |
| **§5.2.3 Transaction History** | **Done:** Dashboard shows last 5; **Transactions** page (`/agent/transactions`) full list with pagination via GET `/api/v1/agent/transactions?agent_id=…`. |
| **§5.2.4 Parcel Management** | **Done:** Parcels page (incoming list, Scan/Mark collected modal, history tab). |
| **§5.2.5 Profile & Settings** | **Done:** Profile page (`/agent/profile`) loads from GET `/api/v1/agents/[id]` (read-only); change password / commission to be wired to auth. Settlement download on Float page as CSV. |

---

## 4. Field Ops Portal (§6)

### ✅ Implemented

- Routes: `/field-ops`, `/field-ops/map`, `/field-ops/assets`, `/field-ops/tasks`, `/field-ops/activity`, `/field-ops/routes`, `/field-ops/reports`.
- Sidebar + layout.
- Placeholder content on each page.
- `FieldMap` used on map page.

### ✅ Implemented (UI + sample data)

| PRD Section | Status |
|-------------|--------|
| **§6.2.1 Map View** | **Done:** Field Ops map page uses FieldMap with units/ATMs/agents; Log Maintenance/Replenish buttons. |
| **§6.2.2 Unit/ATM Management** | **Done:** Assets page (tabs: Mobile units, ATMs), list with row click to detail (detail route can be added). |
| **§6.2.3 Task Management** | **Done:** Tasks page (list, Mark done modal with notes, Create task modal). |
| **§6.2.4 Activity Logging** | **Done:** Activity page (`/field-ops/activity`) with date range, wired to GET `/api/v1/field/reports/activity` (tasks completed, maintenance logs, assets visited). |
| **§6.2.5 Route Planning** | **Done:** Routes page (`/field-ops/routes`) stub; wire to route API when available. |
| **§6.2.6 Activity Reports** | **Done:** Reports page (`/field-ops/reports`) with link to Activity; performance reports placeholder. |

---

## 5. Common Features (§7)

### ✅ Implemented

- **§7.2 Navigation & UI:** Responsive layout, sidebar per portal, active state (exact + nested paths: `pathname === href \|\| pathname.startsWith(href + '/')`), header with user area.
- **§7.3 Data Export:** CSV export on beneficiaries, vouchers (batch preview), audit, compliance unverified.
- **§7.7 Layout:** Single Next.js app, route-based portals (`/ketchup`, `/government`, `/agent`, `/field-ops`), `PortalLayout` with sidebar + header.
- Toasts for user feedback (no Supabase Realtime).

### ❌ Not implemented

| PRD Section | Status |
|-------------|--------|
| **§7.1 Authentication & Authorization** | Middleware added (redirect when NEXT_PUBLIC_REQUIRE_AUTH=true and no auth cookie). Login/register UI only; Supabase and 2FA not wired. |
| **§7.4 Notifications & §7.4.1 Outbound Communications** | **SMS:** Implemented – `sms_queue` table, `users.sms_opt_out`, `src/lib/services/sms.ts`; APIs: POST `/api/v1/beneficiaries/[id]/sms`, POST `/api/v1/beneficiaries/bulk-sms`, GET `/api/v1/sms/history`, POST `/api/v1/sms/process` (cron), webhooks for delivery/STOP. UI: bulk SMS and “Trigger proof-of-life” from Ketchup. **Email:** Not implemented – no SMTP send for password reset, portal user onboarding, or reports. **Push:** Not implemented – no push subscription or outbound push to beneficiaries/field ops. **In-app notification center** in header not built; Supabase Realtime not used. **Implemented this round:** In-app notifications (table, GET/PATCH API, NotificationCenter in header); SMS to agents (float approve/reject) and field ops (task assigned, `portal_users.phone`); email service (`sendEmail` + SMTP env); push (subscribe API, `sendPushToPortalUser`/`sendPushToBeneficiary`). See migration `0002_communications.sql`. |
| **§7.5 Audit Logging** | PRD: all actions logged to DB. Current: audit log **UI** only; no backend logging. |
| **§7.6 Search & Filter** | Global search not implemented. Advanced filters exist on some Ketchup lists; **URL state for beneficiaries list** (region, status, verification) implemented via `useSearchParams` and `router.replace`. |
| **§7.3 PDF** | PRD: reports as PDF (e.g. Government audit exports). Not implemented. |

---

## 6. Tech Stack & Infrastructure (§2, §9, §10)

| PRD | Status |
|-----|--------|
| **Next.js 14 App Router** | ✅ Used. |
| **Supabase Auth** | ❌ Not integrated; login is UI only. |
| **Neon (PostgreSQL)** | ✅ **Drizzle schema** in `src/db/schema.ts` (all tables + `incidents`; **Offline Redemption Integrity**: `duplicate_redemption_events`, `beneficiary_advances`, `advance_recovery_transactions`); **`src/lib/db.ts`** lazy Neon HTTP + Drizzle; **`drizzle.config.ts`** (loads `.env.local`, `drizzle-kit generate` / `push`). **Migration** `drizzle/0001_duplicate_redemptions.sql` for duplicate-redemption tables. **`docs/NEON_SETUP.md`** for connection string and Neon docs. Set `DATABASE_URL` for build/runtime. |
| **API routes** | ✅ **Full `/api/v1`**: auth (login); beneficiaries (list, [id], unverified, **[id]/advance-ledger**); vouchers (list, [id], **[id]/status**, issue, expiring-soon, **duplicates**, **duplicates/[id]**); agents (list, [id], float, float-history, transactions); terminals (list, [id]/assign, [id]/status); assets (list, [id], maintenance, maintenance-logs, location, map); reconciliation (daily, adjustment); audit-logs; incidents (list, [id]); analytics (app-users, dau, redemption-rate, channel-breakdown, heatmap); ussd/sessions, sessions/[id]; programmes (list, [id], [id]/report); **advance-ledger/summary**; agent/* (dashboard, float, float/history, float/request, transactions, parcels, parcels/[id]/collect, commission, settlement); field/* (map, assets, assets/[id], assets/[id]/location, maintenance, tasks, tasks/[id], route, reports/activity). Shared `src/lib/api-response.ts`. |
| **Middleware** | ✅ Optional redirect to `/login` when `NEXT_PUBLIC_REQUIRE_AUTH=true` and no auth cookie. |
| **File Storage (Supabase Storage)** | ❌ Not used. |
| **Real-time (Supabase Realtime)** | ❌ Not used. |
| **Maps (Leaflet)** | ✅ Used for Ketchup mobile units map and Field Ops `FieldMap` component. |
| **Calendar / date / scheduler** | ✅ **date-fns**, **react-day-picker** v9, **react-big-calendar**. `src/lib/date-utils.ts` (re-exports); `src/components/ui/date-picker.tsx` (native input); `src/components/ui/calendar-date-picker.tsx` (DayPicker popover); `src/components/ui/scheduler.tsx` (Calendar + dateFnsLocalizer). Styles in `globals.css`. |
| **SMS (reminders, bulk, opt-out)** | ✅ **Queue + service**: `sms_queue` table, `users.sms_opt_out`; `src/lib/services/sms.ts` (gateway abstraction). **API**: POST `/api/v1/beneficiaries/[id]/sms`, POST `/api/v1/beneficiaries/bulk-sms`, GET `/api/v1/sms/history`, POST `/api/v1/sms/process` (cron), POST `/api/v1/webhooks/sms/delivery`, POST `/api/v1/webhooks/sms/inbound` (STOP). **UI**: Beneficiaries list bulk SMS, beneficiary detail “Trigger proof-of-life” + SMS history tab. **Cron**: **vercel.json** invokes `/api/v1/sms/process` every 5 min (Vercel sends `CRON_SECRET`); **node-cron** + **scripts/process-sms-cron.mjs** for local/external; **npm run cron:sms** runs the script (every 2 min + once on start). **Env**: `SMS_API_URL`, `SMS_API_KEY`, `SMS_WEBHOOK_SECRET`, `CRON_SECRET`, `BASE_URL` (for local cron). See **`docs/SMS_DESIGN.md`**. |
| **Styling** | ✅ Tailwind + DaisyUI. PRD mentions shadcn/ui; project uses DaisyUI. |

---

## 7. Other PRD Sections (high level)

| Section | Status |
|---------|--------|
| **§9 Database Schema** | ✅ Full schema in **`docs/DATABASE_AND_API_DESIGN.md`** (PRD §29); **Drizzle** schema in `src/db/schema.ts` (includes `incidents`, **`duplicate_redemption_events`**, **`beneficiary_advances`**, **`advance_recovery_transactions`**). **`docs/NEON_SETUP.md`** for Neon + Drizzle. |
| **§10 API Specifications** | ✅ Spec in **`docs/DATABASE_AND_API_DESIGN.md`**; **full `/api/v1`** implemented (all endpoint groups). |
| **§11 Integration with Beneficiary Platform** | API ready; UI for beneficiaries and vouchers lists wired to `/api/v1`. |
| **§12 Compliance & Security** | **Validation:** Zod schemas in `src/lib/validate.ts`; `validateBody` / `validateId` used on auth/login, beneficiaries/[id]/sms, bulk-sms. **Logging:** Structured logger `src/lib/logger.ts`; 5xx responses log via `jsonError(..., 500, ROUTE)`. **Rate limiting:** auth (10/min), SMS (20/min) per IP via `src/lib/rate-limit.ts`; 429 + Retry-After. **Security doc:** `docs/SECURITY.md`. No auth/RBAC yet. |
| **§17 Environment Variables** | No `.env` usage for Supabase/Neon. |
| **§18 Deployment** | Not specified in codebase. |
| **§19 Error Handling & Loading States** | Some loading/empty states in tables; no global error boundary. **Structured logging** for API errors (logger + jsonError with route on 5xx). |
| **§20 Permissions Matrix** | Not enforced (no auth). |
| **§21 API Pagination, Filtering & Validation** | ✅ List endpoints use `page`, `limit`, `meta`, `links`; filters via query params; validation and error shape in `src/lib/api-response.ts`. |
| **§22 Testing Strategy** | No tests in repo. |
| **§23 Monitoring & Logging** | Not implemented. |
| **§24 Backup & Disaster Recovery** | N/A. |
| **§25 User Onboarding & 2FA** | Password reset, 2FA not implemented. |

---

## 8. What to do next (priority)

1. **Auth & RBAC** – Wire Supabase Auth to `/api/v1/auth/login` and JWT; enforce RBAC on `/api/v1` by role. Optional: OpenAPI 3.1 YAML.
2. **Government Portal** – Done: programmes, unverified, vouchers wired; `/api/v1/programmes`, `/api/v1/beneficiaries/unverified`, `/api/v1/vouchers`; **Duplicate Redemption Metrics** on vouchers page (advance-ledger/summary); audit export (PDF).
3. **Offline Redemption Integrity (§3.2.11, §3.3.11)** – **Done:** Schema (3 tables), migration `0001_duplicate_redemptions.sql`, `duplicate-redemption-service.ts`, GET voucher status, GET/PATCH duplicate-redemptions, GET advance-ledger, GET advance-ledger/summary; Ketchup Duplicate Redemptions page, Advance Ledger tab on beneficiary detail, Government vouchers duplicate metrics. Optional: POST advance-recovery, agent float clawback, notifications (SMS/email on duplicate detection).
4. **Agent Portal** – Done: dashboard, float, parcels wired (demo agent_id); transaction history, parcel list/scan.
4. **Field Ops Portal** – Done: map, assets, tasks wired; tasks, activity logging, route planning, reports.
5. **Ketchup gaps** – **Done:** Float requests page (list, approve/reject → SMS + in-app); agent detail from API + Adjust float modal; agents list from API; mobile units/ATMs from API + Add unit/ATM form. Remaining: voucher “Expire now”, agent enrolment UI.
6. **§7.4.1 Communications** – **Done:** In-app notification center (API + NotificationCenter), SMS to agents (float approve/reject) and field ops (task assigned, `portal_users.phone`), email service (SMTP), push subscribe/send (web-push). **Remaining:** Wire email into password reset and onboarding when auth exists; generate VAPID keys and enable push in PWA/beneficiary app; optional in-app poll/Realtime.

Use this file as the single checklist against `KETCHUP_PORTALS_PRD.md` until the next full audit.

---

## 9. Foundation Roadmap (Design Principles & 23 Standards)

Roadmap of **concrete additions** aligned with **KISS, DRY, Boy Scout Rule** and the **23 coding standards** from the Master System Design Guide. Implement by area; tick when done.

### 9.1 Project Infrastructure & Configuration

| Item | Principle | Status |
|------|-----------|--------|
| **Environment variable validation** | Ship Stable Code (Rule 15) | ✅ `src/lib/env.ts` – Zod schema; fail fast if required vars missing. |
| **Path aliases** | DRY (Rule 2) | ✅ `tsconfig.json` – `"@/*": ["./src/*"]` already present. |
| **Pre-commit hooks (Husky + lint-staged)** | Boy Scout Rule (Rule 15, 13) | ✅ Husky + lint-staged run lint + type-check on staged files. |

### 9.2 Shared Component Library (DRY & KISS)

| Item | Principle | Status |
|------|-----------|--------|
| **`lib/utils.ts` with `cn()`** | KISS | ✅ Present in `src/lib/utils.ts`. |
| **Core UI: Button, Card, Badge, StatusBadge, LoadingState, ErrorState, EmptyState** | DRY | ✅ Implemented in `src/components/ui/`. |
| **Form: Input, Select, Checkbox, FormField** | DRY | ✅ Present (Input, Select, Checkbox, FormField). |
| **Toast notifications** | Rule 10 | ✅ Toast UI; add sonner + `<Toaster />` if desired for consistency. |

### 9.3 Authentication & Authorization

| Item | Principle | Status |
|------|-----------|--------|
| **Supabase Auth + role-based access** | Rule 16 | ⚠️ Middleware + login UI; Supabase not wired. |
| **2FA for sensitive roles** | PRD §25 | ❌ Not implemented. |

### 9.4 Database & Schema

| Item | Principle | Status |
|------|-----------|--------|
| **Drizzle ORM + Neon** | Rule 8 | ✅ `src/db/schema.ts`, `src/lib/db.ts`, docs. |
| **Service layer (beneficiary, voucher, float, etc.)** | Rule 2 | ✅ `lib/services/beneficiary-service.ts`, `voucher-service.ts`; **`duplicate-redemption-service.ts`** (listDuplicateEvents, getDuplicateEvent, updateDuplicateEvent, getBeneficiaryAdvanceLedger, getAdvanceLedgerSummary, simulateNextVoucher); GET/POST beneficiaries & vouchers routes use them. |

### 9.5 API Endpoints

| Item | Principle | Status |
|------|-----------|--------|
| **Base API structure (`/api/v1/`)** | KISS | ✅ Implemented. |
| **Request validation with Zod** | PRD §21.3 | ✅ `lib/validate.ts`; used on login, bulk-sms, etc. |
| **Pagination & filtering** | PRD §21.1 | ✅ `page`, `limit`, `meta` on list endpoints. |
| **Rate limiting** | Rule 16 | ✅ `src/lib/rate-limit.ts`; auth (10/min), bulk-sms & [id]/sms (20/min) per IP; 429 + Retry-After. |

### 9.6 Portal Layouts & Pages

| Item | Principle | Status |
|------|-----------|--------|
| **Route groups per portal** | PRD §2.1 | ✅ `/ketchup`, `/government`, `/agent`, `/field-ops`. |
| **Sidebars & Header (dynamic)** | DRY | ✅ Per-portal sidebars; shared header. |
| **Dashboard pages** | KISS | ✅ With API-driven or placeholder data. |

### 9.7 State Management & Data Fetching

| Item | Principle | Status |
|------|-----------|--------|
| **React Query (TanStack Query)** | Performance | ❌ Not added; use when consolidating client fetches. |
| **React Context for global UI state** | Separation of concerns | ⚠️ Theme/sidebar as needed; no global provider yet. |

### 9.8 Testing & Quality

| Item | Principle | Status |
|------|-----------|--------|
| **Unit tests (Vitest) for utils, schemas, services** | Ship Stable Code | ✅ Vitest; `utils.test.ts`, `validate.test.ts`, `env.test.ts`, `voucher-service.test.ts` (22 tests). |
| **E2E tests (Playwright) for critical flows** | Boy Scout Rule | ✅ Playwright; `e2e/login.spec.ts`, `e2e/agent-float.spec.ts`, `e2e/field-ops-tasks.spec.ts` (login, float, tasks). |

### 9.9 Performance

| Item | Principle | Status |
|------|-----------|--------|
| **Next.js Image for images** | Performance | ⚠️ Use where applicable. |
| **Lazy load heavy components (Suspense)** | KISS | ⚠️ Use for charts, modals where beneficial. |

### 9.10 Documentation & Comments

| Item | Principle | Status |
|------|-----------|--------|
| **JSDoc on components/functions (Rule 3)** | Communicate intent | ✅ Button, Card, FormField, Input documented (purpose, props, location). |
| **PRD & architecture docs updated** | Transparency | ✅ This file + `docs/`. |

---

*As you complete each item, update the Status column and tick the checkbox in the Summary table if applicable.*
