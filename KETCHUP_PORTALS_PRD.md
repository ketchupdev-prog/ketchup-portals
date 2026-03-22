# Ketchup Portals – Product Requirements Document (v1.4.7)

**Ketchup Software Solutions**  
**Ecosystem:** Government-to-Person (G2P) – Operations, Compliance & Field Management  
**Date:** March 2026  
**Status:** Specification – Build for four portals under one Next.js application:  
- `/ketchup` – Ketchup Portal  
- `/government` – Government Portal  
- `/agent` – Agent Portal  
- `/field-ops` – Field Ops Portal  

This document defines the functional and technical requirements for the four web portals that support the Ketchup SmartPay G2P ecosystem. The portals provide operations, compliance, field management, and partner interfaces, built on a modern web stack (Next.js, Supabase/Neon, Tailwind CSS). They share a common backend API and data layer with the Beneficiary Platform (mobile app & USSD). All portals are delivered as a **single Next.js application** with route‑based separation, simplifying deployment and maintenance.

**Changes in v1.4:** Resolved all placeholders and ambiguous terms: (1) Marked deferred features as "Out of scope for v1" or "Planned for v2" with clear roadmap notes. (2) Integrated Profile & Settings specification (session, `/portal/me`, password change, notification preferences, `portal_user_preferences` table). (3) Completed API specifications for GET `/api/v1/portal/me`, GET/PATCH `/api/v1/portal/user/preferences`, POST `/api/v1/auth/change-password` with full request/response and error formats. (4) Added database schema for `portal_user_preferences` and indexes. (5) Defined edge cases for duplicate redemption appeal, float approval workflow, advance recovery logic, and clock-skew handling. (6) Documented environment variables (including `NEXT_PUBLIC_SENTRY_DSN`, `ENCRYPTION_KEY` generation). (7) Specified testing coverage per feature and monitoring metrics. (8) Replaced dashboard placeholder data with concrete API-driven implementation. (9) Added final completion checklist. **v1.4 is the single source of truth for development; no todos or placeholders remain for MVP scope.**

**Changes in v1.4.1:** (1) **Namibia’s 14 administrative regions** – All region filters, dropdowns, and the `region` query parameter use a single source of truth (`src/lib/regions.ts`). List APIs (beneficiaries, agents, duplicate-redemptions, vouchers/duplicates) validate `region` and return 400 for invalid values. (2) **Notification preferences applied when sending** – Float approval/rejection and task-assignment flows respect `portal_user_preferences` (notification_preferences) before sending SMS; in-app notifications are still created. See §7.4, §8.2 and `src/lib/services/notification-preferences.ts`.

**Changes in v1.4.2:** (1) **Implementation validation** – Full codebase build (Next.js production build) passes; TypeScript and all routes compile. (2) **Portal components implemented** – All portal-specific components in **docs/architecture/COMPONENT_INVENTORY.md** (§11) are implemented and wired in their respective portals; **PENDING_COMPONENTS_TASKS.md** tasks are marked Done. (3) **Real API data only** – No mocks or placeholder data: Ketchup (reconciliation, audit, network map, app analytics, USSD viewer), Government (dashboard, unverified, voucher monitor, audit report generator, programme form), Agent (dashboard, float history/request, transactions, parcels, commission statement), and Field Ops (assets, asset detail, tasks, maintenance log, route planner, activity report) consume live APIs. (4) **API additions** – GET `/api/v1/reconciliation/daily` returns `transaction_entries`; GET `/api/v1/field/reports/activity` returns `tasks_completed`, `maintenance_logs`, `assets_visited`, `activity_rows` from DB; GET `/api/v1/field/route` returns `stops`; GET `/api/v1/analytics/mau` returns monthly active users. See §15.1.

**Changes in v1.4.3:** (1) **Documentation alignment** – Clarified API URL layout: versioned business APIs under `/api/v1/...`, operational `/api/health/*` and `/api/cron/*` with optional `/api/v1/...` aliases via `next.config.ts` rewrites; distinguished **`/api/v1/auth/login`** (portal_users session) from **`/api/auth/*`** (Neon Auth) and optional Supabase cookies; component inventory canonical path **docs/architecture/COMPONENT_INVENTORY.md**; historical P0/RBAC reports moved to **docs/archive/**. No change to functional MVP scope.

**Changes in v1.4.4:** (1) **SmartPay Copilot (ecosystem)** – Documented **SmartPay Copilot** as the beneficiary-facing AI assistant in the shared SmartPay stack (backend / Buffr G2P / AI services), distinct from Ketchup Portals. (2) **Monitoring scope** – §23 extended with §23.1: Copilot is **out of scope for v1 portal UI** (no dedicated Copilot stats screen); ops monitoring uses shared backend observability until admin APIs or dashboards are specified. (3) **Integration context** – §11 notes Copilot alongside mobile/USSD. No change to functional MVP scope for portal features.

**Changes in v1.4.5:** (1) **DNS & env single source of truth** – §17 adds **`BUFFR_API_URL`**, **`BUFFR_API_KEY`**, **`NEXT_PUBLIC_PORTAL_URL`**, **`CRON_SECRET`** (and documents **`api.ketchup.cc`** vs optional **`backend.ketchup.cc`**). (2) **[docs/DNS_AND_REDIRECTS.md](docs/DNS_AND_REDIRECTS.md)** is the **canonical / most current** operational doc for DNS, redirects, Vercel matrix, and cross-repo env alignment; **[docs/DOMAIN_AND_ENV_RECOMMENDATIONS.md](docs/DOMAIN_AND_ENV_RECOMMENDATIONS.md)** is a companion summary. (3) **§18** defers operational detail to **DNS_AND_REDIRECTS.md** (per-bank `*.ketchup.cc`, redirect URI policy, Buffr **`fintech/`** alignment). (4) **§18.1** clarifies Vercel root for this app (`ketchup-portals/`) and `npm run build`. No change to functional MVP scope.

**Changes in v1.4.6:** (1) **§18.4** — Cross-link to monorepo-root **[`FULL_ECOSYSTEM_INTEGRATION_2026-03-22.md`](../../FULL_ECOSYSTEM_INTEGRATION_2026-03-22.md)** as ecosystem-wide summary (Buffr AIS Platform, OIDC, SmartPay mobile). No change to functional MVP scope.

**Changes in v1.4.7:** (1) **§18.4** — Ecosystem paragraph extended: explicit cross-link to **Smartpay Mobile** [`fintech/apps/smartpay-mobile/SMARTPAY_MOBILE_FLOWS_AND_STATE.md`](../../fintech/apps/smartpay-mobile/SMARTPAY_MOBILE_FLOWS_AND_STATE.md) §14 (OBS/OAuth), **`@buffr/connect-sdk` vs `@buffr/sdk`**, and **bank-simulator** branding/build notes per root integration guide. (2) No change to functional MVP scope.

---

## Table of Contents

1. [Executive Summary & Ecosystem Context](#1-executive-summary--ecosystem-context)
2. [Overall Architecture & Tech Stack](#2-overall-architecture--tech-stack)
   - 2.1 Single Next.js Application with Route‑based Portals
   - 2.2 Landing Page (Home)
   - 2.3 Integration with Ecosystem
   - 2.4 Shared Component Library (All Portals)
3. [Ketchup Portal](#3-ketchup-portal)
   - 3.1 User Perspectives & Personas
   - 3.2 Core Modules & Screens
   - 3.3 Detailed Module Specifications
4. [Government Portal](#4-government-portal)
   - 4.1 User Perspectives & Personas
   - 4.2 Core Modules & Screens
   - 4.3 Detailed Module Specifications
5. [Agent Portal](#5-agent-portal)
   - 5.1 User Perspectives & Personas
   - 5.2 Core Modules & Screens
   - 5.3 Detailed Module Specifications
6. [Field Ops Portal](#6-field-ops-portal)
   - 6.1 User Perspectives & Personas
   - 6.2 Core Modules & Screens
   - 6.3 Detailed Module Specifications
7. [Common Features Across Portals](#7-common-features-across-portals)
8. [Data Hierarchy (Organism → Atom)](#8-data-hierarchy-organism--atom)
9. [Database Schema](#9-database-schema)
10. [API Specifications](#10-api-specifications)
    - 10.1 Shared Endpoints
    - 10.2 New Endpoints for Portals
    - 10.3 Request/Response Examples
11. [Integration with Beneficiary Platform](#11-integration-with-beneficiary-platform)
12. [Compliance & Security](#12-compliance--security)
13. [Non‑Functional Requirements](#13-non‑functional-requirements)
14. [Localization & Accessibility](#14-localization--accessibility)
15. [Implementation Phases](#15-implementation-phases)
   - 15.1 [Implementation validation (v1.4.2)](#151-implementation-validation-v142)
16. [Glossary](#16-glossary)
17. [Environment Variables](#17-environment-variables)
18. [Deployment Instructions](#18-deployment-instructions)
19. [Error Handling & Loading States](#19-error-handling--loading-states)
20. [Permissions Matrix](#20-permissions-matrix)
21. [API Pagination, Filtering & Validation](#21-api-pagination-filtering--validation)
22. [Testing Strategy](#22-testing-strategy)
23. [Monitoring & Logging](#23-monitoring--logging)
    - 23.1 [SmartPay Copilot (ecosystem observability)](#231-smartpay-copilot-ecosystem-observability)
24. [Backup & Disaster Recovery](#24-backup--disaster-recovery)
25. [User Onboarding & 2FA Setup](#25-user-onboarding--2fa-setup)
26. [Appendix A: Implementation Code Reference & MCP Documentation](#26-appendix-a-implementation-code-reference--mcp-documentation)
27. [Appendix B: Full Implementation Code (Route‑based Structure)](#27-appendix-b-full-implementation-code-routebased-structure)
   - 27.9 [Copy-paste component code](#279-copy-paste-component-code-implementation-ready)
   - 27.10 [Production-Ready Boilerplate](#2710-production-ready-boilerplate)
   - 27.11 [Drill-Down Components (Organism → Atom)](#2711-drill-down-components-organism--atom)
28. [Appendix C: Brand Design System](#28-appendix-c-brand-design-system)
29. [Database & API Design (Full Specification)](#29-database--api-design-full-specification)

---

## 1. Executive Summary & Ecosystem Context

*(Reference: Provided ecosystem overview)*

The Ketchup SmartPay ecosystem is a digital G2P platform serving beneficiaries across Namibia. The four pillars of beneficiary access (ATMs, Mobile App, USSD, Agent Network) are supported by a set of web portals that enable different stakeholders to manage, monitor, and optimize operations.

### 1.1 Portal Overview

| Portal | Primary Users | Purpose | Route |
|--------|---------------|---------|-------|
| **Ketchup Portal** | Ketchup operations team, compliance officers, finance, support | Day‑to‑day management of beneficiaries, vouchers, agents, mobile units, ATMs, POS terminals; trust account reconciliation; compliance monitoring; integrated network map; platform analytics. | `/ketchup` |
| **Government Portal** | Government programme managers, oversight bodies, auditors | Programme performance monitoring (budget vs disbursed), regional breakdowns, ghost payment prevention metrics, unverified beneficiary reports, audit exports, voucher monitoring. | `/government` |
| **Agent Portal** | Agents (shopkeepers, merchants, NamPost staff) | Float balance and top‑up, transaction history, parcel inventory, commission statements, settlement, low‑stock/float alerts. | `/agent` |
| **Field Ops Portal** | Field operations teams (mobile unit drivers, ATM technicians, team leads) | Map view of mobile units and fixed locations (ATMs, agents, NamPost), unit/ATM status, cash level monitoring, activity logging (inspection, repair, service), route planning, ATM replenishment coordination. | `/field-ops` |

All portals are built on a **single source of truth** – the Ketchup SmartPay backend – and adhere to the organism → atom data hierarchy, allowing users to drill from national aggregates down to individual transactions and events.

---

## 2. Overall Architecture & Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) – server‑side rendering, API routes, server actions |
| **Authentication** | Supabase Auth (email/password, magic link, OAuth) – integrates with PostgreSQL user management |
| **Database** | Neon (PostgreSQL) – serverless, scalable, with branching for dev/test |
| **ORM / Query** | Prisma or Drizzle ORM – type‑safe database access |
| **Styling** | Tailwind CSS (v4) + **DaisyUI** (v5) – configured in `src/app/globals.css` using `@import "tailwindcss";` + `@plugin "daisyui";` with brand/contrast overrides |
| **State Management** | React Context + hooks (or Zustand for complex client state) |
| **Real‑time** | Supabase Realtime – for live map updates (e.g., agent transactions, ATM status) |
| **Maps** | Mapbox GL JS or Leaflet – integrated with backend location APIs |
| **File Storage** | Supabase Storage – for audit exports, reports, affidavits |
| **Deployment** | Vercel (single project) + Neon (DB) |

### 2.1 Single Next.js Application with Route‑based Portals

All four portals are implemented within one Next.js codebase. Routes are organized as follows:

```
app/
  (auth)/                # Authentication pages (login, signup, reset password)
  (ketchup)/             # Ketchup Portal (protected, role = ketchup_*)
    dashboard/
    beneficiaries/
    vouchers/
    ...
  (government)/          # Government Portal (protected, role = gov_*)
    dashboard/
    programmes/
    reports/
    ...
  (agent)/               # Agent Portal (protected, role = agent)
    dashboard/
    float/
    parcels/
    ...
  (field-ops)/           # Field Ops Portal (protected, role = field_*)
    map/
    assets/
    tasks/
    ...
  api/                   # API routes (shared across portals)
    v1/
      portal/
        ...
  layout.tsx             # Root layout with providers
  page.tsx               # Landing page: Ketchup logo + portal cards; users choose portal then go to login → dashboard
```

- Route groups (`(ketchup)`, `(government)`, etc.) are used to logically separate portal code without affecting the URL path. The actual URLs are `/ketchup/dashboard`, `/government/dashboard`, etc.
- Authentication middleware protects all routes under `/ketchup`, `/government`, `/agent`, `/field-ops` and `/api/v1/portal`.
- Shared components (layout, sidebar, header) can be placed in a `components/` directory and imported by each portal.

### 2.2 Landing Page (Home)

The **root route** (`/`) is a **production landing page** (home) that:

- **Displays the Ketchup SmartPay logo** prominently (primary brand asset: `public/ketchup-logo.png`).
- **Offers four portal entry points** (Ketchup, Government, Agent, Field Ops) as cards. Each links to **Sign in** with a redirect to that portal’s dashboard (e.g. `/login?redirect=/ketchup/dashboard`).
- **Does not require authentication.** Authenticated users may still use the landing page to switch context; after sign-in they are redirected to the chosen portal dashboard.
- **Brand consistency:** Same logo and visual identity as used in all portals (header, sidebars, login page).

**Modular implementation** (production build): The landing page is composed of reusable sections under `components/landing/`:

| Section | Purpose |
|--------|---------|
| **Hero** | Logo, headline (“Powering the G2P economy”), subheadline, primary CTA (Sign in to your portal), secondary CTA (Learn more). Full-viewport hero with gradient background. |
| **Overview** | Value proposition: “One platform. Four portals. Full control.” Four benefit cards (Operations & compliance, Government oversight, Agent network, Field operations) with short copy and icons. Explains and markets the application. |
| **Portals** | Four portal cards (Ketchup, Government, Agent, Field Ops) with title, description, badge; each links to `/login?redirect=<dashboard>`. |
| **CTA** | Bottom call-to-action strip: “Ready to get started?” with button linking to #portals. |
| **Footer** | Logo, sign-in and portal links, copyright, tagline (“Secure, compliant disbursements for the Namibian G2P economy”). |

Implementation: `app/page.tsx` composes `LandingHero`, `LandingOverview`, `LandingPortals`, `LandingCta`, `LandingFooter` from `@/components/landing`. Uses existing `Container`, `Button`, and DaisyUI/Tailwind for consistency.

### 2.3 Integration with Ecosystem

- All portals consume the **Ketchup API** (REST/GraphQL) which is shared with the Beneficiary Platform. API endpoints are defined in the Buffr G2P PRD (§9.3, §9.4) and extended for portal‑specific needs (e.g., batch voucher issuance, agent float management).
- **Supabase Auth** provides the user management layer for portal users, separate from beneficiary authentication. Portal users are stored in a `portal_users` table with roles and permissions.
- The **Biometric Verification Service** is not directly accessed by portals; all biometric events are logged via the Ketchup API.

### 2.4 Shared Component Library (All Portals)

All four portals, the landing page, and the auth (login) flow use the **same shared component library**. Implementations must use the primitives and patterns defined in **docs/architecture/COMPONENT_INVENTORY.md** so that branding, behaviour, and accessibility are consistent.

- **Landing** (`/`): Uses §10 Landing components (Hero, Overview, Portals, CTA, Footer), which in turn use IOSButton, Card, Badge, Container, LogoMark.
- **Auth** (`/login`, `/forgot-password`): Use **AuthHero** (compact hero with logo, title, subline, “Back to home”, “Choose your portal”), Card, Input, IOSButton. The auth layout wraps these pages with **LandingFooter** so every step shows portal links and a clear path to the respective portals. No custom form elements; all from the inventory.
- **Header** (every portal): Uses BrandLogo (mark, `ketchup-logo.png`), UserNav, NotificationCenter. Same header component across Ketchup, Government, Agent, Field Ops.
- **Sidebars**: Each of KetchupSidebar, GovernmentSidebar, AgentSidebar, FieldOpsSidebar uses BrandLogo (mark, `ketchup-logo.png`) in the sidebar header and DaisyUI menu for nav items.
- **Portal pages**: All list and detail screens across Ketchup, Government, Agent, and Field Ops use Button/IOSButton, Card, DataTable, MetricCard, SectionHeader, Container, Input, Select, Modal, Toast, and related components from the inventory. New or refactored UI must use these primitives; see Appendix C (§28) for brand usage and docs/architecture/COMPONENT_INVENTORY.md for the full list and “Extension to all portals” mapping.

### 2.5 UX/UI requirements (practical)

All portal UI must be implemented using the shared **DaisyUI + Tailwind** primitives in `docs/architecture/COMPONENT_INVENTORY.md` to keep styling, behavior, and accessibility consistent across Ketchup/Government/Agent/Field Ops. Tailwind/DaisyUI are configured via `src/app/globals.css` (Tailwind v4 + DaisyUI plugin), and any custom CSS must remain scoped and compatible with DaisyUI theme variables.

- **Navigation simplicity**: Keep sidebar primary sections limited (aim for **5–7** items per section). Use collapsible groups for advanced/admin items.
- **Theme & contrast**: Respect the existing global theme variables and contrast overrides in `globals.css` (e.g. Ketchup Forest `#226644`, high-contrast table headers). New UI must not reintroduce low-contrast muted text or faint table headings.
- **Click targets (web)**: Minimum interactive target size **32×32px** for icon buttons and menu items; primary actions use larger DaisyUI buttons with clear spacing.
- **Loading & errors**: Use **skeleton loaders** for dashboards/tables and standard `ErrorState`/empty states per §19. Avoid spinner-only screens.
- **Consistent layouts**: Reuse the same page patterns (list toolbar + filters, metric cards, detail header + tabs) across portals.
- **Accessibility**: WCAG 2.1 AA baseline, keyboard navigation for menus/modals, visible focus states, and meaningful `aria-*` labels where needed.

---

## 3. Ketchup Portal

### 3.1 User Perspectives & Personas

| Persona | Role | Goals & Typical Workflows |
|---------|------|---------------------------|
| **Operations Manager** | Manages day‑to‑day operations | – Monitor national KPIs, identify bottlenecks. <br> – Issue vouchers in bulk or individually. <br> – Oversee agent network: approve new agents, assign terminals, monitor float. <br> – Manage mobile units and ATMs: schedule maintenance, track cash levels. |
| **Compliance Officer** | Ensures regulatory compliance | – Review audit logs, incident reports. <br> – Export compliance data for BoN. <br> – Investigate suspicious transactions. <br> – Monitor proof‑of‑life compliance (beneficiaries overdue). |
| **Finance Officer** | Manages trust account and settlements | – Reconcile trust account daily. <br> – Approve agent commission payouts. <br> – Review settlement reports. |
| **Support Agent** | Handles beneficiary/agent inquiries | – Search for beneficiary/agent by ID/phone. <br> – View transaction history, proof‑of‑life status. <br> – Suspend/reactivate accounts. <br> – Manually trigger SMS reminders. |

### 3.2 Core Modules & Screens

#### 3.2.1 Dashboard (Organism View)
- **Purpose:** At‑a‑glance view of ecosystem health.
- **Components:** 
  - KPI cards: total beneficiaries (active/frozen), total vouchers issued this month, total disbursed (NAD), agents online, mobile units active, ATM cash level (average).
  - Charts: disbursement trend (last 30 days), regional distribution (map or bar chart).
  - Alerts panel: low float agents (>5), unverified beneficiaries (>90 days), pending maintenance tasks.
  - Recent activity feed: latest transactions, redemptions, agent float changes.

#### 3.2.2 Beneficiary Management (Tissue → Atom)
- **List View** (tissue):
  - Filters: region, verification status (verified, overdue, frozen), wallet status, programme.
  - Columns: name, phone, region, last proof‑of‑life, wallet status, actions (view, suspend).
  - Bulk actions: export CSV, send SMS reminder.
- **Detail View** (molecule):
  - Personal info, photo, verification history, vouchers (list), wallets (list), transaction history.
  - Actions: suspend/reactivate, manually add voucher, trigger proof‑of‑life.
- **Proof‑of‑Life Events** (atom): list of events with method, timestamp, performed by.

#### 3.2.3 Voucher Management (Tissue → Atom)
- **List View**:
  - Filters: status (available, redeemed, expired), programme, region, issue date.
  - Columns: voucher ID, amount, programme, beneficiary, status, expiry, actions (view, expire now).
- **Issue Voucher**:
  - Single: search beneficiary → select amount → issue.
  - Batch: upload CSV (beneficiary ID, amount) → preview → confirm.
- **Voucher Detail**:
  - Show full lifecycle: issued at, redeemed at (if redeemed), method, loan repayment (if any).
- **Expiry Alerts**: list of vouchers expiring in next 7 days; option to send reminder SMS.

#### 3.2.4 Agent & POS Terminal Management (Tissue → Atom)
- **Agent List**:
  - Filters: region, status (active/suspended), float range.
  - Columns: name, location, float balance, last transaction, terminal ID, actions (view, adjust float).
- **Agent Detail**:
  - Profile: contact info, location (map), commission rate, float history.
  - Transactions: list of cash‑outs, bill pays, airtime sales.
  - Parcel inventory: parcels awaiting collection.
  - Terminal info: model, status, last maintenance.
- **Terminal Inventory**:
  - List of all POS terminals (FP09) with status, assigned agent, last ping.
  - Assign terminal to agent.
  - Log maintenance (from Field Ops Portal).

#### 3.2.5 Mobile Units & ATMs (Tissue → Atom)
- **Map View**: (shared with Field Ops) showing all units/ATMs with status indicators.
- **List View**:
  - Mobile units: driver, current location (lat/lng), last activity, next maintenance.
  - ATMs: location, cash level, status (online/offline), last replenishment.
- **Unit/ATM Detail**:
  - Maintenance history, replenishment logs.
  - Schedule maintenance (create task for Field Ops).

#### 3.2.6 Trust Account Reconciliation
- **Daily Reconciliation Screen**:
  - Show internal ledger balance vs bank statement balance.
  - List of transactions for the day (with settlement status).
  - Flag discrepancies; allow manual adjustment with comment (audit logged).

#### 3.2.7 Compliance & Audit
- **Audit Logs**:
  - Searchable by user, action, date range.
  - Export to CSV.
- **Incident Reports**:
  - List of incidents (from PSD‑12 reports).
  - Add resolution notes.
- **Unverified Beneficiaries**:
  - List of beneficiaries with proof‑of‑life overdue >90 days.
  - Export for field follow‑up.

#### 3.2.8 Integrated Network Map (Organism → Atom)
- **Interactive Map**:
  - Layers: agents, NamPost, ATMs, mobile units, warehouses.
  - Click on marker → popup with summary + link to detail.
  - Filter by type, region, status.
  - Show coverage circles (e.g., agent service radius 5km).

#### 3.2.9 Beneficiary Platform Admin
- **App User List**:
  - View registered app users, last login, device info.
- **App Analytics**:
  - DAU/MAU, redemption rate, channel breakdown (app vs USSD), heatmap of usage.
- **AI/ML Model Status:** Out of scope for v1. Planned for v2 – fraud detection model health dashboard; no UI or API in MVP. Omit from Ketchup Portal until roadmap phase.

#### 3.2.10 USSD Session Viewer
- **Session List**:
  - Filter by user, date.
  - View menu selections and timestamps for troubleshooting.

#### 3.2.11 Offline Redemption Integrity & Advance Recovery
- **Duplicate Redemptions Screen** (`/ketchup/vouchers/duplicates`):
  - Summary: total duplicates detected (cycle), total NAD over-disbursed, recovered to date.
  - Table: voucher ID, beneficiary, amount, both redemption events, status, actions.
  - Drill-down to beneficiary advance ledger (outstanding balance, recovery schedule).
  - Agent impact panel: float clawbacks, appeal management.
- **Advance Ledger View** (within beneficiary detail):
  - Timeline of original issue → redemption → duplicate → advance recovery.
  - Automatic deduction applied at next cycle disbursement (never negative).
- **Alerts**: Real-time notification on new duplicate detection; SMS to beneficiary; agent float debit notice.

### 3.3 Detailed Module Specifications

#### 3.3.1 Dashboard
- **Data sources**: Aggregated from `users`, `vouchers`, `transactions`, `agents`, `units`, `atms`.
- **Refresh**: Every 5 minutes (configurable) + manual refresh.
- **Alerts**: Polling every minute for critical alerts (low float, unverified >90d).

#### 3.3.2 Beneficiary Management
- **Filters**: Region, verification status (verified, overdue, frozen), wallet status, programme, date of last transaction.
- **Actions**:
  - Suspend/reactivate: toggles `wallet_status` in `users` and logs action.
  - Trigger proof‑of‑life: sends a push notification to the app and/or SMS to visit agent.
- **Export**: CSV with selected columns.

#### 3.3.3 Voucher Management
- **Batch upload**: CSV format: `beneficiary_id, amount`. Validates beneficiary exists, not suspended.
- **Voucher detail**: Includes loan deduction info (if any) from `loans` table.

#### 3.3.4 Agent & POS Terminal Management
- **Agent enrolment** (new):
  - Form: name, location (lat/lng), contact, commission rate.
  - After creation, a `portal_user` is created for the agent (with email/password sent via email).
- **Terminal inventory**: Each terminal (FP09) has fields: `id`, `model`, `status` (active, offline, maintenance), `assigned_agent_id`, `last_ping`, `software_version`.
- **Terminal assignment**: Select terminal from list and assign to agent.

#### 3.3.5 Mobile Units & ATMs
- **Unit/ATM creation**: Form with type (mobile/ATM), location, initial cash level (for ATM).
- **Maintenance scheduling**: Create a task in `tasks` table, assigned to a field technician.

#### 3.3.6 Trust Account Reconciliation
- **Process**:
  1. Daily at 00:05, system generates a snapshot of internal ledger balance (`trust_balance`).
  2. Reconciliation screen shows:
     - Internal balance
     - Bank statement balance (imported manually or via API)
     - Discrepancy (difference)
     - List of transactions for that day (from `wallet_transactions` where `type` relates to trust account movements)
  3. User can flag discrepancies and add adjustment entry (requires manager approval).
- **Adjustment**: Must have reason and approval from another user (dual control).

#### 3.3.7 Compliance & Audit
- **Audit logs table**: See §9.
- **Incident reports**: Can be created manually from suspicious activity, with fields: date, description, impact, actions taken. Notifies BoN compliance officer.

#### 3.3.8 Integrated Network Map
- **Marker clustering** for performance when many markers.
- **Coverage circles**: Configurable radius per agent (default 5km).
- **Real‑time updates**: Mobile units broadcast location every 30 seconds (if GPS enabled).

#### 3.3.9 Beneficiary Platform Admin
- **App user list**: Shows `last_login`, `device_os`, `app_version`.
- **Analytics**:
  - DAU/MAU charts (from `user_sessions` table).
  - Redemption rate = redeemed vouchers / issued vouchers (per period).
  - Channel breakdown: % transactions via app vs USSD.
  - Heatmap: map with transaction counts per region (from `transactions` with location data).

#### 3.3.10 USSD Session Viewer
- **Session detail**: Shows each menu option selected, time taken per step (if logged).

#### 3.3.11 Offline Redemption Integrity & Advance Recovery

> **Problem context:** In low-connectivity areas (rural agents, mobile units in the field), a beneficiary may redeem a voucher at Point A while the device is offline or has intermittent internet. Before that redemption record propagates to the server, the same beneficiary may attempt to redeem the same voucher at Point B (a second agent, ATM, or USSD session). Both redemptions succeed locally because neither endpoint has confirmed the prior event. When the systems sync, two valid-looking redemption events arrive for one voucher — the beneficiary has received double their entitlement for that cycle, and the platform has over-disbursed.

##### 3.3.11.1 Prevention (Device & Protocol Layer)

| Control | Mechanism |
|---------|-----------|
| **Device-level idempotency key** | Each offline redemption attempt generates a cryptographically unique `redemption_attempt_id` (UUID v4) stored in the POS device / app local storage. This key is submitted alongside the redemption request. If the same key arrives at the server more than once (on sync), all duplicates after the first are rejected with `409 Conflict`. |
| **Pending lock flag** | The moment a redemption is initiated on a device, the voucher is locally flagged `pending_redemption: true` with a `locked_by_device_id` and `lock_expires_at` (default 30 minutes). A second redemption attempt on the **same device** is blocked immediately without a network call. |
| **Short voucher lock TTL broadcast** | When connectivity is partially available, a lightweight UDP-style lock broadcast notifies nearby devices registered on the same agent hub that a voucher is being processed. Devices that receive the broadcast refuse the voucher for the lock TTL. |
| **Voucher status pre-check** | Any device with a network connection must call `GET /api/v1/vouchers/{id}/status` before processing. The server returns `redeemed`, `pending`, or `available`. Devices with no connectivity proceed offline but log the attempt for audit. |

##### 3.3.11.2 Detection (Post-Sync Reconciliation)

When offline redemption records sync to the backend, the reconciliation engine runs the following logic immediately on ingestion:

```
FOR each incoming redemption event E:
  1. Look up voucher V by voucher_id.
  2. If V.status = 'redeemed' AND V.redeemed_at is NOT NULL:
       → This is a DUPLICATE.
       → Mark E as status = 'duplicate_redemption'.
       → Do NOT credit the agent float for this event.
       → Raise a DuplicateRedemptionAlert.
  3. Else if V.status = 'pending_redemption' AND V.lock_device_id ≠ E.device_id:
       → Potential race condition — hold E in 'under_review' queue.
       → Trigger supervisor notification.
  4. Else:
       → Accept as legitimate first redemption; set V.status = 'redeemed'.
```

The **canonical redemption** is determined by:
1. `redemption_confirmed_at` server timestamp (earliest wins).
2. If server timestamps are equal (same sync batch), fall back to `redemption_requested_at` device clock.
3. If both are identical, the agent with higher `trust_score` takes precedence and the other is flagged.

##### 3.3.11.3 Accounting Treatment (Advance Ledger)

This follows standard G2P advance-recovery accounting: cash already in the field cannot be recalled, but the over-disbursement creates a recoverable debt against the beneficiary's future entitlements.

| Scenario | Treatment |
|----------|-----------|
| **Duplicate detected (both cash-outs occurred)** | The duplicate amount is posted as a **debit entry** to the beneficiary's `advance_ledger`. On the next payment cycle, the system automatically reduces the issued voucher/disbursement by the outstanding advance balance before delivery. |
| **Duplicate detected (second agent returned cash / no dispensing occurred)** | If the second agent did not dispense (e.g., device went offline before cash was handed to beneficiary), no advance is posted. The event is flagged and closed with `no_financial_impact`. |
| **Beneficiary did NOT redeem at all (legitimate non-redemption)** | Zero deductions. Full entitlement remains due for the current cycle and carries forward per programme rules (typically up to 90 days before expiry). |
| **Agent accountability** | The agent whose terminal processed the confirmed duplicate has the duplicate amount debited from their float balance with an `advance_clawback` float transaction. The agent may appeal within 7 days via the Agent Portal with supporting evidence. |

**Advance ledger arithmetic (next cycle disbursement):**
```
next_voucher_value = programme_entitlement - MIN(outstanding_advance, programme_entitlement)
remaining_advance  = outstanding_advance - MIN(outstanding_advance, programme_entitlement)
```
This ensures a beneficiary never receives less than zero (no negative vouchers), and advances exceeding one cycle's entitlement roll over to subsequent cycles until fully recovered.

##### 3.3.11.4 Ketchup Portal UI — Duplicate Redemptions Screen

**Location:** `/ketchup/vouchers/duplicates`

- **Summary Cards:**
  - Total duplicate redemption events (current cycle), total NAD over-disbursed, total recovered to date.
- **Duplicate Events Table:**
  - Columns: voucher ID, beneficiary name, amount, first redemption (agent, timestamp), duplicate event (agent, timestamp, device ID), status (`advance_posted`, `under_review`, `no_financial_impact`, `agent_appealing`), actions.
  - Filters: status, date range, region, programme.
- **Beneficiary Advance Detail (drill-down):**
  - Full timeline: original issue → first redemption → duplicate event → advance posted → recovery schedule.
  - Current outstanding advance balance.
  - Projected recovery date (based on cycle frequency and entitlement amount).
- **Agent Impact Panel:**
  - List of agents with float debits from advance clawbacks.
  - Appeal status per agent.
  - Approve/reject appeal (requires `ketchup_compliance` or `ketchup_finance` role).

**Notification Triggers:**
- Email + in-app alert to Ketchup ops team on each new duplicate detection.
- SMS to beneficiary: *"A payment discrepancy was detected on your account. Your next disbursement will be adjusted accordingly. Contact support: [number]."*
- In-app notification to the agent whose float was debited.

##### 3.3.11.5 Configuration & Thresholds

| Parameter | Default | Description |
|-----------|---------|-------------|
| `offline_lock_ttl_minutes` | 30 | How long a device holds a pending voucher lock before it expires |
| `duplicate_advance_rollover_cycles` | 3 | Maximum cycles over which an advance can roll; if unrecovered after this, escalate to manual review |
| `agent_appeal_window_days` | 7 | Days an agent has to appeal a float clawback |
| `duplicate_alert_threshold_nad` | 500 | Minimum duplicate amount (NAD) that triggers a supervisor email (smaller amounts auto-resolve) |

---

## 4. Government Portal

### 4.1 User Perspectives & Personas

| Persona | Role | Goals & Typical Workflows |
|---------|------|---------------------------|
| **Programme Manager** | Oversees grant programmes | – Monitor disbursement against budget. <br> – Identify regions with low uptake. <br> – Generate reports for ministry. |
| **Auditor** | Audits programme spending | – Review ghost payment prevention metrics. <br> – Export voucher‑level data. <br> – Drill into suspicious patterns. |

### 4.2 Core Modules & Screens

#### 4.2.1 Programme Dashboard (Organism)
- **Summary Cards**:
  - Total budget allocated, total disbursed this quarter, remaining budget.
  - Beneficiaries reached (unique), average grant.
- **Regional Breakdown**:
  - Map with colour‑coded regions showing disbursement % vs budget.
  - Bar chart of disbursement by programme.
- **Verification Metrics**:
  - % beneficiaries verified in last 90 days, count unverified.
  - Link to detailed list.

#### 4.2.2 Beneficiary Verification Status (Organ → Tissue)
- **List of Unverified Beneficiaries**:
  - Filter by region, programme, days overdue.
  - Export CSV for field follow‑up.
- **Drill‑down to individual** (atom): view verification history, last proof‑of‑life.

#### 4.2.3 Voucher Monitoring (Tissue → Atom)
- **Voucher List** (with filters: programme, date range, status).
- **Export** raw data (CSV/Excel).
- **Voucher Detail**: see full redemption info (including method, agent, etc.).
- **Duplicate Redemption Metrics** (read-only, government view):
  - Count and total value of offline duplicate redemptions detected per cycle/region.
  - Recovery rate: % of advance ledger balances successfully recovered within 3 cycles.
  - Outstanding advances by programme (NAD total, count of beneficiaries affected).
  - Included in the Ghost Payment Prevention Report (§4.2.4) as a dedicated sub-section: *"Offline Double-Spend Controls & Recovery."*

#### 4.2.4 Audit Exports
- Generate PDF reports:
  - Programme performance summary (budget vs actual).
  - Ghost payment prevention report (verification metrics).
  - Incident report (if any).
- Scheduled reports: Available for Government portal users who enable report delivery in Settings (`report_delivery_frequency`: off | daily | weekly; `report_delivery_format`: pdf). See Profile & Settings spec §8.

#### 4.2.5 Programme Configuration (Admin only)
- Define new programmes (name, budget, start/end dates).
- Set verification frequency (default 90 days).

### 4.3 Detailed Module Specifications

#### 4.3.1 Programme Dashboard
- **Budget data**: Stored in `programmes` table with `allocated_budget`, `spent_to_date`.
- **Disbursement trend**: Pulled from `vouchers` grouped by issue date.

#### 4.3.2 Beneficiary Verification Status
- **Unverified list**: SQL query: `users` where `proof_of_life_due_date < now() - interval '90 days'`.
- **Drill‑down**: Shows `proof_of_life_events` for that user.

#### 4.3.3 Voucher Monitoring
- **Export**: Supports Excel format (XLSX) via server‑side generation.

#### 4.3.4 Audit Exports
- **PDF generation**: Using `react-pdf` on client or server‑side with a headless browser.
- **Scheduled reports**: Can be set up via cron to email PDF to configured recipients.

#### 4.3.5 Programme Configuration
- **Fields**: `name`, `description`, `allocated_budget`, `start_date`, `end_date`, `verification_frequency_days`.
- **Permissions**: Only users with `role = 'gov_admin'` can access this module.

---

## 5. Agent Portal

### 5.1 User Perspectives & Personas

| Persona | Role | Goals & Typical Workflows |
|---------|------|---------------------------|
| **Shopkeeper (Agent)** | Owner/operator of a retail shop | – Check float balance before starting day. <br> – View recent transactions. <br> – Know how many parcels to collect. <br> – Request float top‑up. <br> – See commission earned. |
| **Agent Staff** | Employee processing transactions | – Process cash‑outs, bill payments, airtime. <br> – Scan parcel codes and release parcels. <br> – Mark parcels collected. |
| **NamPost Staff** | Clerk at NamPost branch | – Same as agent, but may handle higher volumes. |

### 5.2 Core Modules & Screens

#### 5.2.1 Dashboard (Molecule)
- **Float Card**: current float balance with top‑up button.
- **Recent Transactions** (last 5): type, amount, beneficiary, time.
- **Parcel Count**: number of parcels ready for collection.
- **Alerts**: low float, low parcel stock.

#### 5.2.2 Float Management (Molecule → Atom)
- **Float History**: list of top‑ups (manual and from settlements).
- **Request Top‑Up**: form to request amount; sends notification to Ketchup ops.
- **Settlement Statement**: daily summary of commissions earned, downloadable.

#### 5.2.3 Transaction History (Tissue → Atom)
- **List View**:
  - Filter by date, type, amount.
  - Columns: date/time, type, amount, fee, beneficiary, status.
- **Detail View** (click transaction):
  - Full details: transaction ID, beneficiary, method (cash, QR, code), fee breakdown.

#### 5.2.4 Parcel Management (Tissue → Atom)
- **Parcel List** (incoming):
  - Show tracking code, recipient name, ready for collection.
  - Scan parcel code to mark as collected (requires beneficiary ID verification – handled by POS, but portal may allow manual entry for troubleshooting).
- **Parcel History**:
  - List of parcels processed (collected, returned, etc.).

#### 5.2.5 Profile & Settings
- Agent details (name, location, contact).
- Change password.
- View commission rate.

### 5.3 Detailed Module Specifications

#### 5.3.1 Dashboard
- **Float card**: Real‑time via Supabase subscription on `agents` table.
- **Alerts**: Low float threshold (e.g., < N$500) triggers in‑app notification; email and SMS are sent only if the user has enabled those channels in Settings (see §7.4 and Profile & Settings spec: `portal_user_preferences`).

#### 5.3.2 Float Management
- **Float history**: Table `agent_float_transactions` with fields: `id`, `agent_id`, `amount`, `type` (top‑up, settlement, adjustment), `reference`, `created_at`.
- **Request top‑up**: Creates an entry in `float_requests` with status `pending`. Notifies Ketchup ops via in‑app and email.

#### 5.3.3 Transaction History
- **Search**: By beneficiary name/phone, date range.
- **Detail**: Shows `transaction_id`, `method` (cash, QR, code), `fee` (from `agent_commissions` table).

#### 5.3.4 Parcel Management
- **Parcel lifecycle**:
  - Parcel arrives at agent: stored in `parcels` with `status = 'ready'`.
  - Beneficiary presents code + ID → agent enters code in portal (or scans QR) → `POST /api/v1/parcels/{id}/collect` → status changes to `collected`.
  - Returns: agent creates return parcel with `type = 'return'`, gets new tracking code.
- **Parcel data**: `tracking_code`, `recipient_name`, `recipient_phone`, `agent_id`, `status`, `created_at`, `collected_at`.

#### 5.3.5 Profile & Settings
- **Change password**: Supabase Auth handles.
- **Commission rate**: Read‑only (set by Ketchup ops).

---

## 6. Field Ops Portal

### 6.1 User Perspectives & Personas

| Persona | Role | Goals & Typical Workflows |
|---------|------|---------------------------|
| **Mobile Unit Driver** | Drives mobile van to remote areas | – See today's route (ATMs to replenish, units to service). <br> – Log start/end of trip. <br> – Record maintenance performed. |
| **ATM Technician** | Maintains ATMs | – View list of ATMs assigned. <br> – Log cash replenishment (before/after cash level). <br> – Report issues. |
| **Team Lead** | Oversees fleet | – Assign tasks to drivers/technicians. <br> – Monitor real‑time locations. <br> – View activity reports. |

### 6.2 Core Modules & Screens

#### 6.2.1 Map View (Organism → Atom)
- **Interactive Map** with:
  - Mobile units: live tracking (if GPS enabled), driver name, status.
  - ATMs: marker with cash level (coloured), last replenishment.
  - Agents/NamPost (for reference only in v1; full assignment UI planned for v2 if required).
- **Click on marker**:
  - Popup with summary + link to detail page.
  - For ATMs: show cash level, last replenishment, buttons to "Log Maintenance", "Replenish".
  - For mobile units: show driver, current task, last ping.

#### 6.2.2 Unit/ATM Management (Tissue → Atom)
- **List View** (filter by type, status):
  - Mobile units: unit ID, driver, location, last activity, next maintenance.
  - ATMs: ID, location, cash level, status, last maintenance.
- **Detail View**:
  - Full history: maintenance logs, replenishment logs, task assignments.
  - Schedule maintenance (create task).

#### 6.2.3 Task Management
- **Task List** (assigned to logged‑in user):
  - Today's tasks: e.g., "Replenish ATM Oshakati", "Inspect Unit 5".
  - Mark task as done with notes.
- **Assign Task** (team lead):
  - Create task: select asset, assignee, due date, instructions.

#### 6.2.4 Activity Logging
- **Log Maintenance**:
  - Form: asset ID, type (inspection, repair, service), notes, before/after (for cash level).
- **Log Cash Replenishment**:
  - ATM ID, amount added, before level, after level (calculated).
- All logs visible in asset history.

#### 6.2.5 Route Planning (Simple)
- **Plan Route**: select multiple ATMs/units to visit, generate an ordered list (no complex optimization; manual ordering).
- **Export Route**: as PDF or share with driver (via SMS?).

#### 6.2.6 Activity Reports
- Generate reports on:
  - Maintenance events (by unit, by date).
  - ATM cash levels over time.
  - Distance traveled (if GPS available).

### 6.3 Detailed Module Specifications

#### 6.3.1 Map View
- **Location data**: Mobile units send GPS via mobile app (if installed) to backend endpoint `POST /api/v1/units/{id}/location`. ATM locations are static.
- **Real‑time**: Use Supabase Realtime subscription on `unit_locations` view.
- **Marker colours**: Cash level colour coding: green (>70%), orange (30‑70%), red (<30%), grey (offline).

#### 6.3.2 Unit/ATM Management
- **Maintenance log**: Table `maintenance_logs` with `asset_id`, `asset_type` (unit/atm), `technician_id`, `type`, `notes`, `created_at`.
- **Replenishment log**: For ATMs, also stores `cash_before`, `cash_added`, `cash_after`.

#### 6.3.3 Task Management
- **Task table**: `id`, `title`, `description`, `asset_id`, `asset_type`, `assigned_to`, `due_date`, `status` (pending, in‑progress, done), `created_by`, `created_at`.
- **Notifications**: When task assigned, push notification (via email/SMS) to assignee.

#### 6.3.4 Activity Logging
- **Forms**: Pre‑filled with asset info from selected marker.
- **Validation**: Cash after must equal cash before + added (with tolerance for rounding).

#### 6.3.5 Route Planning
- **Simple list**: User selects assets from list, drags to order, then clicks "Plan Route". System generates a list with estimated travel time (if distances available).
- **Export**: As PDF with map snippet.

#### 6.3.6 Activity Reports
- **Report parameters**: date range, asset type.
- **Output**: Table and chart of events.

---

## 7. Common Features Across Portals

### 7.1 Authentication & Authorization
- Supabase Auth with email/password. 2FA (TOTP) is available for any portal user who enables it in Settings; required only for roles designated by policy (e.g. ketchup_finance for large approvals). See §25 for 2FA setup.
- Role‑based access control (RBAC) enforced via Next.js middleware and database policies.
- After login, users are redirected to the appropriate portal dashboard based on their role (e.g. `agent` → `/agent/dashboard`).

### 7.2 Navigation & UI
- Responsive design (mobile‑friendly for field ops on tablets).
- Sidebar navigation with collapsible menu, active page highlighted.
- Consistent header: user profile, logout.

### 7.3 Data Export
- All list views support CSV export.
- Reports can be generated as PDF (using react‑pdf or server‑side generation).

### 7.4 Notifications & Outbound Communications

- **In-app notifications:** Alerts for low float, new incident, task assigned. Supabase Realtime (or polling) for live updates. Shown in header notification center.
- **Email/SMS for critical alerts:** Configurable per user via Settings → Notifications (`portal_user_preferences`). Each notification type (e.g. agent_low_float, float_request_approved) has toggles for in_app, email, sms. Defaults: in_app on, email/sms off. See Profile & Settings spec §8.

### 7.5 Profile & Settings (Session, Password, Notification Preferences)

Full specification is in **`docs/PROFILE_AND_SETTINGS.md`**. Summary:

- **Session:** On login, set HTTP-only cookie `portal-auth` with access token. `GET /api/v1/portal/me` returns current user (`id`, `email`, `full_name`, `role`, `agent_id`, `phone`); 401 if unauthenticated. Profile and Settings pages call `/portal/me` with `credentials: 'include'`.
- **Profile pages:** Per-portal routes (`/agent/profile`, `/ketchup/profile`, `/government/profile`, `/field-ops/profile`). If 401, show "Sign in to see your profile" and link to `/login`. Otherwise show account data from `me`; Agent profile also fetches agent details via `GET /api/v1/agents/[me.agent_id]`.
- **Settings pages:** Per-portal (`/agent/settings`, etc.). Content: Change password form (POST `/api/v1/auth/change-password`), Notification preferences form (GET/PATCH `/api/v1/portal/user/preferences`). Commission rate (Agent) is read-only with link to Profile. Government Settings includes link to Configuration.
- **Fallback route:** `/settings` calls `/portal/me` and redirects by role to the correct portal settings (or `/login?redirect=/settings` if 401). Header Settings link is portal-aware via `settingsHrefByPortal(pathname)`.
- **Database:** Table `portal_user_preferences` (see §9) with key `notification_preferences` and JSON value per §8 of Profile & Settings spec. Password change updates `portal_users.password_hash` (bcrypt); rate-limited.

#### 7.4.1 Outbound Communications (SMS, Email, Push)

Ketchup Portal (and other portals where specified) sends outbound communications to beneficiaries, agents, and field ops. Channels and use cases:

| Channel | Recipients | Use cases (initiated from Ketchup / system) |
|--------|------------|---------------------------------------------|
| **SMS** | Beneficiaries | Voucher expiry reminder (next 7 days); bulk reminder from Beneficiaries list; proof-of-life reminder; duplicate redemption notice (*"Payment discrepancy detected… next disbursement adjusted. Contact support: [number]."*). OTP/verification: out of scope for v1; planned for v2. |
| **SMS** | Agents | Float request approved/rejected; low float alert (e.g. &lt; N$500); parcel ready for collection; duplicate redemption float clawback notice. |
| **SMS** | Field ops | Task assigned; route/share to driver; critical maintenance alert. |
| **Email** | Portal users (Ketchup, Gov, Agent, Field ops) | Password reset; welcome / set password after account creation; scheduled report delivery (e.g. PDF to Gov); duplicate redemption supervisor alert (when amount ≥ threshold). |
| **Email** | Agents | Float request outcome; settlement summary. |
| **Push** | Beneficiaries (mobile app) | Proof-of-life trigger; voucher issued; voucher expiring soon (if app registered). |
| **Push** | Field ops (app or PWA) | Task assigned; task due soon; maintenance required. |
| **In-app** | Agents / Field ops | Low float; new parcel; task assigned; float clawback (duplicate redemption). |

**Implementation notes:**

- **SMS:** Use existing `sms_queue` table and SMS gateway (e.g. `POST /api/v1/beneficiaries/[id]/sms`, `POST /api/v1/beneficiaries/bulk-sms`, cron `POST /api/v1/sms/process`). Extend for agent/field contact phone where applicable.
- **Email:** SMTP (e.g. `SMTP_HOST`, `SMTP_FROM`) for transactional email. Used for password reset, portal user onboarding, and report delivery when user has enabled it in Settings. Template service: use env-configured templates. External template service (e.g. SendGrid templates) is out of scope for v1; can be added in a later phase.
- **Push:** Requires beneficiary/field app or PWA with push subscription; backend stores subscription and calls push provider (e.g. Web Push, FCM) when Ketchup triggers proof-of-life or when a task is assigned.
- **Preferences:** Respect beneficiary `sms_opt_out` / `email_opt_out`. Portal users: notification preferences stored in `portal_user_preferences` (key `notification_preferences`); per-type toggles for in_app, email, sms (and email_digest, report_delivery_frequency/format where applicable). See Profile & Settings spec §8 and §9.

### 7.5 Audit Logging
- All user actions (create, update, delete) logged to `audit_logs` table with user ID, timestamp, IP, action.
- Retained for 5 years (ETA s.24).

### 7.6 Search & Filter
- Global search (where applicable) across beneficiaries, agents, vouchers.
- Advanced filters (date ranges, statuses, regions) with persistent URL state for sharing.

### 7.7 Shared Layout Components
- A `RootLayout` that includes `SupabaseListener` and `SupabaseProvider` (or similar).
- A `PortalLayout` component that wraps each portal page, rendering the appropriate sidebar and header based on the route group.

---

## 8. Data Hierarchy (Organism → Atom)

The portals follow the same data‑driven design as the ecosystem, enabling drill‑down from high‑level aggregates to individual records.

| Level | Example in Portals | UI Representation |
|-------|---------------------|--------------------|
| **Organism** | National dashboard (Ketchup Portal), Programme overview (Gov Portal) | KPI cards, large charts |
| **Organ** | Regional breakdown, programme‑level data | Bar charts, map layers, drill‑down to region |
| **Tissue** | Agent hub, mobile unit route, ATM replenishment circuit | List view of agents, units, ATMs |
| **Molecule** | Single voucher, single transaction, single proof‑of‑life event | Detail page with tabs |
| **Atom** | Individual beneficiary record, single audit log entry, location coordinate | Modal or bottom sheet with raw data |

All tables and UI components are designed to support this hierarchy (e.g., clickable lists, drill‑down modals, breadcrumbs).

---

## 9. Database Schema

For the **full database schema** (all core and portal-specific tables, column types, and relationships) and **API endpoint specifications**, see **[docs/DATABASE_AND_API_DESIGN.md](docs/DATABASE_AND_API_DESIGN.md)**.

### 9.1 Portal‑Specific Tables

```sql
-- Portal users (separate from beneficiaries)
CREATE TABLE portal_users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT UNIQUE NOT NULL,
  password_hash     TEXT NOT NULL,  -- managed by Supabase Auth
  full_name         TEXT NOT NULL,
  role              TEXT NOT NULL,  -- 'ketchup_ops', 'ketchup_compliance', 'ketchup_finance', 'ketchup_support', 'gov_manager', 'gov_auditor', 'agent', 'field_tech', 'field_lead'
  agent_id          UUID REFERENCES agents(id),  -- if role = 'agent'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login        TIMESTAMPTZ
);

-- Audit logs
CREATE TABLE audit_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES portal_users(id),
  action            TEXT NOT NULL,   -- e.g., 'beneficiary_suspend', 'voucher_issue', 'agent_float_adjust'
  entity_type       TEXT,            -- 'beneficiary', 'voucher', 'agent', etc.
  entity_id         UUID,
  old_data          JSONB,
  new_data          JSONB,
  ip_address        INET,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agents (extends ecosystem)
CREATE TABLE agents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  location_lat       NUMERIC(10,8),
  location_lng       NUMERIC(11,8),
  address           TEXT,
  contact_phone      TEXT,
  contact_email     TEXT,
  commission_rate   NUMERIC(5,2) DEFAULT 0.5,  -- percentage?
  float_balance     NUMERIC(14,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'active',  -- 'active', 'suspended'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agent float transactions
CREATE TABLE agent_float_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id          UUID NOT NULL REFERENCES agents(id),
  amount            NUMERIC(14,2) NOT NULL,
  type              TEXT NOT NULL,   -- 'top_up', 'settlement', 'adjustment'
  reference         TEXT,            -- e.g., 'settlement_2026-03-23'
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Float requests
CREATE TABLE float_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id          UUID NOT NULL REFERENCES agents(id),
  amount            NUMERIC(14,2) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by       UUID REFERENCES portal_users(id),
  reviewed_at       TIMESTAMPTZ
);

-- POS Terminals
CREATE TABLE pos_terminals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id         TEXT UNIQUE NOT NULL,   -- hardware ID
  model             TEXT,
  status            TEXT NOT NULL DEFAULT 'active',  -- 'active', 'maintenance', 'offline'
  assigned_agent_id UUID REFERENCES agents(id),
  last_ping         TIMESTAMPTZ,
  software_version  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mobile units / ATMs (shared assets)
CREATE TABLE assets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type              TEXT NOT NULL,   -- 'mobile_unit', 'atm', 'warehouse'
  name              TEXT,
  location_lat       NUMERIC(10,8),
  location_lng       NUMERIC(11,8),
  status            TEXT NOT NULL DEFAULT 'active',  -- 'active', 'maintenance', 'offline'
  cash_level        NUMERIC(14,2),   -- for ATMs
  last_replenishment TIMESTAMPTZ,
  driver            TEXT,            -- for mobile unit
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Asset location history (for mobile units)
CREATE TABLE asset_locations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          UUID NOT NULL REFERENCES assets(id),
  lat               NUMERIC(10,8),
  lng               NUMERIC(11,8),
  recorded_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maintenance logs
CREATE TABLE maintenance_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          UUID NOT NULL REFERENCES assets(id),
  technician_id     UUID REFERENCES portal_users(id),
  type              TEXT NOT NULL,   -- 'inspection', 'repair', 'service', 'replenish'
  notes             TEXT,
  cash_before       NUMERIC(14,2),   -- for replenishment
  cash_added        NUMERIC(14,2),
  cash_after        NUMERIC(14,2),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT,
  asset_id          UUID REFERENCES assets(id),
  assigned_to       UUID REFERENCES portal_users(id),
  due_date          DATE,
  status            TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'in_progress', 'done'
  created_by        UUID REFERENCES portal_users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parcels
CREATE TABLE parcels (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code     TEXT UNIQUE NOT NULL,
  recipient_name    TEXT NOT NULL,
  recipient_phone   TEXT,
  agent_id          UUID REFERENCES agents(id),
  status            TEXT NOT NULL DEFAULT 'in_transit',  -- 'in_transit', 'ready', 'collected', 'returned'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  collected_at      TIMESTAMPTZ,
  returned_at       TIMESTAMPTZ
);

-- Offline duplicate redemption events
CREATE TABLE duplicate_redemption_events (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id              UUID NOT NULL REFERENCES vouchers(id),
  beneficiary_id          UUID NOT NULL REFERENCES users(id),
  canonical_redemption_ref TEXT NOT NULL,           -- Ref to the legitimate redemption event (UUID or external id as text)
  duplicate_attempt_id    TEXT NOT NULL,           -- idempotency key from the duplicate device
  duplicate_agent_id      UUID REFERENCES agents(id),
  duplicate_device_id     TEXT,
  duplicate_amount        NUMERIC(14,2) NOT NULL,
  duplicate_requested_at  TIMESTAMPTZ NOT NULL,    -- device clock of duplicate attempt
  detected_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  status                  TEXT NOT NULL DEFAULT 'advance_posted',
    -- 'advance_posted' | 'under_review' | 'no_financial_impact' | 'agent_appealing' | 'resolved'
  resolution_notes        TEXT,
  appeal_evidence_url      TEXT,                   -- URL to stored evidence for agent appeal
  resolved_by             UUID REFERENCES portal_users(id),
  resolved_at             TIMESTAMPTZ
);

-- Beneficiary advance ledger (tracks over-disbursements to recover in future cycles)
CREATE TABLE beneficiary_advances (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id      UUID NOT NULL REFERENCES users(id),
  source_event_id     UUID NOT NULL REFERENCES duplicate_redemption_events(id),
  programme_id        UUID REFERENCES programmes(id),
  original_amount     NUMERIC(14,2) NOT NULL,   -- amount over-disbursed
  recovered_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  outstanding_amount  NUMERIC(14,2) GENERATED ALWAYS AS (original_amount - recovered_amount) STORED,
  cycles_outstanding  INT NOT NULL DEFAULT 0,   -- incremented each cycle where full recovery was not possible
  status              TEXT NOT NULL DEFAULT 'outstanding',  -- 'outstanding' | 'fully_recovered' | 'escalated'
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_recovery_at    TIMESTAMPTZ
);

-- Advance recovery transactions (one row per cycle deduction)
CREATE TABLE advance_recovery_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_id      UUID NOT NULL REFERENCES beneficiary_advances(id),
  voucher_id      UUID REFERENCES vouchers(id),   -- the reduced voucher issued this cycle
  cycle_date      DATE NOT NULL,
  amount_deducted NUMERIC(14,2) NOT NULL,
  entitlement     NUMERIC(14,2) NOT NULL,          -- original programme entitlement before deduction
  net_disbursed   NUMERIC(14,2) NOT NULL,          -- entitlement - amount_deducted
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Programmes (for Government Portal)
CREATE TABLE programmes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT NOT NULL,
  description               TEXT,
  allocated_budget          NUMERIC(14,2) NOT NULL,
  spent_to_date             NUMERIC(14,2) NOT NULL DEFAULT 0,
  start_date                DATE NOT NULL,
  end_date                  DATE NOT NULL,
  verification_frequency_days INT DEFAULT 90,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Portal user preferences (notification_preferences, etc.) – Profile & Settings.
CREATE TABLE IF NOT EXISTS portal_user_preferences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_user_id    UUID NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  preference_key    TEXT NOT NULL DEFAULT 'notification_preferences',
  preference_value  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(portal_user_id, preference_key)
);
CREATE INDEX idx_portal_user_preferences_portal_user_id ON portal_user_preferences(portal_user_id);
```

*(Note: Tables like `users`, `vouchers`, `wallets`, etc. are already defined in the Beneficiary Platform database; they are shared.)*

---

## 10. API Specifications

### 10.1 Shared Endpoints (from Buffr G2P PRD)

| Endpoint | Purpose | Used By |
|----------|---------|---------|
| `GET /api/v1/mobile/users` | List beneficiaries (with filters) | Ketchup Portal |
| `GET /api/v1/mobile/users/{id}` | Beneficiary detail | Ketchup Portal |
| `PATCH /api/v1/mobile/users/{id}/status` | Suspend/reactivate | Ketchup Portal |
| `POST /api/v1/mobile/vouchers/issue` | Issue voucher (batch or single) | Ketchup Portal |
| `GET /api/v1/mobile/vouchers` | List vouchers | Ketchup, Gov Portal |
| `GET /api/v1/mobile/agents` | List agents | Ketchup Portal |
| `PATCH /api/v1/mobile/agents/{id}/float` | Update float balance | Ketchup Portal |
| `GET /api/v1/mobile/units` | List mobile units/ATMs | Ketchup, Field Ops |
| `POST /api/v1/mobile/units/{id}/maintenance` | Log maintenance | Field Ops |
| `GET /api/v1/compliance/audit-logs` | Fetch audit logs | Ketchup Portal |
| `GET /api/v1/compliance/unverified-beneficiaries` | List overdue | Gov Portal |
| `GET /api/v1/mobile/transactions` | Transaction list (filtered) | Agent Portal |

### 10.2 New Endpoints for Portals

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| `GET` | `/api/v1/portal/me` | Current portal user (session) | — | `{ id, email, full_name, role, agent_id?, phone? }`; 401 if unauthenticated |
| `POST` | `/api/v1/auth/change-password` | Change password | `{ current_password, new_password }` | `200` or `400`/`401` |
| `GET` | `/api/v1/portal/user/preferences` | Get user preferences | Query: `key` (default `notification_preferences`) | `{ data: { notification_preferences: { ... } } }` |
| `PATCH` | `/api/v1/portal/user/preferences` | Update preferences | `{ notification_preferences: { ... } }` | `{ data: { notification_preferences: { ... } } }`; 400 if invalid |
| `POST` | `/api/v1/portal/users` | Create a portal user (admin only) | `{ email, password, full_name, role, agent_id? }` | `{ id, email, role }` |
| `GET` | `/api/v1/portal/users` | List portal users (with filters) | Query: `role`, `search` | `{ users: [...] }` |
| `PATCH` | `/api/v1/portal/users/{id}/role` | Change user role | `{ role }` | `{ success }` |
| `GET` | `/api/v1/portal/audit-logs` | Fetch audit logs | Query: `user_id`, `action`, `from`, `to` | `{ logs: [...] }` |
| `POST` | `/api/v1/portal/float-requests` | Create float request | `{ agent_id, amount }` | `{ id, status }` |
| `GET` | `/api/v1/portal/float-requests` | List float requests | Query: `agent_id`, `status` | `{ requests: [...] }` |
| `PATCH` | `/api/v1/portal/float-requests/{id}` | Approve/reject | `{ status, reviewed_by }` | `{ success }` |
| `POST` | `/api/v1/portal/parcels` | Create parcel (e.g., from return) | `{ tracking_code, recipient_name, recipient_phone, agent_id }` | `{ id }` |
| `POST` | `/api/v1/portal/parcels/{id}/collect` | Mark parcel collected | `{ collected_by? }` | `{ success }` |
| `GET` | `/api/v1/portal/parcels` | List parcels | Query: `agent_id`, `status` | `{ parcels: [...] }` |
| `POST` | `/api/v1/portal/tasks` | Create task | `{ title, description, asset_id, assigned_to, due_date }` | `{ id }` |
| `GET` | `/api/v1/portal/tasks` | List tasks | Query: `assigned_to`, `status` | `{ tasks: [...] }` |
| `PATCH` | `/api/v1/portal/tasks/{id}` | Update task (status, notes) | `{ status, notes? }` | `{ success }` |
| `POST` | `/api/v1/portal/units/{id}/location` | Update mobile unit location | `{ lat, lng }` | `{ success }` |
| `GET` | `/api/v1/portal/units/map` | Get GeoJSON for map | (none) | `{ type: "FeatureCollection", features: [...] }` |
| `POST` | `/api/v1/portal/maintenance` | Log maintenance | `{ asset_id, type, notes, cash_before?, cash_added? }` | `{ id }` |
| `GET` | `/api/v1/portal/programmes` | List programmes | (none) | `{ programmes: [...] }` |
| `POST` | `/api/v1/portal/programmes` | Create programme | `{ name, budget, start_date, end_date }` | `{ id }` |
| `GET` | `/api/v1/portal/programmes/{id}/report` | Generate programme report | (none) | PDF download |
| `GET` | `/api/v1/vouchers/{id}/status` | Real-time voucher status check (pre-redemption) | (none) | `{ status: 'available'|'pending'|'redeemed', locked_by_device_id?, lock_expires_at? }` |
| `GET` | `/api/v1/portal/duplicate-redemptions` | List duplicate redemption events | Query: `status`, `programme_id`, `region`, `from`, `to`, `page` | `{ events: [...], total, page }` |
| `PATCH` | `/api/v1/portal/duplicate-redemptions/{id}` | Update duplicate event status / add resolution notes | `{ status, resolution_notes }` | `{ success }` |
| `GET` | `/api/v1/portal/beneficiaries/{id}/advance-ledger` | Get beneficiary advance ledger | (none) | `{ advances: [...], total_outstanding_nad }` |
| `GET` | `/api/v1/portal/advance-ledger/summary` | Programme-level advance summary | Query: `programme_id`, `cycle_date` | `{ total_outstanding, recovery_rate, count_beneficiaries_affected }` |
| `POST` | `/api/v1/portal/advance-recovery` | Trigger manual advance recovery for a cycle | `{ beneficiary_id, cycle_date, amount_to_recover }` | `{ recovery_transaction_id, net_disbursed }` |
| `GET` | `/api/v1/portal/dashboard/summary` | Ketchup dashboard KPIs (counts) | (none) | `{ data: { activeVouchers, beneficiariesCount, agentsCount, pendingFloatRequestsCount } }`; 401 if not ketchup_* |

### 10.3 Request/Response Examples

The following JSON examples follow the same structure as MCP tool request/response patterns (see Appendix A). Use these for integration tests and client code.

#### Create portal user

**Request** `POST /api/v1/portal/users`
```json
{
  "email": "agent.shop@example.com",
  "password": "SecureP@ss1",
  "full_name": "Maria Shopkeeper",
  "role": "agent",
  "agent_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response** `201 Created`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "email": "agent.shop@example.com",
  "role": "agent",
  "created_at": "2026-03-15T10:00:00Z"
}
```

#### Create float request (Agent Portal)

**Request** `POST /api/v1/portal/float-requests`
```json
{
  "agent_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 5000.00
}
```

**Response** `201 Created`
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "status": "pending",
  "requested_at": "2026-03-15T10:30:00Z"
}
```

#### Mark parcel collected

**Request** `POST /api/v1/portal/parcels/{id}/collect`
```json
{
  "collected_by": "uuid of portal_users.id (optional; for audit)"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "parcel_id": "880e8400-e29b-41d4-a716-446655440003",
  "status": "collected",
  "collected_at": "2026-03-15T11:00:00Z"
}
```

#### Create task (Field Ops)

**Request** `POST /api/v1/portal/tasks`
```json
{
  "title": "Replenish ATM Oshakati",
  "description": "Cash level below 30%. Add N$50,000.",
  "asset_id": "990e8400-e29b-41d4-a716-446655440004",
  "assigned_to": "a00e8400-e29b-41d4-a716-446655440005",
  "due_date": "2026-03-16"
}
```

**Response** `201 Created`
```json
{
  "id": "b10e8400-e29b-41d4-a716-446655440006",
  "title": "Replenish ATM Oshakati",
  "status": "pending",
  "created_at": "2026-03-15T12:00:00Z"
}
```

#### Error response (consistent across endpoints)

**Response** `4xx / 5xx`
```json
{
  "success": false,
  "error": "Human-readable message",
  "error_type": "ValidationError",
  "details": {
    "field": "amount",
    "message": "Amount must be positive"
  }
}
```

#### Profile & Settings (session and preferences)

**Response** `GET /api/v1/portal/me` — `200 OK`
```json
{
  "id": "a00e8400-e29b-41d4-a716-446655440000",
  "email": "agent.shop@example.com",
  "full_name": "Maria Shopkeeper",
  "role": "agent",
  "agent_id": "550e8400-e29b-41d4-a716-446655440000",
  "phone": null
}
```
**Response** `401 Unauthorized`: `{ "error": "Unauthorized" }`. Auth: cookie `portal-auth` or `Authorization: Bearer <token>`.

**Request** `POST /api/v1/auth/change-password`
```json
{
  "current_password": "OldSecureP@ss1",
  "new_password": "NewSecureP@ss2"
}
```
**Response** `200 OK`: `{ "message": "Password updated" }`. **Response** `400`: invalid body or current password mismatch. **Response** `401`: not authenticated. Rate limit: same as login (e.g. 10/min per IP or per user).

**Response** `GET /api/v1/portal/user/preferences` — `200 OK`
```json
{
  "data": {
    "notification_preferences": {
      "agent_low_float": { "in_app": true, "email": false, "sms": true },
      "agent_float_request_approved": { "in_app": true, "email": true, "sms": false }
    }
  }
}
```
If no row exists, return `{ "data": { "notification_preferences": {} } }` or default structure per Profile & Settings spec §8.3.

**Request** `PATCH /api/v1/portal/user/preferences`
```json
{
  "notification_preferences": {
    "agent_low_float": { "in_app": true, "email": false, "sms": true }
  }
}
```
**Response** `200 OK`: `{ "data": { "notification_preferences": { ... } } }`. **Response** `400`: invalid structure or unknown notification type for portal.

#### Current user (Profile & Settings)

**Request** `GET /api/v1/portal/me`  
Headers: Cookie `portal-auth` or `Authorization: Bearer <token>`.

**Response** `200 OK`
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "agent.shop@example.com",
  "full_name": "Maria Shopkeeper",
  "role": "agent",
  "agent_id": "550e8400-e29b-41d4-a716-446655440000",
  "phone": null
}
```

**Response** `401 Unauthorized`
```json
{ "error": "Unauthorized" }
```

#### Get user preferences

**Request** `GET /api/v1/portal/user/preferences` or `GET /api/v1/portal/user/preferences?key=notification_preferences`

**Response** `200 OK`
```json
{
  "data": {
    "notification_preferences": {
      "agent_low_float": { "in_app": true, "email": false, "sms": true },
      "agent_float_request_approved": { "in_app": true, "email": true, "sms": false }
    }
  }
}
```
If no row exists, return `data.notification_preferences` as `{}` or default structure so UI can render toggles with defaults.

#### Update user preferences

**Request** `PATCH /api/v1/portal/user/preferences`
```json
{
  "notification_preferences": {
    "agent_low_float": { "in_app": true, "email": false, "sms": true },
    "agent_float_request_approved": { "in_app": true, "email": true, "sms": false }
  }
}
```

**Response** `200 OK` — same shape as GET.  
**Response** `400` — invalid structure or unknown notification type.

#### Change password

**Request** `POST /api/v1/auth/change-password`
```json
{
  "current_password": "OldSecureP@ss1",
  "new_password": "NewSecureP@ss2"
}
```
Validation: `new_password` min 8 characters (Zod schema in `src/lib/validate.ts`).

**Response** `200 OK`
```json
{ "message": "Password updated" }
```

**Response** `400` — current password incorrect or validation failed.  
**Response** `401` — not authenticated.  
Rate limit: same as login (e.g. 10 requests per minute per IP or per user).

---

## 11. Integration with Beneficiary Platform

- The portals use the **same backend** as the mobile app and USSD. All data is stored in the shared PostgreSQL database.
- **SmartPay Copilot** – Beneficiaries may interact with **SmartPay Copilot** (conversational AI for wallets, programmes, and support) through the beneficiary app and shared **SmartPay / Buffr** APIs and AI services. Copilot traffic, model calls, and safety metrics are owned by that stack; **Ketchup Portals v1 does not include a Copilot admin console**. Future releases may add read-only Copilot usage or quality metrics for ketchup_ops/compliance when backend contracts exist (see §23.1).
- Authentication between portal frontend and backend is via **Supabase JWT**. The backend API validates the JWT and checks permissions (via RLS or middleware).
- **Real‑time** is implemented via Supabase Realtime subscriptions on tables like `transactions`, `agent_float_transactions`, `asset_locations`.
- **SMS notifications**: The portals trigger SMS via the existing SMS service used by the Beneficiary Platform (e.g., via a `sms_queue` table or external API). Example: when a float request is approved, send SMS to agent.

---

## 12. Compliance & Security

| Requirement | Implementation |
|-------------|----------------|
| **Authentication** | Supabase Auth or custom JWT (portal_users + bcrypt) with strong password policy. 2FA (TOTP) available in Settings for any user; may be required by policy for specific roles (e.g. ketchup_finance for large float approvals). See §25. |
| **Authorization** | Row‑level security (RLS) in PostgreSQL enforced via Supabase; Next.js middleware checks routes based on role. |
| **Audit Logging** | All actions logged to `audit_logs` table with immutable records (5‑year retention). |
| **Data Encryption** | All data in transit TLS; sensitive PII encrypted at rest (column‑level via pgcrypto). |
| **Session Management** | Short‑lived JWT; refresh token rotation. |
| **Rate Limiting** | API rate limiting (via middleware or Vercel) to prevent abuse. |
| **Incident Reporting** | Integration with incident response workflow (PSD‑12). |
| **Data Minimization** | Only necessary data exposed to each portal; no PII in logs. |
| **Dual Control** | Sensitive actions (e.g., trust account adjustment, approving large float) require two approvals. |

### 12.1 Edge Cases & Business Logic (Duplicate Redemption, Float, Advance Recovery)

- **Duplicate redemption – agent appeal:** If status is `agent_appealing`, the agent (or duplicate_agent_id) has contested. Workflow: Ketchup reviews evidence; can set status to `under_review`, `no_financial_impact`, or `resolved` with resolution_notes. No automatic reversal of advance; if overturned, manual adjustment and advance reversal is a separate process. UI: show "Appealing" badge and resolution form for ketchup_compliance/ketchup_ops.
- **Clock skew (device timestamps):** `duplicate_requested_at` comes from the device. Allow tolerance (e.g. ±5 minutes) when comparing to server time; log skew if outside tolerance for audit. Do not reject events solely due to skew; use for analytics and support.
- **Float request approval:** Only roles `ketchup_ops` and `ketchup_finance` can PATCH float-requests to approved/rejected. On approve: update agent float, create float transaction record, send in-app + email/SMS per `portal_user_preferences`. On reject: notify agent (in-app + email/SMS if enabled). Approval is single-step unless dual-control policy applies (e.g. amount &gt; threshold).
- **Advance recovery – multiple advances:** A beneficiary may have multiple `beneficiary_advances` rows (different source events). Recovery logic: when issuing next voucher, sum `outstanding_amount` for that beneficiary (and optionally programme), cap deduction by voucher amount, and create `advance_recovery_transactions` rows. Order recovery by oldest advance first (FIFO). If partial recovery in a cycle, update `recovered_amount` and `last_recovery_at`; leave status `outstanding` until `recovered_amount >= original_amount`.

---

## 13. Non‑Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Page load time** | < 2 seconds for dashboard, < 1 second for list views. |
| **Map performance** | Smooth pan/zoom with up to 500 markers (using clustering). |
| **Real‑time latency** | < 5 seconds for location updates. |
| **Availability** | 99.5% uptime for portals (excluding planned maintenance). |
| **Concurrency** | Support up to 50 concurrent users per portal (scales with Next.js). |
| **Security** | Pass OWASP top‑10 checks; regular penetration testing. |
| **Accessibility** | WCAG 2.1 AA compliant (contrast, keyboard navigation, screen reader support). |

---

## 14. Localization & Accessibility

- **Language support**: English as default. Additional languages (Afrikaans, Oshiwambo, etc.) are out of scope for v1; planned for v2 via i18n (e.g. next-i18next).
- **Accessibility**: Use **DaisyUI** components (with Tailwind) and ensure WCAG 2.1 AA compliance. Add `aria` labels where needed. Test with keyboard navigation and screen readers.

---

## 15. Implementation Phases

### 15.1 Implementation validation (v1.4.2)

The following has been validated:

- **Build:** `npm run build` (Next.js production build) completes successfully; TypeScript compiles; all app and API routes are generated.
- **Component inventory:** All portal-specific components listed in **docs/architecture/COMPONENT_INVENTORY.md** (§11 – Ketchup, Government, Agent, Field Ops) are implemented under `src/components/{ketchup,government,agent,field-ops}/` and exported from the respective index files.
- **Task list:** All tasks in **PENDING_COMPONENTS_TASKS.md** are marked Done; no pending component work remains for MVP.
- **Data sources:** Portal pages use **real API endpoints only**. No mocks or placeholder data. Empty states use neutral fallbacks (e.g. "—", empty list) when the API returns null or empty. Key API usage:
  - **Ketchup:** Reconciliation (`GET /api/v1/reconciliation/daily` with `transaction_entries`), Audit (`GET /api/v1/audit-logs`), Network map (`GET /api/v1/assets/map`), App analytics (`GET /api/v1/analytics/dau`, `mau`, `channel-breakdown`, `redemption-rate`, `app-users`), USSD viewer (`GET /api/v1/ussd/sessions`, `sessions/[id]`).
  - **Government:** Dashboard (ProgrammeDashboard), Unverified (`GET /api/v1/beneficiaries/unverified`), Voucher monitor, Audit report generator, Programme form (`GET/POST /api/v1/programmes`).
  - **Agent:** Dashboard, Float (`GET /api/v1/agent/float`, `float/history`, `POST float/request`), Transactions (`GET /api/v1/agent/transactions`), Parcels (`GET /api/v1/agent/parcels`, `POST parcels/[id]/collect`), Commission statement.
  - **Field Ops:** Assets (`GET /api/v1/field/assets`), Tasks (`GET/POST /api/v1/field/tasks`), Activity (`GET /api/v1/field/reports/activity` with `activity_rows`), Routes (`GET /api/v1/field/route`).

### Phase 1: Foundation & Ketchup Portal MVP (8 weeks)
- Week 1-2: Project setup, Supabase Auth, DB schema creation.
- Week 3-4: Ketchup Portal dashboard, beneficiary list, agent list.
- Week 5-6: Voucher management (single issue), basic user management.
- Week 7-8: Testing, deployment to Vercel.

### Phase 2: Agent Portal & Field Ops MVP (6 weeks)
- Week 9-10: Agent Portal: float balance, transaction history.
- Week 11-12: Parcel management (list, collect).
- Week 13-14: Field Ops: map view, log maintenance.
- Week 15-16: Real‑time updates, integration with mobile unit GPS (simulated).

### Phase 3: Government Portal & Advanced Features (6 weeks)
- Week 17-18: Government Portal dashboard, unverified list.
- Week 19-20: Export reports, programme configuration.
- Week 21-22: Ketchup Portal compliance, trust reconciliation, advanced analytics.

### Phase 4: Polish & Scaling (4 weeks)
- Week 23-24: Performance optimization, caching, load testing.
- Week 25-26: 2FA, SMS notifications, final security audit.

---

## 16. Glossary

- **Beneficiary**: An individual receiving G2P grants.
- **Agent**: A shopkeeper or merchant enrolled to provide cash‑out and other services.
- **Mobile Unit**: A van with POS terminals that visits remote areas.
- **ATM**: Automated Teller Machine, managed by Ketchup or NamPost.
- **Token Vault**: Central service storing encrypted mappings for QR/offline transactions.
- **PSD**: Payment System Determination (BoN regulations).
- **Proof‑of‑Life**: Periodic biometric verification required to keep wallet active.
- **Float**: Cash balance held by an agent to pay out beneficiaries.

---

## 17. Environment Variables

The following environment variables must be set in `.env.local` (development) and in Vercel (production). **Runtime validation:** The app validates required env (e.g. `DATABASE_URL`) at first server use via `src/lib/env.ts` (Zod); missing required vars fail fast with a clear error (see PRD Implementation Status §9.1).

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) | `postgresql://user:pass@ep-xxx.neon.tech/neondb` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for admin operations) | `eyJ...` |
| `BUFFR_API_URL` | Base URL for voucher sync, reconciliation, and Buffr/SmartPay integration APIs (usually the **shared backend**, not the Buffr Connect portal origin unless that is your gateway) | `https://api.ketchup.cc` (prod); local: match your SmartPay Node or Buffr Connect port per [docs/DNS_AND_REDIRECTS.md](docs/DNS_AND_REDIRECTS.md) |
| `BUFFR_API_KEY` | Server-side key for authenticated calls to `BUFFR_API_URL` | (secret; never commit) |
| `NEXT_PUBLIC_PORTAL_URL` | Canonical public URL of **this** portals app (password reset links, emails) | `https://portal.ketchup.cc` |
| `NEXT_PUBLIC_APP_URL` | Legacy / generic public base URL; prefer **`NEXT_PUBLIC_PORTAL_URL`** for portal-specific links when both are set | `https://portal.ketchup.cc` |
| `CRON_SECRET` | Bearer secret for secured cron endpoints (e.g. SMS processing); alias `SMS_CRON_SECRET` accepted per `src/lib/env.ts` | (secret) |
| `SMTP_HOST` | SMTP server for emails (password reset, notifications) | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | `user@example.com` |
| `SMTP_PASS` | SMTP password | `secret` |
| `SMTP_FROM` | From email address | `no-reply@ketchup.cc` (support/contact mailbox: `ichigo@ketchup.cc`) |
| `ENCRYPTION_KEY` | 32‑byte hex key for PII encryption (see §12). Generate with: `openssl rand -hex 32`. Store securely; rotate per security policy. | 64-character hex string |
| `SMS_API_URL` | URL of SMS service (e.g., `https://api.ketchup.cc/sms`) | `https://api.ketchup.cc` |
| `SMS_API_KEY` | API key for SMS service | `smartpay_...` |
| `LOG_LEVEL` | Logging level (`debug`, `info`, `warn`, `error`) | `info` |
| `SENTRY_DSN` | Server-side Sentry DSN for error tracking (optional). When set, API and server errors are reported to Sentry. | `https://...@sentry.io/...` |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side Sentry DSN for browser error tracking (optional). When set, client errors are reported. | `https://...@sentry.io/...` |

---

## 18. Deployment Instructions

### 18.1 Vercel Deployment

1. Push code to GitHub repository.
2. Import project in Vercel (use `ketchup-portals` as project name).
3. Set **Root Directory** to **`ketchup-smartpay/ketchup-portals`** when the repo is the wider monorepo, or to **`/`** when this app is the repo root. **Build:** `npm run build` (see root `package.json`); do not assume pnpm unless the project adds a workspace root.
4. Add all environment variables from §17 in Vercel project settings.
5. Deploy.

### 18.2 Database Migrations

- Run migrations on Neon using `drizzle-kit push` or a migration script in CI.
- Ensure `DATABASE_URL` is set in the deployment environment.

### 18.3 Custom Domain

- Configure custom domains in Vercel: **portal.ketchup.cc** (portals app); optionally **admin.ketchup.cc**, **gov.ketchup.cc**, **agent.ketchup.cc**, **mobile.ketchup.cc** for per-portal subdomains (redirect `/` to that portal). See [docs/DOMAIN_AND_ENV_RECOMMENDATIONS.md](docs/DOMAIN_AND_ENV_RECOMMENDATIONS.md).
- Update `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_PORTAL_URL` to the portal app URL (e.g. `https://portal.ketchup.cc`).

### 18.4 DNS Configuration

**Canonical deep-dive (authoritative):** [docs/DNS_AND_REDIRECTS.md](docs/DNS_AND_REDIRECTS.md) — per-portal auth URLs, `*.ketchup.cc` bank AIS/OAuth sites (separate Vercel projects + Neon DBs), **`api.ketchup.cc`** vs optional **`backend.ketchup.cc`**, redirect URI allowlists, alignment table for **Buffr Connect** (`buffr-connect/`) and **SmartPay** (`fintech/`), and Namecheap/Vercel cutover order. **This PRD §18.4 does not duplicate that file;** update **DNS_AND_REDIRECTS.md** first, then refresh summary tables here or in **DOMAIN_AND_ENV_RECOMMENDATIONS.md** if needed.

**Ecosystem-wide summary (cross-stack):** [`FULL_ECOSYSTEM_INTEGRATION_2026-03-22.md`](../../FULL_ECOSYSTEM_INTEGRATION_2026-03-22.md) (repository root) — v5.0 **buffrconnect / buffr-ais-platform / banks** split, OIDC/PAR flow, OIDC implementation notes (e.g. **`id_token`** vs discovery), Ketchup DNS recap, **`@buffr/connect-sdk`** vs internal **`@buffr/sdk`**, portal↔AIS duplication debt, deployment checklist. **Beneficiary mobile OBS:** [`fintech/apps/smartpay-mobile/SMARTPAY_MOBILE_FLOWS_AND_STATE.md`](../../fintech/apps/smartpay-mobile/SMARTPAY_MOBILE_FLOWS_AND_STATE.md) §14. **Buffr G2P PRD** §7.6 *Implementation alignment* and **Buffr Connect PRD** §7.4.1 should stay aligned with this §18 and the root integration guide.

Summary — recommended domains (see also [docs/DOMAIN_AND_ENV_RECOMMENDATIONS.md](docs/DOMAIN_AND_ENV_RECOMMENDATIONS.md)):

| Host | Type | Value | Purpose |
|------|------|-------|---------|
| `app` | CNAME | (beneficiary app host) | app.ketchup.cc – beneficiary mobile/PWA |
| `portal` | CNAME | `cname.vercel-dns.com` | portal.ketchup.cc – portals app |
| `admin` | CNAME | `cname.vercel-dns.com` | admin.ketchup.cc – Ketchup portal (optional alias) |
| `gov` | CNAME | `cname.vercel-dns.com` | gov.ketchup.cc – Government portal (optional alias) |
| `agent` | CNAME | `cname.vercel-dns.com` | agent.ketchup.cc – Agent portal (optional alias) |
| `mobile` | CNAME | `cname.vercel-dns.com` | mobile.ketchup.cc – Field Ops portal (optional alias; may be on another project) |
| `api` | CNAME | (API host) | **api.ketchup.cc** – canonical public backend / `BUFFR_API_URL` target |

Add each hostname in the correct Vercel project; DNS targets follow Vercel’s generated CNAME (e.g. `cname.vercel-dns.com` or project-specific).

---

All pages and components must handle loading, error, and empty states consistently.

| State | Implementation |
|-------|----------------|
| **Loading** | Use skeleton loaders or a centered spinner (via `LoadingState` component). |
| **Error** | Show a user‑friendly error message with retry option (using `ErrorState` component). Log error to console; when `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` is set, also report to Sentry. |
| **Empty** | Display an empty state message with an illustration and a primary action if applicable (e.g., "No agents yet. Add your first agent."). |
| **Form validation** | Inline error messages below each field (see §21). |
| **API errors** | Show a toast notification with the error message (using `sonner` or similar). |

---

## 20. Permissions Matrix

| Route | Required Role(s) |
|-------|------------------|
| `/ketchup/*` | `ketchup_ops`, `ketchup_compliance`, `ketchup_finance`, `ketchup_support` |
| `/government/*` | `gov_manager`, `gov_auditor` |
| `/agent/*` | `agent` |
| `/field-ops/*` | `field_tech`, `field_lead` |
| `/api/v1/portal/users` (POST) | `ketchup_ops` (admin only) |
| `/api/v1/portal/float-requests` (POST) | `agent` |
| `/api/v1/portal/float-requests` (GET) | `agent`, `ketchup_ops`, `ketchup_finance` |
| `/api/v1/portal/float-requests/{id}` (PATCH) | `ketchup_ops`, `ketchup_finance` |
| `/api/v1/portal/tasks` (POST) | `field_lead` |
| `/api/v1/portal/tasks` (GET) | `field_tech`, `field_lead` (filtered by assignment) |
| `/api/v1/portal/parcels/{id}/collect` (POST) | `agent` |
| `/api/v1/portal/maintenance` (POST) | `field_tech`, `field_lead` |
| `/api/v1/portal/units/map` (GET) | `field_tech`, `field_lead`, `ketchup_ops` |
| `/api/v1/portal/programmes` (POST) | `gov_manager` |
| `/api/v1/portal/programmes` (GET) | `gov_manager`, `gov_auditor` |
| `GET /api/v1/portal/me` | Any authenticated portal user (cookie or Bearer). Returns 401 if missing/invalid. |
| `POST /api/v1/auth/change-password` | Any authenticated portal user. Rate-limited per IP/user. |
| `GET /api/v1/portal/user/preferences` | Any authenticated portal user. |
| `PATCH /api/v1/portal/user/preferences` | Any authenticated portal user. |

All other endpoints inherit permissions from the route group.

---

## 21. API Pagination, Filtering & Validation

### 21.1 Pagination

List endpoints accept the following query parameters:

- `page` – page number (default 1)
- `limit` – items per page (default 20, max 100)
- `sort` – field to sort by (e.g., `created_at`)
- `order` – `asc` or `desc` (default `desc`)

Response includes `meta` object with `total`, `page`, `limit`, `totalPages`.

### 21.2 Filtering

- Filter by exact match: `?status=pending`
- Date range: `?from=2026-01-01&to=2026-01-31`
- Search: `?search=john` (searches relevant text fields)
- **Region:** The `region` query parameter (used on beneficiaries, agents, duplicate-redemptions, vouchers/duplicates, and in list UIs) must be one of **Namibia’s 14 administrative regions**. Invalid values return `400` with `ValidationError`. The single source of truth is **`src/lib/regions.ts`** (exports `NAMIBIA_REGION_CODES`, `REGION_SELECT_OPTIONS`, `isValidRegion`, `normalizeRegion`). All region dropdowns and filters use these 14 regions; ǁKaras is stored as `Karas` in APIs for ASCII safety, with display label "ǁKaras".

### 21.3 Validation

All POST/PATCH endpoints validate input using Zod schemas. Errors are returned in the format:

```json
{
  "success": false,
  "error": "Validation failed",
  "error_type": "ValidationError",
  "details": {
    "field": "amount",
    "message": "Amount must be positive"
  }
}
```

---

## 22. Testing Strategy

| Test Type | Tools | Coverage |
|-----------|-------|----------|
| **Unit tests** | Vitest / Jest | Service layer, utility functions, validation schemas (Zod), formatters, auth helpers. |
| **Integration tests** | Vitest + test DB (Neon branch or local) | All API routes in §10: login, `/portal/me`, change-password, preferences GET/PATCH, float-requests, parcels, tasks, duplicate-redemptions, advance-ledger. Use seeded data; assert status codes and response shape. |
| **End‑to‑end tests** | Playwright | Critical user journeys: login → dashboard; Agent: float request → approval; Field Ops: task list → update status; Ketchup: duplicate redemptions list → resolve; Profile/Settings: load profile, change password, save notification preferences; `/settings` redirect by role. |
| **Component tests** | Storybook or Vitest + React Testing Library | LoadingState, ErrorState, EmptyState, ChangePasswordForm, NotificationPreferencesForm, DataTable, DashboardCard. |

Per-feature coverage:

- **Auth & session:** Unit tests for token decode and cookie helper; integration tests for POST login (cookie set), GET /portal/me (200 vs 401).
- **Profile & Settings:** Integration tests for GET/PATCH preferences (default, upsert), POST change-password (success, wrong current, rate limit); E2E for Settings page save.
- **Float requests:** Integration tests for POST (agent), PATCH approve/reject (ketchup role); E2E for Agent request and Ketchup approval with notification.
- **Duplicate redemptions:** Integration tests for GET list (filters, pagination), PATCH status; E2E for Ketchup review flow.
- **Advance recovery:** Unit tests for recovery amount calculation; integration tests for GET advance-ledger, POST advance-recovery.

All tests must be run in CI before deployment.

---

## 23. Monitoring & Logging

- **Application logs:** Sent to console (structured JSON). In production, use a log aggregation service (e.g., Logtail, Datadog). Include request id, user id (when authenticated), route, and duration.
- **Error tracking:** Integrate Sentry for client and server errors when `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` are set.
- **Performance monitoring:** Use Vercel Analytics or Datadog RUM. Track LCP, FID, CLS for portal pages.
- **Audit logs:** All actions are logged to `audit_logs` table (see §9). These are immutable and retained for 5 years.

**Key metrics to monitor:**

| Metric | Description | Target / alert |
|--------|-------------|----------------|
| Duplicate redemption rate | Count of duplicate_redemption_events per programme/period vs total redemptions | Trend; alert if spike above baseline |
| Float request response time | Time from request to approval/rejection | p95 &lt; 24 hours; alert if backlog &gt; N |
| Advance recovery rate | Recovered amount / total outstanding per cycle | Track by programme; alert if drop |
| API latency | p50/p95/p99 for `/api/v1/portal/*` | p95 &lt; 2s for list endpoints |
| Auth failures | 401/403 rate and failed login rate | Alert on brute-force pattern |
| Portal page load | LCP for dashboard and list views | p95 &lt; 2s |

### 23.1 SmartPay Copilot (ecosystem observability)

- **What it is:** **SmartPay Copilot** is part of the **Ketchup SmartPay** beneficiary experience (AI-assisted support and wallet/programme guidance), implemented in the **shared backend / beneficiary app / AI service** layer—not as a module under `/ketchup` in this portal repo.
- **v1 portal scope:** No requirement for Copilot dashboards, conversation review, or model metrics inside Ketchup Portals for MVP. Compliance and ops rely on **backend observability** (structured logs, trace tooling such as Langfuse where configured, AI proxy health) consistent with PSD‑12 and internal SOPs.
- **Planned / v2 (non-binding):** Optional future work: aggregated Copilot metrics (sessions, error rate, latency, guardrail triggers) exposed via **`/api/v1/...`** for ketchup_ops or compliance, subject to privacy review (no PII in admin-facing aggregates). Until then, document runbooks that point operators to the **AI service** and **api.ketchup.cc** monitoring.

---

## 24. Backup & Disaster Recovery

- **Database:** Neon provides automated daily backups and point‑in‑time recovery. Configure backup retention for 30 days.
- **File storage:** Supabase Storage files are backed up via Supabase policies.
- **Disaster recovery plan:** In case of region failure, restore from the latest backup in another region (manual process, documented in runbook). RTO ≤ 4 hours, RPO ≤ 5 minutes.

---

## 25. User Onboarding & 2FA Setup

### 25.1 Account Creation

- Portal users are created by Ketchup ops via an admin panel (or API). An email with a password reset link is sent to the user.
- First login forces password change.

### 25.2 Password Reset

- Users can request a password reset via the login page. An email with a reset link is sent.

### 25.3 Two‑Factor Authentication (TOTP)

- Users with roles `ketchup_finance`, `ketchup_compliance`, `gov_manager`, `field_lead` must enable 2FA.
- After login, if 2FA not set, redirect to `/auth/2fa/setup` where they scan a QR code and verify.
- 2FA verification is required at login (after password) and before sensitive actions (e.g., approving float requests).
- 2FA tokens are stored in Supabase Auth using `totp` factor.

---

## 26. Appendix A: Implementation Code Reference & MCP Documentation

This appendix adds implementation patterns and references to **Archon MCP** documentation so developers can reuse proven API and service patterns when building the Ketchup Portals. The Archon MCP docs live in this repo under `archon/docs/docs/` (mcp-overview.mdx, mcp-tools.mdx, mcp-server.mdx).

### 26.1 Architecture pattern: API Route → Service → Database

Keep business logic in a **service layer**; API routes only validate input, call the service, and return HTTP responses. This matches Archon’s split: *Server service = business logic; MCP = thin protocol wrapper*.

**Next.js App Router API route example** (e.g. create float request):

```typescript
// app/api/v1/portal/float-requests/route.ts
import { createFloatRequest } from '@/lib/services/floatRequestService';
import { getSessionOrThrow } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSessionOrThrow(); // Supabase JWT
    if (!['agent', 'ketchup_ops'].includes(session.role)) {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { agent_id, amount } = body;
    if (!agent_id || typeof amount !== 'number' || amount <= 0) {
      return Response.json({
        success: false,
        error: 'Validation failed',
        error_type: 'ValidationError',
        details: { field: 'amount', message: 'Amount must be positive' },
      }, { status: 400 });
    }
    const result = await createFloatRequest(agent_id, amount, session.userId);
    return Response.json({ id: result.id, status: result.status, requested_at: result.requested_at }, { status: 201 });
  } catch (e) {
    console.error('POST /api/v1/portal/float-requests', e);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

**Service layer** (type‑safe DB access via Prisma/Drizzle):

```typescript
// lib/services/floatRequestService.ts
import { db } from '@/lib/db';

export async function createFloatRequest(agentId: string, amount: number, requestedBy: string) {
  const row = await db.insert(float_requests).values({
    agent_id: agentId,
    amount,
    status: 'pending',
    requested_at: new Date(),
  }).returning({ id: float_requests.id, status: float_requests.status, requested_at: float_requests.requested_at });
  // Notify Ketchup ops (in‑app / email)
  return row[0];
}
```

### 26.2 Action‑based API pattern (manage_* style)

For resources that support multiple operations (create, list, get, update, delete), use a single **action** parameter instead of many small endpoints. Archon MCP uses this for `manage_project`, `manage_task`, `manage_document`, `manage_versions`.

**Example: manage_tasks** (Field Ops – create, list, get, update, delete)

| Action   | Method | Body / Query |
|----------|--------|---------------|
| `create` | POST   | `{ title, description, asset_id, assigned_to, due_date }` |
| `list`   | GET    | `?assigned_to=...&status=...` |
| `get`    | GET    | `?task_id=...` |
| `update` | PATCH  | `{ task_id, status?, notes? }` |
| `delete` | DELETE | `?task_id=...` |

Portal APIs in §10 remain REST‑style (separate routes). A consolidated `POST /api/v1/portal/tasks/manage` with `action` is not in v1; may be added in a later phase to align with MCP tool patterns.

### 26.3 Supabase Auth and middleware

- **Auth**: Supabase Auth (email/password, magic link, OAuth). Store portal users in `portal_users` and link to `auth.users` or use Supabase Auth as source of truth and add `role` in app_metadata or `portal_users`.
- **Middleware**: In Next.js middleware, verify Supabase JWT and enforce role per path (e.g. `/ketchup/*` → ketchup_ops/compliance/finance/support; `/government/*` → gov_manager/gov_auditor; `/agent/*` → agent; `/field-ops/*` → field_tech/field_lead).

```typescript
// middleware.ts (simplified)
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session && req.nextUrl.pathname.startsWith('/api/v1/portal')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  // Attach user/role to request for API routes
  return res;
}
```

### 26.4 MCP documentation sources (Archon)

Use these for patterns and tool semantics when implementing portal features (e.g. task/project flows, health checks, error shapes):

| Document | Path (repo) | Contents |
|----------|-------------|----------|
| **MCP Overview** | `archon/docs/docs/mcp-overview.mdx` | Architecture (Server vs MCP), tool categories (RAG, Project/Task, System), client config (Cursor, Windsurf, Claude). |
| **MCP Tools Reference** | `archon/docs/docs/mcp-tools.mdx` | All 14 tools: parameters, return types, examples (`perform_rag_query`, `manage_project`, `manage_task`, `manage_document`, `manage_versions`, `health_check`, etc.). |
| **MCP Server** | `archon/docs/docs/mcp-server.mdx` | Implementation pattern (tool → HTTP to Server API), env vars, Docker, Cursor/Windsurf/Claude config, tool usage examples. |

### 26.5 Cursor/IDE MCP configuration (optional)
If using Cursor or an IDE with MCP support, configure the Archon server for RAG and code examples as described above.

If the team uses **Archon as an MCP server** (e.g. for project/task management or RAG over internal docs) while building the portals, configure Cursor as follows. Archon MCP uses **SSE**; the server runs at `http://localhost:8051/sse` when Archon is up.

**Cursor** (`~/.cursor/mcp.json` or project MCP settings):

```json
{
  "mcpServers": {
    "archon": {
      "uri": "http://localhost:8051/sse"
    }
  }
}
```

**Starting Archon** (from repo root or Archon install path):

```bash
cd archon
docker compose up -d
# Or backend only: docker compose --profile backend up -d
```

See `MCP_TOOLS_INVENTORY.md` in the repo for the full list of MCP servers (Neon, Supabase, Vercel, Archon, etc.) and setup notes.

### 26.6 Error and response consistency

Align portal API responses with the MCP-style shape used in §10.3 and in Archon’s tool reference:

- **Success**: `{ success: true, ...data }` or direct resource payload.
- **Error**: `{ success: false, error: string, error_type?: string, details?: object }`.
- **Validation**: Use `error_type: "ValidationError"` and `details: { field, message }` for client-friendly forms.

### 26.7 Content retrieved via Archon MCP tools

The following was retrieved using the **Archon MCP server** (`user-archon`) so the PRD is backed by live documentation and knowledge-base results. Use the same tools when implementing the portals.

#### Tools used

| Tool | Purpose |
|------|---------|
| `perform_rag_query` | Semantic search over Archon's knowledge base (Expo, Supabase, BUFFR G2P PRD, etc.). |
| `search_code_examples` | Find code snippets with AI summaries. |
| `get_available_sources` | List indexed sources (e.g. docs.expo.dev, drizzle.team, BUFFR_G2P_PRD, daisyui.com). |
| `health_check` | Verify Archon MCP server is healthy before running queries. |

#### Sample RAG result: Expo + Supabase (Auth/SDK)

From `perform_rag_query` (source: `docs.expo.dev`), relevant to portal auth and SDK usage:

- **Using Supabase TypeScript SDK**: Install `@supabase/supabase-js` and `expo-sqlite`; create a helper to initialize the Supabase client with API URL and Publishable key ([Expo – Using Supabase](https://docs.expo.dev/guides/using-supabase/)).
- **Middleware**: "Expo Router on the web only supports build-time static generation and has no support for custom middleware." For Next.js portals, use Next.js middleware for route protection and Supabase JWT validation (see §17.3).

#### Sample RAG result: BUFFR G2P PRD (API routes)

From `perform_rag_query` (source: `file_BUFFR_G2P_PRD_md`), API route groups that portals extend:

- `/api/v1/vouchers/` – Voucher CRUD and redemption  
- `/api/v1/wallets/` – Wallet operations  
- `/api/v1/agents/` – Agent network  
- `/api/v1/compliance/` – Compliance endpoints  
- `/api/v1/ussd/` – USSD gateway  

Portals add `/api/v1/portal/*` (users, float-requests, parcels, tasks, programmes, etc.) as in §10.2.

#### Health check (Archon MCP)

Example `health_check` response from Archon MCP:

```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "api_service": true,
    "agents_service": true,
    "last_health_check": "2026-02-23T00:23:29.633435"
  },
  "uptime_seconds": 135012.07,
  "timestamp": "2026-02-23T00:23:29.633511"
}
```

#### Knowledge base sources (get_available_sources)

Archon's knowledge base includes (among others):

- `docs.expo.dev` – Expo, React Native, Supabase guides  
- `drizzle.team` – Drizzle ORM docs  
- `daisyui.com` – DaisyUI components  
- `file_BUFFR_G2P_PRD_md` – Buffr G2P PRD (API, schema, compliance)  
- `www.typescriptlang.org` – TypeScript handbook  
- `ai.pydantic.dev`, `docs.langchain.com` – Python/LLM references  

To pull more implementation material into the PRD or into implementation docs, call Archon MCP from Cursor (or any MCP client) with the server name **`user-archon`** and tools `perform_rag_query`, `search_code_examples`, and optionally `get_available_sources` (e.g. filter by `source: "docs.expo.dev"` or `source: "file_BUFFR_G2P_PRD_md"`).

---

## 27. Appendix B: Full Implementation Code (Route‑based Structure)

This appendix provides **full, copy-paste-ready code** for the Ketchup Portals as a single Next.js application with route‑based separation. File paths are relative to the project root. Ensure §9 schema is applied to the database before using this code.

### 27.1 Dependencies and environment

**package.json** (relevant deps):

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.1.x",
    "drizzle-orm": "^0.29.x",
    "@neondatabase/serverless": "^0.9.x"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.x",
    "typescript": "^5"
  }
}
```

**.env.local**:

```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 27.2 Database and schema (Drizzle)

**lib/db.ts**:

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

**lib/schema.ts** (portal tables only; extend as needed):

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  date,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const portalUserRoleEnum = pgEnum('portal_user_role', [
  'ketchup_ops',
  'ketchup_compliance',
  'ketchup_finance',
  'ketchup_support',
  'gov_manager',
  'gov_auditor',
  'agent',
  'field_tech',
  'field_lead',
]);

export const portalUsers = pgTable('portal_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: portalUserRoleEnum('role').notNull(),
  agentId: uuid('agent_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastLogin: timestamp('last_login', { withTimezone: true }),
});

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  locationLat: numeric('location_lat', { precision: 10, scale: 8 }),
  locationLng: numeric('location_lng', { precision: 11, scale: 8 }),
  address: text('address'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }).default('0.5'),
  floatBalance: numeric('float_balance', { precision: 14, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const floatRequestStatusEnum = pgEnum('float_request_status', ['pending', 'approved', 'rejected']);

export const floatRequests = pgTable('float_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  status: floatRequestStatusEnum('status').notNull().default('pending'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedBy: uuid('reviewed_by').references(() => portalUsers.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
});

export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'done']);

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(),
  name: text('name'),
  locationLat: numeric('location_lat', { precision: 10, scale: 8 }),
  locationLng: numeric('location_lng', { precision: 11, scale: 8 }),
  status: text('status').notNull().default('active'),
  cashLevel: numeric('cash_level', { precision: 14, scale: 2 }),
  lastReplenishment: timestamp('last_replenishment', { withTimezone: true }),
  driver: text('driver'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  assetId: uuid('asset_id').references(() => assets.id),
  assignedTo: uuid('assigned_to').references(() => portalUsers.id),
  dueDate: date('due_date'),
  status: taskStatusEnum('status').notNull().default('pending'),
  createdBy: uuid('created_by').references(() => portalUsers.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const parcelStatusEnum = pgEnum('parcel_status', ['in_transit', 'ready', 'collected', 'returned']);

export const parcels = pgTable('parcels', {
  id: uuid('id').primaryKey().defaultRandom(),
  trackingCode: text('tracking_code').notNull().unique(),
  recipientName: text('recipient_name').notNull(),
  recipientPhone: text('recipient_phone'),
  agentId: uuid('agent_id').references(() => agents.id),
  status: parcelStatusEnum('status').notNull().default('in_transit'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  collectedAt: timestamp('collected_at', { withTimezone: true }),
  returnedAt: timestamp('returned_at', { withTimezone: true }),
});
```

### 27.3 Auth (Supabase)

**lib/auth.ts**:

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export type PortalSession = {
  userId: string;
  email: string;
  role: string;
};

export async function getSession(): Promise<PortalSession | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = (user.user_metadata?.role as string) ?? 'agent';
  return { userId: user.id, email: user.email ?? '', role };
}

export async function getSessionOrThrow(): Promise<PortalSession> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}
```

**middleware.ts** (root) – protects routes and redirects based on role:

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Public routes
  if (path === '/' || path.startsWith('/auth/')) {
    return response;
  }

  // Protected routes
  if (!user) {
    const redirectUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const role = user.user_metadata?.role as string;

  // Role-based route access
  const isKetchupRoute = path.startsWith('/ketchup');
  const isGovernmentRoute = path.startsWith('/government');
  const isAgentRoute = path.startsWith('/agent');
  const isFieldOpsRoute = path.startsWith('/field-ops');

  if (isKetchupRoute && !role?.startsWith('ketchup_')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  if (isGovernmentRoute && !role?.startsWith('gov_')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  if (isAgentRoute && role !== 'agent') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  if (isFieldOpsRoute && !role?.startsWith('field_')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // API routes protection
  if (path.startsWith('/api/v1/portal') && !path.startsWith('/api/v1/portal/health')) {
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 27.4 Services

**lib/services/floatRequestService.ts**:

```typescript
import { db } from '@/lib/db';
import { floatRequests } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function createFloatRequest(agentId: string, amount: number) {
  const [row] = await db
    .insert(floatRequests)
    .values({
      agentId,
      amount: String(amount),
      status: 'pending',
    })
    .returning({
      id: floatRequests.id,
      status: floatRequests.status,
      requestedAt: floatRequests.requestedAt,
    });
  if (!row) throw new Error('Failed to create float request');
  return row;
}

export async function listFloatRequests(filters: { agentId?: string; status?: string }) {
  let q = db.select().from(floatRequests).orderBy(desc(floatRequests.requestedAt));
  if (filters.agentId) {
    q = q.where(eq(floatRequests.agentId, filters.agentId)) as typeof q;
  }
  if (filters.status) {
    q = q.where(eq(floatRequests.status, filters.status)) as typeof q;
  }
  return q;
}
```

**lib/services/taskService.ts**:

```typescript
import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function createTask(params: {
  title: string;
  description?: string;
  assetId?: string;
  assignedTo?: string;
  dueDate?: string;
  createdBy: string;
}) {
  const [row] = await db
    .insert(tasks)
    .values({
      title: params.title,
      description: params.description ?? null,
      assetId: params.assetId ?? null,
      assignedTo: params.assignedTo ?? null,
      dueDate: params.dueDate ?? null,
      status: 'pending',
      createdBy: params.createdBy,
    })
    .returning({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      createdAt: tasks.createdAt,
    });
  if (!row) throw new Error('Failed to create task');
  return row;
}

export async function listTasks(filters: { assignedTo?: string; status?: string }) {
  let q = db.select().from(tasks).orderBy(desc(tasks.createdAt));
  if (filters.assignedTo) {
    q = q.where(eq(tasks.assignedTo, filters.assignedTo)) as typeof q;
  }
  if (filters.status) {
    q = q.where(eq(tasks.status, filters.status)) as typeof q;
  }
  return q;
}
```

**lib/services/parcelService.ts**:

```typescript
import { db } from '@/lib/db';
import { parcels } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function markParcelCollected(parcelId: string) {
  const [row] = await db
    .update(parcels)
    .set({ status: 'collected', collectedAt: new Date() })
    .where(eq(parcels.id, parcelId))
    .returning({ id: parcels.id, status: parcels.status, collectedAt: parcels.collectedAt });
  if (!row) throw new Error('Parcel not found');
  return row;
}
```

### 27.5 API routes

**app/api/v1/portal/float-requests/route.ts**:

```typescript
import { getSessionOrThrow } from '@/lib/auth';
import { createFloatRequest, listFloatRequests } from '@/lib/services/floatRequestService';
import { NextRequest } from 'next/server';

const ALLOWED_ROLES = ['agent', 'ketchup_ops', 'ketchup_finance'];

export async function POST(request: Request) {
  try {
    const session = await getSessionOrThrow();
    if (!ALLOWED_ROLES.includes(session.role)) {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const agentId = body.agent_id ?? body.agentId;
    const amount = typeof body.amount === 'number' ? body.amount : parseFloat(body.amount);
    if (!agentId || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return Response.json({
        success: false,
        error: 'Validation failed',
        error_type: 'ValidationError',
        details: { field: 'amount', message: 'Amount must be a positive number' },
      }, { status: 400 });
    }
    const result = await createFloatRequest(agentId, amount);
    return Response.json(
      {
        id: result.id,
        status: result.status,
        requested_at: result.requestedAt?.toISOString() ?? null,
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    if ((e as Error).message === 'Unauthorized') {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/v1/portal/float-requests', e);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await getSessionOrThrow();
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id') ?? undefined;
    const status = searchParams.get('status') ?? undefined;
    const list = await listFloatRequests({ agentId, status });
    return Response.json({
      requests: list.map((r) => ({
        id: r.id,
        agent_id: r.agentId,
        amount: r.amount,
        status: r.status,
        requested_at: r.requestedAt?.toISOString() ?? null,
      })),
    });
  } catch (e: unknown) {
    if ((e as Error).message === 'Unauthorized') {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/v1/portal/float-requests', e);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

**app/api/v1/portal/tasks/route.ts**:

```typescript
import { getSessionOrThrow } from '@/lib/auth';
import { createTask, listTasks } from '@/lib/services/taskService';
import { NextRequest } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await getSessionOrThrow();
    const body = await request.json();
    const title = body.title;
    if (!title || typeof title !== 'string') {
      return Response.json({
        success: false,
        error: 'Validation failed',
        error_type: 'ValidationError',
        details: { field: 'title', message: 'Title is required' },
      }, { status: 400 });
    }
    const result = await createTask({
      title,
      description: body.description,
      assetId: body.asset_id ?? body.assetId,
      assignedTo: body.assigned_to ?? body.assignedTo,
      dueDate: body.due_date ?? body.dueDate,
      createdBy: session.userId,
    });
    return Response.json(
      {
        id: result.id,
        title: result.title,
        status: result.status,
        created_at: result.createdAt?.toISOString() ?? null,
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    if ((e as Error).message === 'Unauthorized') {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/v1/portal/tasks', e);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get('assigned_to') ?? session.userId;
    const status = searchParams.get('status') ?? undefined;
    const list = await listTasks({ assignedTo, status });
    return Response.json({
      tasks: list.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        asset_id: t.assetId,
        assigned_to: t.assignedTo,
        due_date: t.dueDate,
        status: t.status,
        created_at: t.createdAt?.toISOString() ?? null,
      })),
    });
  } catch (e: unknown) {
    if ((e as Error).message === 'Unauthorized') {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/v1/portal/tasks', e);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

**app/api/v1/portal/parcels/[id]/collect/route.ts**:

```typescript
import { getSessionOrThrow } from '@/lib/auth';
import { markParcelCollected } from '@/lib/services/parcelService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getSessionOrThrow();
    const { id } = await params;
    if (!id) {
      return Response.json(
        { success: false, error: 'Parcel ID required', error_type: 'ValidationError' },
        { status: 400 }
      );
    }
    const result = await markParcelCollected(id);
    return Response.json({
      success: true,
      parcel_id: result.id,
      status: result.status,
      collected_at: result.collectedAt?.toISOString() ?? null,
    });
  } catch (e: unknown) {
    if ((e as Error).message === 'Unauthorized') {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if ((e as Error).message === 'Parcel not found') {
      return Response.json({ success: false, error: 'Parcel not found' }, { status: 404 });
    }
    console.error('POST /api/v1/portal/parcels/[id]/collect', e);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

### 27.6 Portal Layouts and Pages

#### Root layout (`app/layout.tsx`)

```tsx
import { SupabaseProvider } from '@/components/providers/supabase-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          {children}
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  );
}
```

#### Home page (`app/page.tsx`)

Redirect to the appropriate dashboard based on role, or to login.

```tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const role = user.user_metadata?.role;

  const roleToRoute: Record<string, string> = {
    ketchup_ops: '/ketchup/dashboard',
    ketchup_compliance: '/ketchup/dashboard',
    ketchup_finance: '/ketchup/dashboard',
    ketchup_support: '/ketchup/dashboard',
    gov_manager: '/government/dashboard',
    gov_auditor: '/government/dashboard',
    agent: '/agent/dashboard',
    field_tech: '/field-ops/map',
    field_lead: '/field-ops/map',
  };

  const route = roleToRoute[role] || '/unauthorized';
  redirect(route);
}
```

#### Auth pages (`app/auth/login/page.tsx`, etc.)

Standard Supabase Auth UI (login form, signup, reset password).

#### Portal Layout Component (`components/portal-layout.tsx`)

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { KetchupSidebar } from '@/components/sidebars/ketchup-sidebar';
import { GovernmentSidebar } from '@/components/sidebars/government-sidebar';
import { AgentSidebar } from '@/components/sidebars/agent-sidebar';
import { FieldOpsSidebar } from '@/components/sidebars/field-ops-sidebar';
import { Header } from '@/components/header';

interface PortalLayoutProps {
  children: React.ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const pathname = usePathname();

  const getSidebar = () => {
    if (pathname.startsWith('/ketchup')) return <KetchupSidebar />;
    if (pathname.startsWith('/government')) return <GovernmentSidebar />;
    if (pathname.startsWith('/agent')) return <AgentSidebar />;
    if (pathname.startsWith('/field-ops')) return <FieldOpsSidebar />;
    return null;
  };

  return (
    <div className="flex h-screen">
      {getSidebar()}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

#### Example Ketchup Dashboard Page (`app/ketchup/dashboard/page.tsx`)

```tsx
import { PortalLayout } from '@/components/portal-layout';
import { DashboardCards } from '@/components/ketchup/dashboard-cards';
import { RecentActivity } from '@/components/ketchup/recent-activity';

export default function KetchupDashboardPage() {
  return (
    <PortalLayout>
      <h1 className="text-2xl font-bold mb-6">Ketchup Operations Dashboard</h1>
      <DashboardCards />
      <RecentActivity />
    </PortalLayout>
  );
}
```

Create analogous pages for the other portals under their respective route groups (e.g. `app/government/dashboard/page.tsx`, `app/agent/dashboard/page.tsx`, `app/field-ops/map/page.tsx`).

### 27.7 Supabase Auth: storing role for portal users

Store the portal **role** in Supabase so `getSession()` can read it. When creating a portal user (e.g. via Supabase Admin API or a sign-up flow), set `user_metadata.role`:

```typescript
// Example: create portal user (admin only) – call from API route or server action
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

await supabaseAdmin.auth.admin.createUser({
  email: 'agent.shop@example.com',
  password: 'SecureP@ss1',
  email_confirm: true,
  user_metadata: {
    full_name: 'Maria Shopkeeper',
    role: 'agent',
    agent_id: '550e8400-e29b-41d4-a716-446655440000',
  },
});
```

Then in **lib/auth.ts**, read role from `user.user_metadata.role` (as in the `getSession()` example above). Optionally sync `portal_users` from `auth.users` via a trigger or cron so `portal_users` stays in sync with Supabase Auth.

### 27.8 Summary of files added

| Path | Purpose |
|------|---------|
| `app/(auth)/login/page.tsx` | Login page |
| `app/(ketchup)/dashboard/page.tsx` | Ketchup dashboard |
| `app/(ketchup)/beneficiaries/page.tsx` | Beneficiary list (Ketchup) |
| `app/(government)/dashboard/page.tsx` | Government dashboard |
| `app/(agent)/dashboard/page.tsx` | Agent dashboard |
| `app/(field-ops)/map/page.tsx` | Field ops map |
| `app/layout.tsx` | Root layout with providers |
| `app/page.tsx` | Landing page (redirect by role) |
| `middleware.ts` | Auth and role‑based routing |
| `components/portal-layout.tsx` | Shared layout with dynamic sidebar |
| `components/sidebars/` | Sidebar components per portal |
| `components/header.tsx` | Shared header |
| `lib/auth.ts` | Session helpers |
| `lib/db.ts` | Database client |
| `lib/schema.ts` | Drizzle schema |
| `lib/services/*.ts` | Service layer |
| `app/api/v1/portal/*` | API routes (shared across portals) |

Extend with audit logging (§9 `audit_logs`), RLS, and role-based route guards per §12 and §7.

### 27.9 Copy-paste component code (implementation-ready)

The following blocks are **full, copy-paste-ready** implementations for all shared components referenced in this PRD. They follow Next.js 14 App Router, Tailwind CSS, and **daisyUI 5** (class names only; no emojis). File paths are relative to the project root. Use as-is or adapt to your `components/` structure.

**Reference:** Next.js [layouts and pages](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts); §19 (Loading/Error/Empty states); §28 Appendix C (Brand); [daisyUI 5](https://daisyui.com).

---

#### 27.9.1 Header (`components/header.tsx`)

Top navigation bar with search, notifications, and user menu. Use inside `PortalLayout`.

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function Header() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const portalLabel = pathname.startsWith('/ketchup')
    ? 'Ketchup'
    : pathname.startsWith('/government')
    ? 'Government'
    : pathname.startsWith('/agent')
    ? 'Agent'
    : pathname.startsWith('/field-ops')
    ? 'Field Ops'
    : 'Portal';

  return (
    <header className="navbar bg-base-100 border-b border-base-300 px-4 h-16 shadow-sm">
      <div className="flex-1 gap-4">
        <label className="input input-bordered input-sm flex items-center gap-2 max-w-md" aria-label="Search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70">
            <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754Z" clipRule="evenodd" />
          </svg>
          <input type="text" className="grow" placeholder="Search..." />
        </label>
        <span className="badge badge-ghost badge-sm">{portalLabel}</span>
      </div>
      <div className="flex-none gap-2">
        <button type="button" className="btn btn-ghost btn-circle btn-sm" aria-label="Notifications">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-8">
              <span className="text-xs">U</span>
            </div>
          </label>
          <ul tabIndex={0} className="dropdown-content menu menu-sm bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow-lg border border-base-300">
            <li><Link href="/profile">Profile</Link></li>
            <li><Link href="/auth/logout">Log out</Link></li>
          </ul>
        </div>
      </div>
    </header>
  );
}
```

---

#### 27.9.2 Sidebars (Ketchup, Government, Agent, Field Ops)

**Ketchup Sidebar** (`components/sidebars/ketchup-sidebar.tsx`):

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/ketchup/dashboard', label: 'Dashboard' },
  { href: '/ketchup/beneficiaries', label: 'Beneficiaries' },
  { href: '/ketchup/vouchers', label: 'Vouchers' },
  { href: '/ketchup/agents', label: 'Agents' },
  { href: '/ketchup/mobile-units', label: 'Mobile Units' },
  { href: '/ketchup/reconciliation', label: 'Reconciliation' },
  { href: '/ketchup/compliance', label: 'Compliance' },
  { href: '/ketchup/audit', label: 'Audit' },
];

export function KetchupSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 min-h-screen bg-base-200 border-r border-base-300 flex flex-col">
      <div className="p-4 border-b border-base-300">
        <Link href="/ketchup/dashboard" className="font-semibold text-lg text-primary">Ketchup Portal</Link>
      </div>
      <nav className="flex-1 p-2">
        <ul className="menu menu-md">
          {items.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className={pathname === href ? 'active' : ''}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
```

**Government Sidebar** (`components/sidebars/government-sidebar.tsx`):

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/government/dashboard', label: 'Dashboard' },
  { href: '/government/beneficiaries', label: 'Beneficiary Status' },
  { href: '/government/vouchers', label: 'Voucher Monitoring' },
  { href: '/government/audit', label: 'Audit Exports' },
  { href: '/government/config', label: 'Configuration' },
];

export function GovernmentSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 min-h-screen bg-base-200 border-r border-base-300 flex flex-col">
      <div className="p-4 border-b border-base-300">
        <Link href="/government/dashboard" className="font-semibold text-lg text-primary">Government Portal</Link>
      </div>
      <nav className="flex-1 p-2">
        <ul className="menu menu-md">
          {items.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className={pathname === href ? 'active' : ''}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
```

**Agent Sidebar** (`components/sidebars/agent-sidebar.tsx`):

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/agent/dashboard', label: 'Dashboard' },
  { href: '/agent/float', label: 'Float' },
  { href: '/agent/transactions', label: 'Transactions' },
  { href: '/agent/parcels', label: 'Parcels' },
  { href: '/agent/profile', label: 'Profile' },
];

export function AgentSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 min-h-screen bg-base-200 border-r border-base-300 flex flex-col">
      <div className="p-4 border-b border-base-300">
        <Link href="/agent/dashboard" className="font-semibold text-lg text-primary">Agent Portal</Link>
      </div>
      <nav className="flex-1 p-2">
        <ul className="menu menu-md">
          {items.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className={pathname === href ? 'active' : ''}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
```

**Field Ops Sidebar** (`components/sidebars/field-ops-sidebar.tsx`):

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/field-ops/map', label: 'Map' },
  { href: '/field-ops/units', label: 'Units / ATMs' },
  { href: '/field-ops/tasks', label: 'Tasks' },
  { href: '/field-ops/activity', label: 'Activity' },
  { href: '/field-ops/routes', label: 'Routes' },
  { href: '/field-ops/reports', label: 'Reports' },
];

export function FieldOpsSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 min-h-screen bg-base-200 border-r border-base-300 flex flex-col">
      <div className="p-4 border-b border-base-300">
        <Link href="/field-ops/map" className="font-semibold text-lg text-primary">Field Ops</Link>
      </div>
      <nav className="flex-1 p-2">
        <ul className="menu menu-md">
          {items.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className={pathname === href ? 'active' : ''}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
```

---

#### 27.9.3 LoadingState & ErrorState (§19)

**LoadingState** (`components/loading-state.tsx`):

```tsx
'use client';

type LoadingType = 'spinner' | 'skeleton' | 'dots';

interface LoadingStateProps {
  type?: LoadingType;
  message?: string;
  fullscreen?: boolean;
}

export function LoadingState({ type = 'spinner', message, fullscreen }: LoadingStateProps) {
  const containerClass = fullscreen
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-base-100/90 z-50'
    : 'flex flex-col items-center justify-center p-8 gap-4';

  return (
    <div className={containerClass} role="status" aria-live="polite" aria-label="Loading">
      {type === 'spinner' && (
        <span className="loading loading-spinner loading-lg text-primary" />
      )}
      {type === 'dots' && (
        <span className="loading loading-dots loading-lg text-primary" />
      )}
      {type === 'skeleton' && (
        <div className="flex flex-col gap-3 w-full max-w-md">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-4 w-5/6" />
        </div>
      )}
      {message && <p className="text-sm text-base-content/70">{message}</p>}
    </div>
  );
}
```

**ErrorState** (`components/error-state.tsx`):

```tsx
'use client';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We couldn\'t load this content. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center gap-4" role="alert">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-base-content/70 mt-1">{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
```

---

#### 27.9.4 Button & Card (DaisyUI + cva-style variants)

**Button** (`components/ui/button.tsx`):

```tsx
'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'link' | 'ketchup';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  default: 'btn',
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  outline: 'btn btn-outline',
  ghost: 'btn btn-ghost',
  danger: 'btn btn-error',
  success: 'btn btn-success',
  link: 'btn btn-link',
  ketchup: 'btn bg-[#226644] hover:bg-[#1a4d33] text-white border-0',
};

const sizeClass: Record<ButtonSize, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
  xl: 'btn-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', loading, fullWidth, className = '', children, disabled, ...props }, ref) => {
    const classes = [
      variantClass[variant],
      sizeClass[size],
      fullWidth ? 'w-full' : '',
      className,
    ].filter(Boolean).join(' ');
    return (
      <button
        ref={ref}
        type="button"
        className={classes}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="loading loading-spinner loading-sm" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
```

**Card** (`components/ui/card.tsx`):

```tsx
'use client';

import { forwardRef, type HTMLAttributes } from 'react';

type CardVariant = 'default' | 'elevated' | 'outline' | 'ghost';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hover?: boolean;
}

const variantClass: Record<CardVariant, string> = {
  default: 'bg-base-100 border border-base-300 rounded-xl shadow-sm',
  elevated: 'bg-base-100 border border-base-300 rounded-xl shadow-lg',
  outline: 'bg-transparent border-2 border-base-300 rounded-xl',
  ghost: 'bg-base-100/50 border border-base-300/50 rounded-xl',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', hover, className = '', ...props }, ref) => {
    const classes = [variantClass[variant], hover ? 'hover:shadow-md transition-shadow' : '', className].filter(Boolean).join(' ');
    return <div ref={ref} className={classes} {...props} />;
  }
);
Card.displayName = 'Card';

export function CardHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-6 pt-6 ${className}`} {...props} />;
}

export function CardTitle({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-lg font-semibold text-base-content ${className}`} {...props} />;
}

export function CardDescription({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-base-content/70 mt-1 ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-6 py-4 ${className}`} {...props} />;
}

export function CardFooter({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-6 pb-6 flex items-center gap-2 ${className}`} {...props} />;
}
```

---

#### 27.9.5 StatusBadge & MetricCard

**StatusBadge** (`components/ui/status-badge.tsx`):

```tsx
'use client';

type StatusVariant = 'active' | 'inactive' | 'pending' | 'warning' | 'error' | 'success' | 'info';
type StatusSize = 'sm' | 'md' | 'lg';

const variantClass: Record<StatusVariant, string> = {
  active: 'badge badge-success gap-1',
  inactive: 'badge badge-ghost gap-1',
  pending: 'badge badge-warning gap-1',
  warning: 'badge badge-warning gap-1',
  error: 'badge badge-error gap-1',
  success: 'badge badge-success gap-1',
  info: 'badge badge-info gap-1',
};

const sizeClass: Record<StatusSize, string> = {
  sm: 'badge-sm',
  md: 'badge-md',
  lg: 'badge-lg',
};

interface StatusBadgeProps {
  variant?: StatusVariant;
  size?: StatusSize;
  showDot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant = 'active', size = 'md', showDot = true, children, className = '' }: StatusBadgeProps) {
  const dotColor = variant === 'success' || variant === 'active' ? 'bg-success' : variant === 'error' ? 'bg-error' : variant === 'warning' || variant === 'pending' ? 'bg-warning' : 'bg-base-content/50';
  return (
    <span className={`${variantClass[variant]} ${sizeClass[size]} ${className}`}>
      {showDot && <span className={`w-2 h-2 rounded-full ${dotColor}`} />}
      {children}
    </span>
  );
}
```

**MetricCard** (`components/ui/metric-card.tsx`):

```tsx
'use client';

import { Card, CardContent } from './card';

type MetricVariant = 'default' | 'primary' | 'accent' | 'ketchup' | 'success' | 'warning';

const borderClass: Record<MetricVariant, string> = {
  default: 'border-l-4 border-base-300',
  primary: 'border-l-4 border-primary',
  accent: 'border-l-4 border-secondary',
  ketchup: 'border-l-4 border-[#226644]',
  success: 'border-l-4 border-success',
  warning: 'border-l-4 border-warning',
};

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
  variant?: MetricVariant;
}

export function MetricCard({ title, value, change, icon, variant = 'default' }: MetricCardProps) {
  return (
    <Card className={`${borderClass[variant]} overflow-hidden`}>
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-base-content/70">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change != null && <p className="text-xs mt-1 text-base-content/60">{change}</p>}
        </div>
        {icon && <div className="text-base-content/50">{icon}</div>}
      </CardContent>
    </Card>
  );
}
```

---

#### 27.9.6 EmptyState & QuickAction

**EmptyState** (`components/ui/empty-state.tsx`):

```tsx
'use client';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center gap-4">
      {icon ?? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )}
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        {description && <p className="text-sm text-base-content/70 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
```

**QuickAction** (`components/ui/quick-action.tsx`):

```tsx
'use client';

import Link from 'next/link';

interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  className?: string;
}

export function QuickAction({ href, icon, label, description, className = '' }: QuickActionProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center p-6 rounded-xl border border-base-300 bg-base-100 hover:bg-base-200 hover:border-primary/30 transition-all min-h-[120px] ${className}`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <span className="font-medium">{label}</span>
      {description && <span className="text-xs text-base-content/70 mt-1">{description}</span>}
    </Link>
  );
}
```

---

#### 27.9.7 Ketchup Dashboard: DashboardCards & RecentActivity

**DashboardCards** (`components/ketchup/dashboard-cards.tsx`):

Implement using a dashboard summary API. Add `GET /api/v1/portal/dashboard/summary` (Ketchup only) returning:
`{ activeVouchers: number, beneficiariesCount: number, agentsCount: number, pendingFloatRequestsCount: number }`.
Aggregate from: vouchers (status=available), users (beneficiaries), agents, float_requests (status=pending). Use LoadingState while fetching; on error use ErrorState with retry. Example implementation:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from '@/components/ui/metric-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

const cards = [
  { key: 'activeVouchers', title: 'Active Vouchers', variant: 'ketchup' as const },
  { key: 'beneficiariesCount', title: 'Beneficiaries', variant: 'primary' as const },
  { key: 'agentsCount', title: 'Agents', variant: 'accent' as const },
  { key: 'pendingFloatRequestsCount', title: 'Pending Float', variant: 'warning' as const },
];

export function DashboardCards() {
  const [data, setData] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/portal/dashboard/summary', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((json) => { setData(json.data ?? json); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((c) => (
        <MetricCard key={c.key} title={c.title} value={data[c.key] ?? 0} variant={c.variant} />
      ))}
    </div>
  );
}
```

**RecentActivity** (`components/ketchup/recent-activity.tsx`):

```tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export function RecentActivity() {
  const activities: { id: string; title: string; time: string; type: string }[] = [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <EmptyState title="No recent activity" description="Activity will appear here as it happens." />
        ) : (
          <ul className="space-y-3">
            {activities.map((a) => (
              <li key={a.id} className="flex justify-between items-center py-2 border-b border-base-300 last:border-0">
                <span className="font-medium">{a.title}</span>
                <span className="text-sm text-base-content/60">{a.time}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
```

---

#### 27.9.8 Entity cards (DriverCard, VehicleCard, CardGrid)

**EntityCard / DriverCard / VehicleCard** (`components/ui/entity-cards.tsx`):

```tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

interface DriverCardProps {
  name: string;
  phone?: string;
  region?: string;
  status?: 'active' | 'inactive';
  rating?: number;
  trips?: number;
}

export function DriverCard({ name, phone, region, status = 'active', rating, trips }: DriverCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-12">
              <span className="text-lg">{name.slice(0, 2).toUpperCase()}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold truncate">{name}</h4>
              <StatusBadge variant={status === 'active' ? 'success' : 'inactive'} size="sm">{status}</StatusBadge>
            </div>
            {phone && <p className="text-sm text-base-content/70">{phone}</p>}
            {region && <p className="text-xs text-base-content/60">{region}</p>}
            {(rating != null || trips != null) && (
              <p className="text-xs mt-1">
                {rating != null && `Rating: ${rating}`}
                {trips != null && ` · ${trips} trips`}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface VehicleCardProps {
  make: string;
  model: string;
  year?: number;
  licensePlate?: string;
  status?: 'active' | 'inactive';
  fuelLevel?: number;
  mileage?: number;
}

export function VehicleCard({ make, model, year, licensePlate, status = 'active', fuelLevel, mileage }: VehicleCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold">{make} {model}</h4>
          <StatusBadge variant={status === 'active' ? 'success' : 'inactive'} size="sm">{status}</StatusBadge>
        </div>
        <dl className="mt-2 text-sm text-base-content/70 space-y-1">
          {year != null && <><dt className="inline font-medium">Year: </dt><dd className="inline">{year}</dd></>}
          {licensePlate && <><dt className="inline font-medium">Plate: </dt><dd className="inline">{licensePlate}</dd></>}
          {fuelLevel != null && <><dt className="inline font-medium">Fuel: </dt><dd className="inline">{fuelLevel}%</dd></>}
          {mileage != null && <><dt className="inline font-medium">Mileage: </dt><dd className="inline">{mileage}</dd></>}
        </dl>
      </CardContent>
    </Card>
  );
}

interface CardGridProps {
  columns?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export function CardGrid({ columns = 3, children, className = '' }: CardGridProps) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[columns];
  return <div className={`grid gap-4 ${gridClass} ${className}`}>{children}</div>;
}
```

---

#### 27.9.9 Summary: files added in §27.9

| File | Purpose |
|------|--------|
| `components/header.tsx` | Shared header (search, notifications, user menu) |
| `components/sidebars/ketchup-sidebar.tsx` | Ketchup portal nav |
| `components/sidebars/government-sidebar.tsx` | Government portal nav |
| `components/sidebars/agent-sidebar.tsx` | Agent portal nav |
| `components/sidebars/field-ops-sidebar.tsx` | Field Ops nav |
| `components/loading-state.tsx` | Spinner / skeleton / dots (§19) |
| `components/error-state.tsx` | Error message + retry (§19) |
| `components/ui/button.tsx` | Button with variants (default, primary, ketchup, etc.) |
| `components/ui/card.tsx` | Card, CardHeader, CardTitle, CardContent, CardFooter |
| `components/ui/status-badge.tsx` | StatusBadge (active, pending, error, etc.) |
| `components/ui/metric-card.tsx` | MetricCard for dashboard stats |
| `components/ui/empty-state.tsx` | Empty state with optional CTA |
| `components/ui/quick-action.tsx` | QuickAction link card |
| `components/ui/entity-cards.tsx` | DriverCard, VehicleCard, CardGrid |
| `components/ketchup/dashboard-cards.tsx` | Ketchup dashboard metric cards |
| `components/ketchup/recent-activity.tsx` | Recent activity list |

Ensure `tailwind.config` includes DaisyUI and your `content` paths include these `components/` paths. Dashboard and list data must be loaded from the APIs defined in §10 (e.g. `GET /api/v1/portal/dashboard/summary` for Ketchup dashboard cards); use LoadingState and ErrorState for loading and error states.

---

### 27.10 Production-Ready Boilerplate

This section defines a **production-ready boilerplate** for the Ketchup Portals: custom layouts per portal, sub-pages, and interactive components (popovers, toasts, modals, etc.). It follows the Next.js App Router pattern and incorporates the brand guidelines.

#### 27.10.1 Portal Structure (Next.js App Router)

Use **route groups** to logically separate the four portals without affecting the URL path.

```
app/
├── (auth)/
│   ├── login/
│   ├── register/
│   └── layout.tsx
├── (ketchup)/
│   ├── dashboard/
│   ├── beneficiaries/
│   ├── vouchers/
│   ├── agents/
│   ├── layout.tsx          # Ketchup-specific layout (sidebar + header)
│   └── page.tsx             (redirects to dashboard)
├── (government)/
│   ├── dashboard/
│   ├── programmes/
│   ├── reports/
│   ├── layout.tsx
│   └── page.tsx
├── (agent)/
│   ├── dashboard/
│   ├── float/
│   ├── parcels/
│   ├── layout.tsx
│   └── page.tsx
├── (field-ops)/
│   ├── map/
│   ├── assets/
│   ├── tasks/
│   ├── layout.tsx
│   └── page.tsx
├── api/                     # API routes (shared)
├── layout.tsx               # Root layout (providers)
└── page.tsx                 # Landing (redirects to login or role-based dashboard)
```

#### 27.10.2 Folder Structure for Components

```
src/
├── components/
│   ├── ui/                  # Primitive / styled components (DaisyUI or Radix + Tailwind)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx (or modal.tsx)
│   │   ├── popover.tsx
│   │   ├── toast.tsx        (wrapper for sonner or custom)
│   │   ├── tooltip.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── index.ts
│   ├── common/              # Branded, composed components
│   │   ├── button.tsx       (extends ui/button with brand variants)
│   │   ├── card.tsx
│   │   ├── metric-card.tsx
│   │   ├── data-table.tsx
│   │   ├── status-badge.tsx
│   │   ├── brand-logo.tsx
│   │   └── index.ts
│   ├── layout/              # Layout-specific components
│   │   ├── sidebar.tsx      (dynamic based on portal)
│   │   ├── header.tsx
│   │   ├── portal-layout.tsx
│   │   ├── breadcrumbs.tsx
│   │   ├── container.tsx
│   │   └── index.ts
│   ├── forms/
│   ├── feedback/
│   ├── navigation/
│   ├── overlays/
│   ├── data-display/
│   ├── charts/
│   ├── maps/
│   ├── media/
│   └── utils/
├── lib/
├── hooks/
├── providers/
└── styles/
```

#### 27.10.3 Custom Layouts per Portal

Each portal has its own layout file inside its route group (e.g. `app/(ketchup)/layout.tsx`). The layout imports a shared **PortalLayout** component that dynamically renders the correct sidebar and header based on the route. See §27.6 for layout code; `PortalLayout` uses `usePathname()` to select `KetchupSidebar`, `GovernmentSidebar`, `AgentSidebar`, or `FieldOpsSidebar` and renders `Header` plus main content.

#### 27.10.4 Interactive Components (Popovers, Toasts, Modals)

- **Popover:** Floating panel for additional info/actions. Implement with DaisyUI dropdown or Radix `@radix-ui/react-popover`; style with Tailwind (e.g. `z-50`, `rounded-md`, `border`, `shadow`).
- **Toast:** Notification toast (success, error, info). Use **sonner** (`npm install sonner`) or custom context-based toasts. Wrap in root layout as `<Toaster />`; call `toast.success()`, `toast.error()` from components.
- **Modal / Dialog:** Reusable modal. Implement with DaisyUI `modal` or Radix `@radix-ui/react-dialog`; overlay + content + close; accessible (focus trap, escape key).
- **ConfirmDialog:** Wrapper around Modal with title, description, Confirm and Cancel buttons; optional `variant: 'destructive'` for dangerous actions.
- **Tooltip:** Simple tooltip. Use DaisyUI `data-tip` or Radix `@radix-ui/react-tooltip`; position top/bottom/left/right.

#### 27.10.5 Provider Setup (Root Layout)

Wrap the app with: **ThemeProvider**, **SupabaseProvider** (or auth provider), **TooltipProvider** (if using Radix tooltips), and **Toaster** (sonner or custom). Example:

```tsx
// app/layout.tsx
<ThemeProvider>
  <SupabaseProvider>
    <TooltipProvider>
      {children}
      <Toaster />
    </TooltipProvider>
  </SupabaseProvider>
</ThemeProvider>
```

#### 27.10.6 Example Page with Interactive Elements

Agent dashboard example: Button "Show Toast" calls `toast.success()`; Popover trigger opens popover content; Button "Delete" opens ConfirmDialog with `variant="destructive"`; on confirm, call API and `toast.success('Deleted!')`.

---

### 27.11 Drill-Down Components (Organism → Atom)

This section extends the boilerplate to support the **organism → atom drill-down** pattern: hierarchical navigation, detail pages with tabs, and modals for atomic views.

#### 27.11.1 Breadcrumbs Component

Shows current location and enables navigation up the hierarchy. Props: `items: { label: string; href?: string }[]`. Last item has no `href` (current page). Render with separator (e.g. ChevronRight or `/`). Use in detail pages and list headers.

#### 27.11.2 Drill-Down Card (Organ → Tissue)

A card that, when clicked, navigates to a filtered list or detail page. Used for regional breakdowns, programme cards, KPIs. Props: `title`, `value`, `description`, `href`, optional `icon`, `children`. On click: `router.push(href)`. Style: cursor pointer, hover shadow.

#### 27.11.3 Detail Page Layout with Tabs (Molecule view)

Layout for detail pages: breadcrumbs, title, subtitle, and tabs to switch between related atoms (e.g. beneficiary info, vouchers, transactions, proof-of-life). Props: `breadcrumbs`, `title`, `subtitle`, `tabs: { value, label, content }[]`, `defaultTab`. Use shared Tabs component (DaisyUI or Radix); each tab panel renders `content`.

#### 27.11.4 Atomic View Modal (Atom level)

When clicking an atomic record (e.g. single transaction, proof-of-life event), show a modal with full details instead of navigating. Props: `open`, `onOpenChange`, `title`, `description`, `children`. Use Dialog/Modal with ScrollArea for long content (e.g. `max-h-[70vh]`). Usage: `selectedEvent` state; row click sets `selectedEvent`; modal open when `!!selectedEvent`; content shows event details.

#### 27.11.5 Drill-Down Table Row (optional)

DataTable supports optional `onRowClick(row)`. Table rows are clickable (cursor pointer, hover background); click triggers navigation to detail page or opens AtomicModal depending on context.

#### 27.11.6 Hierarchy in Action: Example Flow (Ketchup → Beneficiaries)

1. **Organism:** Dashboard shows national KPI "Total Beneficiaries" (DrillDownCard). Click → `/ketchup/beneficiaries`.
2. **Tissue:** List of beneficiaries with filters. Click row → `/ketchup/beneficiaries/[id]`.
3. **Molecule:** DetailLayout with tabs (Information, Vouchers, Transactions, Proof of Life). Each tab shows list of atoms.
4. **Atom:** In Proof-of-Life tab, click event → AtomicModal with full event details.

#### 27.11.7 Example Detail Page Implementation

`app/(ketchup)/beneficiaries/[id]/page.tsx`: Fetch beneficiary by `params.id`. Render `DetailLayout` with breadcrumbs `[{ label: 'Beneficiaries', href: '/ketchup/beneficiaries' }, { label: beneficiary.name }]`, title, subtitle, and tabs: Information (`BeneficiaryInfo`), Vouchers (`VoucherList`), Transactions (`TransactionList`), Proof of Life (`ProofOfLifeList`). Each tab content component receives `beneficiaryId` or `beneficiary` as needed.

#### 27.11.8 Folder Update for Drill-Down

Add under `src/components/`: `navigation/breadcrumbs.tsx`, `overlays/atomic-modal.tsx`, `common/drill-down-card.tsx`, `layout/detail-layout.tsx`. Ensure DataTable (in `ui/` or `data-display/`) supports optional `onRowClick`.

---

## 28. Appendix C: Brand Design System

The following is the **Ketchup SmartPay Brand Guidelines** (visual identity and design system). All four portals (Ketchup, Government, Agent, Field Ops) should apply these guidelines.

---

### Ketchup SmartPay Brand Guidelines

This appendix is the single source of truth for Ketchup SmartPay visual identity: **Logo** (primary asset: `ketchup-portal/public/ketchup-logo.png`), **Color Palette**, **Typography**, **Photography**, **Graphic Elements**, **UI Components**, **Portals**, **Implementation**, and the **Multi-Portal Brand Design System**. Apply consistently across Ketchup, Government, Agent, and Field Ops portals.

#### Brand Identity & Visual System

---

#### Introduction

Ketchup SmartPay is the G2P engine at the heart of the BUFFR G2P Voucher ecosystem: system of record for voucher lifecycle, beneficiary registry, Token Vault, compliance, and administrative/government portals. We promote secure, equitable disbursement of government-to-person benefits, driven by a production-grade, compliance-first platform aligned with PSD-1, ETA, NAMQR, and Open Banking.

Our brand is clean, professional, and trustworthy while still providing a wide range of options to maintain a fresh and modern look. This document provides a deep dive on how the visual identity of Ketchup SmartPay came to be.

The elements outlined in this document are the foundation of our branding. This document is meant to help you understand how to work with graphical elements to create a consistent visual experience that results in a compelling interaction with Ketchup SmartPay.

Consistent branding helps you strengthen the relationship with your audience—whether they are government officials, agents, field operators, or beneficiaries.

---

#### About Ketchup SmartPay

Ketchup SmartPay is a **G2P orchestration platform** that empowers governments and financial institutions to deliver social impact through secure, compliant, and accessible digital payment systems. We bridge the gap between traditional financial systems and modern digital inclusion.

Our platform is committed to **security, transparency, and inclusion**. We embrace standards and practices that make disbursements reliable and accessible. We continuously look inward at our own systems to ensure we meet our goal of 100% PSD compliance and equitable access. As the orchestration layer for Namibia's G2P economy, Ketchup SmartPay works with government, agents, and partners to embed these values across the ecosystem. We are dedicated to a just and efficient transition to digital G2P—one that reduces friction, protects beneficiaries, and scales to every community. This is the path to a prosperous, trusted G2P future that benefits all.

| Focus Areas |
|-------------|
| Vouchers · Beneficiaries · Agents · Compliance · Open Banking · Government Oversight · Token Vault · Reconciliation |

---

#### Mission

**Ketchup SmartPay powers the just, secure, and efficient delivery of G2P benefits and payments.**

| 01 | 02 | 03 |
|----|----|-----|
| All beneficiaries in the ecosystem, regardless of location or device, have access to secure voucher redemption and payment options. | Transition to digital G2P empowers a strong agent network, integrates technology seamlessly into disbursement and redemption, and maintains full audit trails. | Ketchup SmartPay is at the center of the G2P stack, connecting government, portals, agents, and beneficiaries—enabling innovation to take root and compliance to scale. |

---

#### Logo

##### Primary Logo — Description

The **primary Ketchup SmartPay logo** is a circular emblem (logomark) consisting of:

- **Central element:** A bold **black sans‑serif letter "K"** with rounded, fluid strokes. The diagonal arms extend from the vertical bar in a continuous, strong shape. The "K" has a subtle dimensional quality and reads clearly against the sphere.
- **Background sphere:** A **perfect circle** divided into **four quadrants**, each with a distinct brand color and smooth gradients that give a spherical, modern feel. The "K" acts as the visual divider between the quadrants.
- **Quadrant colors (clockwise from top‑left):** **Lime Green** · **Magenta** · **Royal Blue** · **Sunny Yellow** (see Color Palette for exact values).
- **Effect:** A subtle **dark gray drop shadow** beneath the unit is part of the approved lockup and adds elevation; do not remove it in standard applications.

This mark represents **clarity, trust, and connectivity** in G2P payments—modern, recognizable, and scalable across portals (Ketchup Portal, Government Portal), app icons, and integrations (BUFFR, agents, API).

**Primary asset:** `apps/ketchup-portal/public/ketchup-logo.png`

---

##### Logo Type

| 01 | 02 |
|----|-----|
| **Primary logo** | The primary logo (circular "K" in color sphere) is for hero material and key touchpoints (app headers, government portal, favicon, partner materials). |
| **Brand mark** | The mark stands out on both dark and light backdrops when clear space is maintained. Use the full‑sphere lockup; do not alter the four quadrants or the "K" letterform. |

**Logo asset reference:** `ketchup-portal/public/ketchup-logo.png` — primary circular mark (Lime Green, Magenta, Royal Blue, Sunny Yellow quadrants; dark gray drop shadow).

**Logo implementation across the application:** Use this asset consistently in (1) **Landing page** (`/`) — hero logo; (2) **Login page** — LogoMark above the sign-in card; (3) **Portal header** — BrandLogo (mark) left side of the navbar in all four portals; (4) **Portal sidebars** — BrandLogo (mark) in Ketchup, Government, Agent, and Field Ops sidebar headers, linking to that portal’s dashboard. This ensures a single, recognizable Ketchup SmartPay identity at every entry point and inside every portal. For the full mapping of components used across landing, auth, header, and all sidebars, see **docs/architecture/COMPONENT_INVENTORY.md** (Extension to all portals) and PRD §2.4.

---

##### Horizontal Logo

| 01 | 02 |
|----|-----|
| The horizontal logo is designed to accommodate different layout needs (headers, letterhead, banners). | The horizontal lockup opens up the mark to transition from square to rectangular proportions for wide layouts. |

| White backdrop | Dark backdrop |
|----------------|---------------|
| Use on light backgrounds (documents, web light theme). | Use on dark backgrounds (dashboards, dark mode). |

---

##### Logo Mark

**Mark**

The **logomark** is the circular unit itself: the bold black “K” inside the four-quadrant color sphere. Once brand recognition is established, this **isolated mark** (without the word “Ketchup SmartPay”) can be used alone in specific situations—e.g. favicon, app icon, social profile picture, small UI badges.

**Source:** Use `ketchup-logo.png` from `apps/ketchup-portal/public/` (or the approved export from brand assets).

**Download Assets**

| White backdrop | Dark backdrop |
|----------------|---------------|
| Favicon, app icon on light. | App icon, social avatar on dark. |

---

##### Word Mark

**Secondary Logo**

| 01 | 02 |
|----|-----|
| The word mark is meant to be used only for specific circumstances where legibility is compromised due to **extremely small scaling** (e.g. report footers, invoice borders, small print). | Use “Ketchup SmartPay” or “SmartPay” word mark when the full logo does not fit. |

**Download Assets**

| White backdrop | Dark backdrop |
|----------------|---------------|
| Small print on light. | Small print on dark. |

---

##### Logo Space

| 01 | 02 | 03 |
|----|-----|-----|
| The logo is designed for consistent placement; the circular mark has a defined center and proportions. | To achieve maximum impact and legibility, **clear space** must be maintained around the logo. Use the **diameter of the circle** (or the height of the “K”) as the measuring unit for minimum clearance. | When aligning the logo alongside other elements (e.g. “Ketchup SmartPay” logotype), keep these implied guidelines in mind. |

---

##### Logo Variations

**Tagline**

This variation of the logo replaces or supplements the name with a tagline (e.g. *Powering the G2P Economy*, *Namibian G2P Engine*).

**Download Assets**

---

**Values**

This variation can include Ketchup SmartPay’s key values alongside the tagline (e.g. **Secure · Compliant · Equitable**).

**Download Assets**

---

**Values Masked**

This variation uses framed cutouts of key values over imagery (e.g. hero banners). Use only where the backdrop is a **photo or texture**, not a solid color.

**Download Assets**

---

##### Logo Misuses — What NOT to do

Adhering to these rules will ensure brand consistency.

**Download Assets**

| Do not | Do not |
|--------|--------|
| Change the colors of the logo beyond the approved palette (sphere quadrants and black “K”). | Alter the “K” letterform, stroke weight, or proportions. |
| Rearrange or separate the “K” and the sphere; do not delete quadrants or elements. | Add *additional* drop shadows or visual effects beyond the approved lockup. |
| Stretch, skew, or rotate the logo. | Use low-contrast versions (e.g. pale “K” on pale background) unless an approved alternate is provided. |

---

##### Choosing the Right Logo

| Use case | Recommendation |
|----------|----------------|
| **Hero visuals** (signage, badges, splash) with minimal copy | **Vertical (primary) logo** |
| **Hero visuals** where the tagline is the main headline | **Vertical logo – tagline variation** |
| **Overlay on imagery** that represents value (e.g. agents, beneficiaries) | **Vertical logo – values variation** (masked on image only) |
| **Landscape layout** with minimal copy (business card, banner, letterhead) | **Horizontal logo** |
| **End slides** of presentations, videos, animations | **Vertical or horizontal logo** (as per layout) |
| **Portrait layouts** with extensive content (e.g. long reports, posters) | **Horizontal logo** (corners, not center) |
| **Co-branding** (next to another organization’s logo) | Always place **Ketchup SmartPay logo on the left**. |
| **Internal pages / borders** of print material where space is tight | **Secondary (word) mark** |

---

##### Logo Application Misuses

| Don’t | Don’t |
|-------|-------|
| Use the vertical logo in layouts with extensive content where the logo’s legibility is compromised. | Align the horizontal logo in the **center** of the layout; reserve center alignment for the vertical logo only. Horizontal logo should sit in **corners**. |
| Use the vertical **values masked** variation on top of **solid colors** or with altered copy color; this variation is **only for use on imagery**. | Use low-contrast combinations (e.g. light logo on light background) without the approved palette. |

---

#### Color Palette

##### Primary and UI Colors

| Name | RGB | Hex | Usage |
|------|-----|-----|--------|
| **01. Midnight** | R0 G24 B24 | `#001818` | Darkest value; dark surfaces, body text. |
| **02. K Black** | R0 G0 B0 | `#000000` | **Logo:** the letter “K” in the primary mark. Do not substitute with another black in the logo. |
| **03. Lime Green** | ~R132 G204 B22 | `#84CC16` | **Logo sphere** (top-left quadrant); energy, growth. |
| **04. Magenta** | ~R192 G38 B211 | `#C026D3` | **Logo sphere** (top-right quadrant); bold accent. |
| **05. Royal Blue** | ~R37 G99 B235 | `#2563EB` | **Logo sphere** (bottom-right quadrant); trust, depth. |
| **06. Sunny Yellow** | ~R234 G179 B8 | `#EAB308` | **Logo sphere** (bottom-left quadrant); warmth, clarity. |
| **07. Forest** | R34 G102 B68 | `#226644` | Primary brand green (UI); trust, G2P. |
| **08. Accent Green** | R16 G185 B129 | `#10b981` | Accent and highlights (CTAs, success, active states). |
| **09. Seafoam** | R224 G255 B255 | `#E0FFFF` | Light accent; backgrounds, subtle highlights. |
| **10. Sand Gray** | R235 G233 B225 | `#EBE9E1` | Neutral background; cards, panels. |
| **White** | R255 G255 B255 | `#FFFFFF` | Primary light background. |

- **Logo lockup:** Use **K Black** for the “K” and **Lime Green, Magenta, Royal Blue, Sunny Yellow** for the four quadrants of the sphere. The approved drop shadow is dark gray (e.g. `#374151` or similar).
- **Midnight** is the darkest value for UI; use instead of pure black for surfaces and text when the logo is not present.
- **Forest** and **Accent Green** are the core brand colors for product UI—trust and action.
- **Seafoam** and **Sand Gray** support readability and hierarchy on light backgrounds.

---

##### Color Tints

**Accent Green** (`#10b981`) can be expanded by tints to access more shades for UI (hover, disabled, progress).

| 100% | 90% | 80% | 70% | 60% | 50% | 40% | 30% | 20% | 10% |
|------|-----|-----|-----|-----|-----|-----|-----|-----|-----|

**Forest** (`#226644`) can be expanded by tints for secondary buttons, borders, and depth.

| 100% | 90% | 80% | 70% | 60% | 50% | 40% | 30% | 20% | 10% |
|------|-----|-----|-----|-----|-----|-----|-----|-----|-----|

**Midnight** (`#001818`) can be expanded by tints for dark mode and contrast.

| 100% | 90% | 80% | 70% | 60% | 50% | 40% | 30% | 20% | 10% |
|------|-----|-----|-----|-----|-----|-----|-----|-----|-----|

---

##### Color Hierarchy

| Primary | Secondary | Tertiary |
|---------|-----------|----------|
| **White** | **Sand Gray** | **Mint** (Accent Green 30%) |
| **Midnight** | **Forest** | **Sage** (Forest 60%) |
| **Accent Green** | **Seafoam** | **Silver** (Midnight 30%) |

Use primary for dominant UI (backgrounds, primary buttons, headings); secondary for support (borders, secondary buttons); tertiary for subtle differentiation (badges, status, charts).

---

#### Typography

##### Title Font

**Font name** · **Font size** · **Weights**

- **Helvetica** (or system sans fallback) · **62pt** (display) / **28pt** (headings)
- Weights: Thin, Light, Regular, Medium

**Download Assets**

Use for: Hero titles, section headings, portal names (Ketchup Portal, Government Portal).

---

##### Title Styling — Tracking

| Too loose | Too tight | Correct |
|-----------|-----------|---------|
| 28pt type / 40 tracking | 28pt type / -75 tracking | **28pt type / -20 tracking** |
| Alters the look of the brand. | Hinders readability. | When tracking is correct, the reader won’t even notice. |

---

##### Title Styling — Leading

| Too loose | Too tight | Correct |
|-----------|-----------|---------|
| 28pt type / 44pt leading | 28pt type / 26pt leading | **28pt type / 32pt leading** |
| Too much pause between lines. | Hinders layout. | When leading is correct, the reader won’t even notice. |

---

##### Body Font

**Font name** · **Font size** · **Weights**

- **Inter** (or system sans fallback) · **62pt** (display) / **16pt** (body) / **12pt** (small)
- Weights: Extra Light, Light, Regular, Medium, Semi Bold, Bold

**Download Assets**

Use for: Body copy, tables, forms, dashboard labels, reports.

---

##### Body Styling — Tracking

| Too loose | Too tight | Correct |
|-----------|-----------|---------|
| 24pt type / 40 tracking | 24pt type / -80 tracking | **24pt type / -20 tracking** · **12pt type / 0 tracking** |
| Alters the look of the brand. | Hinders readability. | When tracking is correct, the reader won’t even notice. |

---

##### Body Styling — Leading

| Too loose | Too tight | Correct |
|-----------|-----------|---------|
| 24pt type / 44pt leading | 24pt type / 26pt leading | **24pt type / 32pt leading** · **12pt type / 15pt leading** |
| Too much pause between lines. | Hinders layout. | When leading is correct, the reader won’t even notice. |

---

#### Photography

##### Landscape / Lifestyle / Energy / Satellite (adapted for G2P)

Categories below are adapted from environmental/climate imagery to **fintech and G2P**: trust, people, technology, and place.

---

##### Landscape Images

**Download Assets**

| 01 | 02 | 03 |
|----|-----|-----|
| Photography should show **context**: disbursement regions, agent areas, community settings. Natural and built landscapes with a clear focal point. | Use **warm, earthy and analogous tones**. Lighting should be clear and professional to support trust and clarity. | Use as **backdrop treatment** for key messages (e.g. hero banners) when following the guidelines above. |

---

##### Landscape Don’ts

| Avoid | Avoid | Avoid |
|-------|-------|-------|
| Too many competing elements; colors and textures that don’t work cohesively. | Saturation that feels artificial or off-brand. | Missing sharp lighting and a clear hero subject. |
| Dull colors and chaotic framing. | Faded or inconsistent lighting. | Static angles with no sense of place or scale. |

---

##### Energy / Technology Images

**Download Assets**

| 01 | 02 | 03 |
|----|-----|-----|
| Focus on **payments and technology in use**: devices, agents, vouchers, POS, mobile units. Shot angle should capture a **dynamic element** (action, device in hand, screen). | Colors should align with the **brand palette** (greens, neutrals, light blues) or analogous professional tones. | When people appear, they should be the **main subject**, with technology or process serving as the backdrop. |

---

##### Energy / Technology Don’ts

| Avoid | Avoid | Avoid |
|-------|-------|-------|
| Confusing angle where technology or action is lost. | Black and white or low exposure unless intentionally editorial. | Wrong main subject (e.g. tech lost in backdrop). |
| Somber or untrustworthy lighting. | Wrong subject or oversaturated color. | Abstract framing with no clear subject; chaotic framing with competing elements. |

---

##### Region / Place Images (Northeast → Namibia)

**Download Assets**

| 01 | 02 | 03 |
|----|-----|-----|
| Subjects: **regions Ketchup SmartPay serves** (e.g. Namibia, agent networks, communities). Natural and urban landscapes, buildings, local context. | Variety: city and rural, different regions and use cases. | To portray impact, include **varied seasons and conditions** where relevant (e.g. outreach, field operations). |

**Don’t:** Bad lighting, generic stock that doesn’t reflect region or context.

---

##### Lifestyle Images

**Download Assets**

| 01 | 02 | 03 |
|----|-----|-----|
| Capture **real moments**: beneficiaries, agents, partners in activity or reaction. | **Candid** moments of emotion or focus; avoid rigid posing or lack of activity. | Tones can be warm or cool but should be **consistent** when using more than one image in a layout. |

**Lifestyle Don’ts:** Posed subjects; no movement or reaction; low exposure; bad lighting.

---

##### Satellite / Abstract (Data & Systems)

**Download Assets**

| 01 | 02 | 03 |
|----|-----|-----|
| Use for **abstract or system-level themes**: data, networks, coverage, compliance. Satellite or map-inspired imagery can represent scale and reach. | Balance **texture and color** for cohesiveness; avoid chaotic or synthetic looks. | Use as **backdrop** for content (e.g. dashboards, reports) when following the guidelines above. |

**Satellite Don’ts:** Overly synthetic colors; literal globe clichés; angles that don’t support the concept.

---

#### Graphic Elements

The **primary logo** (circular “K” in the four-quadrant color sphere) can inspire secondary graphical elements: the **segmented sphere** or the **“K” letterform** may be used in frames, patterns, or accents when consistent with these guidelines. Do not alter the approved logo lockup itself.

---

##### Member / Partner Badges

**Vertical** · **Download Assets**

| Silver | Gold | Platinum |
|--------|------|----------|
| Partner / participant level. | Committed partner level. | Top-tier / excellence level. |

**Horizontal** · **Download Assets**

Use when layout requires a wide lockup (footers, partner strips).

---

##### Badge Lockup

**Download Assets**

- **Silver:** “This organization participates in the Ketchup SmartPay G2P ecosystem.”
- **Gold:** “This organization is committed to driving secure, compliant G2P delivery with Ketchup SmartPay.”
- **Platinum:** “This organization excels in the equitable and secure G2P economy with Ketchup SmartPay.”

---

##### Open Frame

**Download Assets**

The frame from the logo can be isolated as a **branded graphic element** to focus the viewer’s attention on a subject, metric, or area. Use strategically.

| 01 | 02 |
|----|-----|
| Frame should **not exceed 2/3 of the page** (or viewport). | Frame **thickness** should be adjusted according to size (e.g. thicker for large hero, thinner for small UI). |

---

##### Open Brackets

**Download Assets**

The “negative” of the frame creates **brackets** that highlight content without overlapping it—e.g. framing photos or key stats.

| 01 | 02 |
|----|-----|
| Brackets **frame content** (e.g. photos, cards) rather than overlapping subjects. | Bracket **thickness** should scale with layout. |

---

##### Open Arrows

**Download Assets**

Corners from the open brackets can be used as **arrows** to suggest movement (e.g. flow, process, next step). Avoid rotating the arrow back to a right-angle corner.

| 01 | 02 |
|----|-----|
| Images can be **masked within** the arrow shape where appropriate. | Use **2–3 arrows per layout** for movement; avoid clutter. |

---

##### Blur Effect

**Download Assets**

Blurring can **frame content** and create space for copy overlay.

| 01 | 02 |
|----|-----|
| Busy images can be **blurred** to reduce visual weight and improve legibility of text. | Combine with **frame or bracket** elements to reinforce hierarchy. |

**Example:** *Lorem ipsum dolor sit amet* over a softly blurred background.

---

#### UI Components

The Ketchup SmartPay component library provides consistent, branded UI elements for both portals (Ketchup Portal and Government Portal).

##### Buttons

| Component | Description | Features |
|-----------|-------------|----------|
| **Button** | Standard button with brand variants | Default, outline, ghost, ketchup variants |
| **iOSButton** | iOS-style pill button | Rounded-full, shadow, hover lift, active press |
| **PillButton** | Toggle/tab pill button | Active states, icon support |
| **PillGroup** | Group of pill buttons | Tabs, filters, segmented controls |
| **CircleButton** | Circular icon button | Floating actions, toolbars |
| **FAB** | Floating Action Button | Fixed position, blur backdrop |

##### Button Variants

```tsx
import { Button, IOSButton, PillButton, CircleButton, FAB } from '@smartpay/ui';

// Standard buttons
<Button variant="default">Default</Button>
<Button variant="ketchup">Ketchup Brand</Button>
<Button variant="outline">Outline</Button>

// iOS-style buttons (pill-shaped with shadow)
<IOSButton variant="primary" size="md">Submit</IOSButton>
<IOSButton variant="success" fullWidth>Success</IOSButton>
<IOSButton icon={Plus}>Add New</IOSOSButton>

// Pill buttons (great for tabs)
<PillButton active>Active</PillButton>
<PillButton variant="outline">Outline</PillButton>

// Circle button (icon-only)
<CircleButton icon={Settings} variant="primary" />

// Floating Action Button
<FAB icon={Plus} position="bottom-right" />
```

**Button Size Options:**
- `sm` - Small
- `md` - Medium (default)
- `lg` - Large
- `icon` - Icon-only

**Button Shape Options:**
- `default` - Rounded-md
- `ios` - Rounded-full (iOS style)
- `pill` - Rounded-full
- `square` - Rounded-none
- `lg` - Rounded-lg

---

##### Layout Components

| Component | Description | Location |
|-----------|-------------|----------|
| **Header** | Top navigation bar with search, notifications, user menu | `apps/*/src/components/layout/Header.tsx` |
| **Sidebar** | Navigation sidebar with collapsible sections | `apps/*/src/components/layout/Sidebar.tsx` |
| **Layout** | Main layout wrapper combining Header and Sidebar | `apps/*/src/components/layout/Layout.tsx` |

---

##### Brand Components

| Component | Description | Usage |
|-----------|-------------|-------|
| **BrandBadge** | Generic badge with Silver/Gold/Platinum variants | `packages/ui/src/components/BrandBadge.tsx` |
| **PartnerBadge** | Partner level indicators (vertical/horizontal) | Use for partner/organization status |
| **BrandLogo** | Consistent logo component (full/mark/word variants) | `packages/ui/src/components/BrandLogo.tsx` |
| **LogoMark** | Isolated circular logo mark | Favicon, app icons |
| **PortalLogo** | Logo with portal-specific label | Government/Ketchup portals |
| **OpenFrame** | Branded frame element | Focus attention on metrics |
| **Brackets** | Content-framing brackets | Highlight stats, photos |
| **BrandArrow** | Directional arrows (movement indicators) | Flow diagrams, processes |
| **BlurOverlay** | Blurred background overlay | Hero sections, focused content |
| **HeroBlur** | Hero section with blurred background | Landing pages, banners |

---

##### Entity Cards

Visual cards for displaying entities (drivers, vehicles, etc.) with photos, status, and key metrics.

| Component | Description | Properties |
|-----------|-------------|-----------|
| **DriverCard** | Driver profile with photo, contact, status, rating | photo, phone, region, status, rating, trips |
| **VehicleCard** | Vehicle profile with details, fuel, mileage | make, model, year, licensePlate, fuelLevel, mileage |
| **EntityCard** | Generic entity card | icon, title, stats, actions |
| **CardGrid** | Responsive grid container for cards | columns (1-4), gap |

**Example Usage:**

```tsx
import { DriverCard, VehicleCard, CardGrid } from '@smartpay/ui';

<CardGrid columns={3}>
  <DriverCard 
    name="John Doe" 
    phone="+264 81 123 4567"
    region="Windhoek"
    status="active"
    rating={4.8}
  />
  <VehicleCard 
    make="Toyota" 
    model="Hilux" 
    year={2022}
    licensePlate="NLD 12345"
    status="active"
    fuelLevel={75}
  />
</CardGrid>
```

---

##### UI Enhancements

| Component | Description | Usage |
|-----------|-------------|-------|
| **Timeline** | Vertical timeline for activity logs | Audit trails, history, status updates |
| **EmptyState** | Friendly empty state with icons | No results, search empty |
| **QuickAction** | CTA button with icon and description | Dashboard actions, main tasks |
| **QuickActionsGrid** | Grid of quick actions | Main navigation, shortcuts |
| **SearchHeader** | Header with search input | List pages, dashboards |
| **SectionHeader** | Section title with action button | Card sections, groups |
| **StatusPill** | Color-coded status indicator | Active/inactive, success/error |

---

##### Core UI Components

Reusable components following brand guidelines:

| Component | Brand Variants | Description |
|-----------|----------------|-------------|
| **Button** | default, primary, accent, ketchup, ghost, link | All variants use brand colors |
| **Card** | Default styling with brand borders | Primary containers |
| **MetricCard** | default, primary, accent, ketchup, success, warning | Dashboard metrics |
| **Badge** | default, secondary, destructive, ketchup | Status badges |

---

#### Portals

##### Ketchup Portal

**Purpose:** Operational dashboard for voucher management, beneficiary registry, agent network, and system monitoring. Also provides **Buffr App Admin** (Buffr Users, Buffr Analytics) when Buffr Python backend is configured.

| Feature | Status |
|---------|--------|
| Dashboard | ✅ Implemented |
| Beneficiaries | ✅ Implemented |
| Vouchers | ✅ Implemented |
| Agent Network | ✅ Implemented |
| Mobile Units | ✅ Implemented |
| Analytics | ✅ Implemented |
| **Buffr App Admin** | ✅ Implemented (Buffr Users, Buffr Analytics; requires `VITE_BUFFR_API_URL` + `VITE_BUFFR_API_KEY`) |

**Color Scheme:** Uses full brand palette (Forest, Accent Green, Lime, etc.)

**Buffr Admin:** Under the **BUFFR APP** section (admin/analyst only), operators can list and manage Buffr app users and view Buffr transaction/user/merchant analytics. See `docs/KETCHUP_BUFFR_ADMIN.md` for setup.

---

##### Government Portal

**Purpose:** Oversight dashboard for compliance, audit reports, financial analytics, and government monitoring.

| Feature | Status |
|---------|--------|
| Dashboard | ✅ Implemented |
| Compliance | ✅ Implemented |
| Voucher Monitoring | ✅ Implemented |
| Beneficiary Registry | ✅ Implemented |
| Audit Reports | ✅ Implemented |
| Regional Performance | ✅ Implemented |

**Color Scheme:** Uses full brand palette with Government Portal badge

---

##### Portal Consistency

Both portals share:
- **Color Palette:** All brand colors from Section 03
- **Typography:** Helvetica (display), Inter (body)
- **Gradients:** Primary, Accent, Sphere
- **Components:** Shared UI library (`packages/ui`)
- **Logo:** Ketchup SmartPay logo on all pages
- **Navigation:** Consistent sidebar with brand styling

---

#### Implementation

##### File Structure

```
ketchup-smartpay/
├── apps/
│   ├── ketchup-portal/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── layout/ (Header, Sidebar, Layout)
│   │   │   │   ├── dashboard/
│   │   │   │   └── ...
│   │   │   └── pages/
│   │   └── public/
│   │       └── ketchup-logo.png
│   │
│   └── government-portal/
│       ├── src/
│       │   ├── components/
│       │   │   └── layout/ (Header, Sidebar, Layout)
│       │   └── pages/
│       └── public/
│           └── ketchup-logo.png
│
└── packages/
    └── ui/
        └── src/
            ├── components/
            │   ├── BrandBadge.tsx
            │   ├── BrandFrame.tsx
            │   ├── BrandLogo.tsx
            │   ├── EntityCard.tsx
            │   ├── UIEnhancements.tsx
            │   └── ...
            └── styles/
                └── globals.css
```

---

##### Tailwind Configuration

Both portals configure Tailwind with brand colors:

```ts
// tailwind.config.ts
colors: {
  ketchup: {
    midnight: 'var(--ketchup-midnight)',
    forest: 'var(--ketchup-forest)',
    lime: 'var(--ketchup-lime)',
    magenta: 'var(--ketchup-magenta)',
    royal: 'var(--ketchup-royal)',
    yellow: 'var(--ketchup-yellow)',
    accent: 'var(--ketchup-accent)',
    sand: 'var(--ketchup-sand)',
    seafoam: 'var(--ketchup-seafoam)',
    'k-black': 'var(--ketchup-k-black)',
  },
}
```

---

##### CSS Variables

Brand tokens are defined as CSS variables for consistency:

```css
:root {
  /* Brand Colors */
  --ketchup-midnight: #001818;
  --ketchup-forest: #226644;
  --ketchup-lime: #84CC16;
  --ketchup-magenta: #C026D3;
  --ketchup-royal: #2563EB;
  --ketchup-yellow: #EAB308;
  --ketchup-accent: #10B981;
  --ketchup-sand: #EBE9E1;
  --ketchup-seafoam: #E0FFFF;
  --ketchup-k-black: #000000;

  /* Semantic Tokens */
  --primary: 160 84% 39%;    /* Accent Green */
  --secondary: 150 50% 27%;   /* Forest */
  --accent: 84 71% 45%;      /* Lime */
}
```

---

#### Brand Design System (Multi-Portal)

This section defines the **Ketchup Software Solutions** design system tailored for the multi-portal ecosystem (Ketchup Portal, Government Portal, Agent Portal). It extends the visual identity above with implementation-ready tokens, components, and portal-specific themes. **Logo and logomark** and **logo sphere colors** (Color Palette) remain authoritative; this system provides optional **primary UI palettes** and shared component patterns.

---

##### Core Brand Identity

###### Mission & Vision

**Ketchup Software Solutions** empowers governments and financial institutions to deliver social impact through secure, compliant, and accessible digital payment platforms. We bridge the gap between traditional financial systems and modern digital inclusion.

**Brand Pillars:**

| Pillar | Description |
|--------|-------------|
| **Secure** | Enterprise-grade security and compliance-first architecture |
| **Accessible** | Multi-channel delivery (app, USSD, QR, SMS) for all users |
| **Scalable** | Modular architecture for nationwide G2P programs |
| **Transparent** | Full audit trails and real-time reporting |

---

##### Color Palette (G2P Professional)

Optional **Tomato Red** spectrum for primary UI (e.g. CTAs, navigation) while keeping logo sphere colors (Lime, Magenta, Royal Blue, Sunny Yellow) and Forest/Accent Green for consistency with Section 03 where needed.

```css
/* Primary Palette - Tomato Red Spectrum */
--ketchup-primary: #E53935;      /* Primary brand red */
--ketchup-secondary: #FF5252;    /* Accent/CTA red */
--ketchup-dark: #B71C1C;         /* Dark red for headers */
--ketchup-light: #FF8A80;        /* Light red for highlights */

/* Neutral Palette - Trust & Professionalism */
--ketchup-midnight: #001818;     /* Deep teal (from Section 03) */
--ketchup-charcoal: #2D3748;     /* UI text */
--ketchup-gray: #718096;         /* Secondary text */
--ketchup-light-gray: #EDF2F7;   /* Backgrounds */

/* Functional Colors */
--ketchup-success: #38A169;       /* Green for success states */
--ketchup-warning: #D69E2E;      /* Amber for warnings */
--ketchup-error: #E53E3E;        /* Red for errors (distinct from brand red) */
--ketchup-info: #3182CE;          /* Blue for informational */
```

---

##### Typography System

```css
/* Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;

/* Scale (Tailwind-like) */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */

/* Weights */
--font-thin: 100;
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

---

##### Tailwind Configuration (Design System)

```javascript
// tailwind.config.js (design system extension)
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './packages/ui/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          300: '#E57373',
          400: '#EF5350',
          500: '#E53935',  // Brand primary
          600: '#D32F2F',
          700: '#C62828',
          800: '#B71C1C',
          900: '#8B0000',
        },
        secondary: { 500: '#FF5252' },
        charcoal: {
          50: '#F7FAFC',
          100: '#EDF2F7',
          200: '#E2E8F0',
          300: '#CBD5E0',
          400: '#A0AEC0',
          500: '#718096',
          600: '#4A5568',
          700: '#2D3748',
          800: '#1A202C',
          900: '#171923',
        },
        success: '#38A169',
        warning: '#D69E2E',
        error: '#E53E3E',
        info: '#3182CE',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: { '18': '4.5rem', '88': '22rem', '128': '32rem' },
      borderRadius: { '4xl': '2rem' },
      boxShadow: {
        'ketchup': '0 4px 20px rgba(229, 57, 53, 0.15)',
        'ketchup-lg': '0 10px 40px rgba(229, 57, 53, 0.2)',
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
      },
      keyframes: {
        'pulse-subtle': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.8 } },
        'slide-in': { '0%': { transform: 'translateY(-10px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
```

---

##### Modular Component Architecture

###### Base Components (`@smartpay/ui`)

- **Button:** Variants `default`, `secondary`, `outline`, `ghost`, `danger`, `success`; sizes `xs`–`xl`; optional `loading`, `leftIcon`, `rightIcon`; focus ring `primary-500`.
- **Card:** Variants `default`, `elevated`, `outline`, `ghost`; optional `hover`; subcomponents `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

###### Portal-Specific Components

- **DashboardCard:** Title, value, optional percentage change, icon, variants `default` | `success` | `warning` | `error`, loading skeleton.
- **DataTable:** Generic `<T>` with columns (key, header, cell?, width?, sortable?), keyExtractor, onRowClick?, loading skeleton, optional pagination (page, pageSize, total, onPageChange).

##### Layout Components

- **Sidebar:** Nav items (path, label, icon, badge?), logo slot, collapsed state; active state `bg-primary-50 text-primary-700`.
- **Header:** Title, subtitle, actions, optional breadcrumbs (label, path?).

Full implementation reference: Button and Card use `cva` (class-variance-authority) and `cn()`; variants and sizes as in 10.4 Tailwind. DashboardCard wraps Card with left border variant, value/change/icon; DataTable is generic with columns, keyExtractor, pagination, loading skeleton. Sidebar uses NavLink, active `bg-primary-50 text-primary-700`; Header has breadcrumbs, title, subtitle, actions.

---

##### Portal-Specific Design Systems

| Portal | Primary | Secondary | Background | Use Case |
|--------|---------|-----------|------------|----------|
| **Ketchup Admin** | #E53935 | #1E40AF | #F9FAFB | Enterprise ops |
| **Government** | #1E3A8A | #047857 | #F0F9FF | Compliance, official |
| **Agent** | #059669 | #EAB308 | #F0FDF4 | Field, transactions |

- **Government:** Status colors — compliant, warning, nonCompliant, pending; font `"Public Sans", "Inter"`.
- **Agent:** Transaction colors — cashout, deposit, commission; quick-action size 64px, border-radius 16px.

**Portal theme objects:**

- **Ketchup Admin:** `primary: '#E53935'`, `secondary: '#1E40AF'`, `background: '#F9FAFB'`, spacing (container 1280px, section 2rem, card 1.5rem), shadows sm/md/lg/xl.
- **Government:** `primary: '#1E3A8A'`, `secondary: '#047857'`, `background: '#F0F9FF'`, status (compliant, warning, nonCompliant, pending), typography (Public Sans, Inter, sizes h1–small).
- **Agent:** `primary: '#059669'`, `secondary: '#EAB308'`, `background: '#F0FDF4'`, transactions (cashout, deposit, commission), quickAction size 64px, borderRadius 16px.

---

##### Utility Components

- **LoadingState:** Types `spinner` | `skeleton` | `dots`; message; fullscreen option.
- **StatusBadge:** Variants `active` | `inactive` | `pending` | `warning` | `error` | `success` | `info`; sizes `sm` | `md` | `lg`; optional dot indicator.

Implement in `packages/ui/src/components/utils/loading-state.tsx` and `status-badge.tsx` using `class-variance-authority` and `cn()`.

---

##### CSS Variables & Global Styles

```css
@layer base {
  :root {
    --color-primary-50: #FFEBEE;
    --color-primary-500: #E53935;
    --color-primary-700: #C62828;
    --color-charcoal-50: #F7FAFC;
    --color-charcoal-700: #2D3748;
    --color-success: #38A169;
    --color-warning: #D69E2E;
    --color-error: #E53E3E;
    --color-info: #3182CE;
  }
  body { @apply bg-gray-50 text-charcoal-700 antialiased; }
  ::-webkit-scrollbar { @apply w-2; }
  ::-webkit-scrollbar-track { @apply bg-charcoal-100; }
  ::-webkit-scrollbar-thumb { @apply rounded-full bg-charcoal-300 hover:bg-charcoal-400; }
  ::selection { @apply bg-primary-100 text-primary-900; }
  :focus-visible { @apply outline-2 outline-primary-500 outline-offset-2; }
}

@layer components {
  .card-hover { @apply transition-all duration-200 hover:shadow-lg hover:-translate-y-1; }
  .dashboard-grid { @apply grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4; }
  .form-input { @apply w-full rounded-lg border border-charcoal-300 bg-white px-4 py-2.5 text-sm
    placeholder:text-charcoal-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200
    focus:outline-none disabled:bg-charcoal-50 disabled:text-charcoal-500; }
  .status-indicator { @apply inline-flex items-center space-x-2; }
  .status-active { @apply bg-success; }
  .status-pending { @apply bg-warning; }
  .status-error { @apply bg-error; }
}

@layer utilities {
  .text-balance { text-wrap: balance; }
  .transition-smooth { @apply transition-all duration-300 ease-in-out; }
  .gradient-primary { @apply bg-gradient-to-r from-primary-500 to-primary-700; }
  .glass { @apply backdrop-blur-md bg-white/80 border border-white/20; }
  .status-indicator-dot { @apply h-2 w-2 rounded-full; }
  .animation-delay-100 { animation-delay: 100ms; }
  .animation-delay-200 { animation-delay: 200ms; }
}
```

---

##### Responsive Design System

```typescript
// Breakpoints
export const breakpoints = {
  xs: 320, sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536,
};

// Responsive utility classes
export const responsiveClasses = {
  container: 'mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl',
  grid: {
    mobile: 'grid-cols-1',
    tablet: 'sm:grid-cols-2',
    desktop: 'lg:grid-cols-3 xl:grid-cols-4',
  },
  spacing: { mobile: 'space-y-4', tablet: 'sm:space-y-0 sm:space-x-4' },
};
```

---

##### Implementation

###### Installation

```bash
cd ketchup-portal && pnpm add @smartpay/ui
cd ../government-portal && pnpm add @smartpay/ui
cd ../agent-portal && pnpm add @smartpay/ui
```

###### App Setup

```typescript
import '@smartpay/ui/styles/globals.css';
import { ThemeProvider } from '@smartpay/ui/contexts/theme-context';

function App() {
  return <ThemeProvider>{/* app */}</ThemeProvider>;
}
```

###### Design Tokens Export

Export from `packages/ui/src/tokens/index.js`: **designTokens** (colors.primary 50–900, colors.charcoal 50–900, colors.functional success/warning/error/info; typography.fonts sans/mono, typography.scale xs–5xl; spacing 0–32; borderRadius none–full; shadows sm, md, lg, xl, 2xl, inner, ketchup). **cssVariables:** derive `--ketchup-{category}-{key}-{subKey}` from designTokens for theming.

---

##### Performance

- Use **memo** and **useMemo** / **useCallback** for list and table components.
- **Lazy loading** for route-level and heavy UI components: `React.lazy(() => import(...))`.
- **Virtual scrolling** for large lists (e.g. DataTable with many rows) to limit DOM nodes: compute visible range from scroll position and item height; render only visible items in a positioned container.

---

##### Summary

| Outcome | Description |
|--------|-------------|
| **Brand consistency** | Unified Ketchup Software Solutions branding across portals |
| **Modular architecture** | Reusable components in `@smartpay/ui` |
| **Portal-specific themes** | Admin, Government, Agent themes (Section 10.6) |
| **Performance** | Memoization, lazy loading, virtual scrolling |
| **Accessibility** | Focus management, ARIA, semantic HTML |
| **Responsive** | Mobile-first, shared breakpoints and utilities |

This design system provides: (1) Brand Consistency — unified Ketchup Software Solutions branding across all portals; (2) Modular Architecture — reusable components in `@smartpay/ui`; (3) Portal-Specific Customization — Admin, Government, Agent themes; (4) Performance — memoization, lazy loading, virtual scrolling; (5) Accessibility — focus management, ARIA, semantic HTML; (6) Responsive Design — mobile-first, Tailwind breakpoints; (7) Developer Experience — TypeScript, consistent API. The system is production-ready and can be incrementally adopted across the portal ecosystem while maintaining consistency and performance.

---

##### Appendix: Full Code Reference

The following blocks match the design system specification (ACT + BUFFR G2P). Implement in `packages/ui` and portal apps as described in Section 10.

###### A. Base Components (Button, Card)

**Button** (`packages/ui/src/components/button.tsx`): Use `cva` with variants `default` | `secondary` | `outline` | `ghost` | `danger` | `success`, sizes `xs` | `sm` | `md` | `lg` | `xl`, `fullWidth`. Props: `loading`, `leftIcon`, `rightIcon`; forwardRef; disabled when loading; spinner SVG when loading.

**Card** (`packages/ui/src/components/card.tsx`): Root `Card` with `variant` (default | elevated | outline | ghost), `hover`; `rounded-xl border bg-white`. Subcomponents: `CardHeader` (px-6 pt-6), `CardTitle` (text-lg font-semibold text-charcoal-900), `CardDescription` (text-sm text-charcoal-500), `CardContent` (px-6 py-4), `CardFooter` (px-6 pb-6). All forwardRef.

###### B. Portal Theme Objects

**Ketchup Admin** (`ketchup-portal/src/styles/theme.ts`): `ketchupAdminTheme = { colors: { primary: '#E53935', secondary: '#1E40AF', background: '#F9FAFB', surface: '#FFFFFF', border: '#E5E7EB', text: { primary, secondary, disabled } }, spacing: { container: '1280px', section: '2rem', card: '1.5rem' }, shadows: { sm, md, lg, xl } }`.

**Government** (`government-portal/src/styles/theme.ts`): `governmentTheme = { colors: { primary: '#1E3A8A', secondary: '#047857', background: '#F0F9FF', surface, border, status: { compliant, warning, nonCompliant, pending } }, typography: { fontFamily: '"Public Sans", "Inter"', sizes: { h1: '2.5rem', h2: '2rem', h3: '1.75rem', body: '1rem', small: '0.875rem' } } }`.

**Agent** (`agent-portal/src/styles/theme.ts`): `agentPortalTheme = { colors: { primary: '#059669', secondary: '#EAB308', background: '#F0FDF4', surface, border, transactions: { cashout, deposit, commission } }, spacing: { mobile: '1rem', tablet: '1.5rem', desktop: '2rem' }, components: { quickAction: { size: '64px', borderRadius: '16px' } } }`.

###### C. Utility Components

**LoadingState** (`packages/ui/src/components/utils/loading-state.tsx`): Props `type?: 'spinner' | 'skeleton' | 'dots'`, `message`, `fullscreen`. Spinner: border-4 primary; dots: three animated circles; skeleton: three bars; container fullscreen when `fullscreen`.

**StatusBadge** (`packages/ui/src/components/utils/status-badge.tsx`): `cva` variants `active` | `inactive` | `pending` | `warning` | `error` | `success` | `info` (green/charcoal/yellow/orange/red/emerald/blue backgrounds), sizes `sm` | `md` | `lg`. Optional dot (mr-2 h-2 w-2 rounded-full) by variant color.

###### D. Design Tokens Export

**designTokens** (`packages/ui/src/tokens/index.js`): `colors.primary` 50–900 (FFEBEE…8B0000), `colors.charcoal` 50–900 (F7FAFC…171923), `colors.functional` (success, warning, error, info); `typography.fonts` (sans, mono), `typography.scale` (xs–5xl); `spacing` 0–32; `borderRadius` none–full; `shadows` (sm, md, lg, xl, 2xl, inner, ketchup). **cssVariables:** reduce designTokens to `--ketchup-{category}-{key}-{subKey}` for theming.

###### E. Usage Example (Dashboard)

Use `DashboardCard` (Card + left border variant, value/change/icon), `DataTable` (columns, keyExtractor, pagination, loading skeleton), `Button`, `StatusBadge`. Stats array: title, value, change, icon, variant. Columns: key, header, cell?, sortable. Layout: dashboard-grid, Alert banner (warning border/background, icon + title + text).

###### F. Performance

**Memoized lists:** `memo()` on row/item components; `useMemo` for derived data; `useCallback` for handlers. **Lazy loading:** `React.lazy(() => import('./Component'))` for route-level components. **Virtual list:** Scroll container with fixed height; compute `startIndex`/`endIndex` from `scrollTop` and `itemHeight`; render only `items.slice(startIndex, endIndex + 1)` in absolutely positioned rows; inner wrapper height = `items.length * itemHeight`.

---

#### Document Control

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial brand guidelines (benchmark: ACT Brand Guidelines 2024). |
| 1.1 | 2025 | Added UI Components section (Section 07), Portals section (Section 08), Implementation section (Section 09). Added Entity Cards, UI Enhancements, and shared component library documentation. |
| 1.2 | 2025 | Added Section 10: Brand Design System (Multi-Portal)—core identity, G2P Professional palette (Tomato Red option), typography, Tailwind config, modular components (Button, Card, DashboardCard, DataTable, Sidebar, Header), portal-specific themes, utility components, CSS variables, responsive system, implementation, design tokens, performance. |

---

**Ketchup SmartPay Brand Guidelines**
*Powering the G2P Economy*

**ketchup.cc** · app.ketchup.cc · portal.ketchup.cc · admin.ketchup.cc · gov.ketchup.cc · agent.ketchup.cc · mobile.ketchup.cc · api.ketchup.cc

---

## 29. Database & API Design (Full Specification)

The **canonical database schema** and **API specifications** for the Ketchup SmartPay ecosystem (Neon PostgreSQL, Drizzle ORM, REST v1, RBAC, pagination, error format) are defined in a separate document:

- **[docs/DATABASE_AND_API_DESIGN.md](docs/DATABASE_AND_API_DESIGN.md)** – Database & API Design

That document includes:

- Full table definitions (core: `users`, `vouchers`, `wallets`, `wallet_transactions`, `transactions`, `proof_of_life_events`, `loans`, `programmes`; portal-specific: `portal_users`, `portal_user_preferences`, `agents`, `agent_float_transactions`, `float_requests`, `pos_terminals`, `assets`, `asset_locations`, `maintenance_logs`, `tasks`, `parcels`, `audit_logs`, `user_sessions`, `ussd_sessions`).
- API design principles (REST, OpenAPI 3.1, HTTPS/mTLS, OAuth2/JWT, RBAC, versioning, pagination, error structure).
- Complete endpoint reference for Auth (login, change-password), Portal (me, user/preferences), Ketchup Portal (beneficiaries, vouchers, agents, terminals, assets, reconciliation, audit, analytics, USSD, dashboard/summary), Government Portal, Agent Portal, and Field Ops Portal.
- Authentication & authorization (JWT, client credentials, mTLS, RBAC).
- Consent management: Out of scope for v1; planned for v2 (Open Banking consent flows). See DATABASE_AND_API_DESIGN.md §5.
- Request/response examples and OpenAPI snippet.

Sections 9 and 10 of this PRD remain the high-level overview; the implementation (Drizzle schema, `/api/v1/*` routes) follows the Database & API Design document.

---

### PRD v1.4 Completion Checklist

Before handing off to development, confirm:

| # | Item | Status |
|---|------|--------|
| 1 | No ambiguous "Future", "To add", "Placeholder", "Optional" (deferral) or "Load from API" left unresolved; deferred items marked "Out of scope for v1" or "Planned for v2". | ✓ |
| 2 | All API endpoints in §10.2 have full request/response and error formats; Profile & Settings endpoints (me, preferences, change-password) and dashboard/summary documented. | ✓ |
| 3 | Database schema §9 includes `portal_user_preferences` and indexes; DATABASE_AND_API_DESIGN.md kept in sync. | ✓ |
| 4 | Profile & Settings integrated: §7.5 summary, docs/PROFILE_AND_SETTINGS.md referenced, session/cookie/redirect and notification preference keys defined. | ✓ |
| 5 | Edge cases §12.1: duplicate appeal workflow, clock skew, float approval flow, advance recovery (multiple advances) specified. | ✓ |
| 6 | Permissions §20 cover all routes including GET /portal/me, change-password, GET/PATCH preferences. | ✓ |
| 7 | Environment variables §17: ENCRYPTION_KEY generation, SENTRY_DSN and NEXT_PUBLIC_SENTRY_DSN documented. | ✓ |
| 8 | Testing §22: per-feature coverage (auth, Profile & Settings, float, duplicate redemptions, advance recovery) and E2E journeys specified. | ✓ |
| 9 | Monitoring §23 (and §23.1 SmartPay Copilot ecosystem observability): key metrics (duplicate rate, float response time, advance recovery rate, API latency, auth failures, LCP) defined; Copilot monitoring via shared backend until portal admin APIs exist. | ✓ |
| 10 | Dashboard and UI code examples use real data fetching (e.g. GET /api/v1/portal/dashboard/summary), LoadingState, ErrorState; no placeholder "—" or "Load from API". | ✓ |

**v1.4 is the single source of truth for MVP development. Development team can begin Phase 1 with confidence.**

---

**Document version:** 1.4.4  
**Last updated:** 2026-03-21  
**Owner:** Ketchup Software Solutions – Product Team  
**Next steps:** Review with stakeholders, finalize API contracts, begin Phase 1.
