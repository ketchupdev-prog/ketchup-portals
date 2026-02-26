# Ketchup Portals

Web portals for the **Ketchup SmartPay** G2P (Government-to-Person) ecosystem: operations, compliance, field management, and agent interfaces. Single Next.js app with route-based separation for four portals. **Ketchup and the Buffr app are connected:** Ketchup issues vouchers to beneficiaries via Buffr (distribution, redemption, reconciliation); set `BUFFR_API_URL` and `BUFFR_API_KEY` when syncing or reconciling with Buffr.

**Repository:** [https://github.com/ketchupdev-prog/ketchup-portals](https://github.com/ketchupdev-prog/ketchup-portals)

## Quick start

```bash
npm install
# Create .env or .env.local with DATABASE_URL (Neon Postgres)
npm run db:check          # Verify DB connection
node scripts/apply-0005-0006.mjs   # Optional: apply migrations 0004–0006 if DB is behind
npm run db:seed           # Seed roles, permissions, and portal users
npm run dev               # http://localhost:3000
```

Then open **http://localhost:3000/login** and sign in with a seeded user (see [Portal auth & seed users](#portal-auth--seed-users)).

## Portals & routes

| Portal        | Base path     | Purpose |
|---------------|---------------|---------|
| **Ketchup**   | `/ketchup`    | Operations: beneficiaries, vouchers, agents, reconciliation, compliance, audit, mobile units, network map, USSD viewer |
| **Government**| `/government` | Programme dashboard, unverified beneficiaries, voucher monitoring, reports, config |
| **Agent**     | `/agent`      | Dashboard, float, transactions, parcels, profile (demo `agent_id` until auth) |
| **Field Ops** | `/field-ops`  | Map, assets, tasks, activity, routes, reports |

## Tech stack

- **Next.js 16** (App Router)
- **Neon** (serverless Postgres) + **Drizzle ORM**
- **Tailwind CSS** + **DaisyUI**
- **Leaflet** (maps), **Recharts** (charts), **react-big-calendar** (scheduler)
- **TypeScript**

## Prerequisites

- Node.js 18+
- Neon (or any Postgres) for `DATABASE_URL`

## Setup

```bash
# Install dependencies
npm install

# Copy env (create .env.local with required vars)
# DATABASE_URL is required for API routes and build
```

## Environment variables

Required and optional env vars are validated at runtime via `src/lib/env.ts` (Zod). Validation runs on first database access; missing required vars (e.g. `DATABASE_URL`) cause a clear error. See PRD §17 for full list.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (for API/build) | Neon Postgres connection string. See [docs/NEON_SETUP.md](docs/NEON_SETUP.md). |
| `BUFFR_API_URL` | No | Buffr app API base URL (e.g. `https://pay.buffr.ai`) – for voucher sync/reconciliation with Buffr. |
| `BUFFR_API_KEY` | No | Buffr API key (when using Buffr integration). |
| `SMS_API_URL` | No | SMS gateway endpoint (for reminders, bulk SMS). |
| `SMS_API_KEY` | No | SMS gateway API key. |
| `SMS_WEBHOOK_SECRET` | No | Verify delivery/inbound webhooks. |
| `CRON_SECRET` | No | Secure POST `/api/v1/sms/process` (Vercel cron or local script). |
| `BASE_URL` | No | For local cron script (default `http://localhost:3000`). |
| `NEXT_PUBLIC_REQUIRE_AUTH` | No | If `true`, redirect unauthenticated users to `/login`. |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (default [http://localhost:3000](http://localhost:3000)). |
| `npm run build` | Production build (needs `DATABASE_URL` in env for API routes). |
| `npm run start` | Start production server. |
| `npm run db:check` | Verify database connection (reads from `DATABASE_URL`). |
| `npm run db:migrate` | Run Drizzle migrations (`drizzle-kit migrate`). |
| `npm run db:seed` | Seed roles, permissions, and portal users (see [Portal auth & seed users](#portal-auth--seed-users)). |
| `npm run db:push` | Push schema to DB (`drizzle-kit push`). |
| `npm run db:generate` | Generate migrations from schema (`drizzle-kit generate`). |
| `npm run lint` | Run ESLint. |
| `npm run type-check` | Run TypeScript check (`tsc --noEmit`). |
| `npm run test` | Run Vitest unit tests (utils, validate, env, voucher-service). |
| `npm run e2e` | Run Playwright E2E (login, agent float, field-ops tasks). Starts dev server if not running; set `SKIP_WEBSERVER=1` to use an existing server. |
| `npm run prepare` | Set up Husky git hooks (runs after `npm install`). |
| `npm run cron:sms` | Run SMS queue processor locally (every 2 min + once on start). See [docs/SMS_DESIGN.md](docs/SMS_DESIGN.md). |

## Database & schema

- Schema: `src/db/schema.ts` (aligned with [docs/DATABASE_AND_API_DESIGN.md](docs/DATABASE_AND_API_DESIGN.md)).
- Drizzle config: `drizzle.config.ts` (uses `.env.local`).
- Migrations: `drizzle/` (e.g. `0004_audit_prd_float_preferences_indexes.sql`, `0005_roles_permissions.sql`, `0006_canonical_redemption_ref.sql`). If the DB is behind the journal, run `node scripts/apply-0005-0006.mjs` to apply 0004–0006 manually.

```bash
# Generate migrations from schema
npm run db:generate

# Run migrations (standard)
npm run db:migrate

# Or push schema directly (dev)
npm run db:push
```

## Portal auth & seed users

- **Auth:** Portal uses cookie-based session. `POST /api/v1/auth/login` (email + password) sets a `portal-auth` cookie; protected APIs (e.g. `GET /api/v1/portal/dashboard/summary`) require this cookie or `Authorization: Bearer <token>`. See [docs/NEON_AUTH_SETUP.md](docs/NEON_AUTH_SETUP.md) and [docs/SECURITY.md](docs/SECURITY.md).
- **RBAC:** Roles and permissions are in DB; APIs use `requirePermission` (e.g. `dashboard.summary` for Ketchup dashboard). Admin APIs: `GET/PUT /api/v1/admin/roles`, `GET/PUT /api/v1/admin/roles/:id`, `GET /api/v1/admin/permissions`, `GET /api/v1/admin/users`, `PATCH /api/v1/admin/users/:id`.
- **Seed users:** After `npm run db:seed`, you can sign in at `/login` with any of the seeded portal users. **Password for all:** `TestPassword1!`

| Email | Role |
|-------|------|
| seed-ketchup_ops@test.ketchup.local | Ketchup ops (full Ketchup dashboard access) |
| seed-ketchup_finance@test.ketchup.local | Ketchup finance |
| seed-ketchup_compliance@test.ketchup.local | Ketchup compliance |
| seed-gov_manager@test.ketchup.local | Government manager |
| seed-agent@test.ketchup.local | Agent |
| seed-field_tech@test.ketchup.local | Field tech |
| seed-field_lead@test.ketchup.local | Field lead |

If you open a protected page (e.g. `/ketchup/dashboard`) without being logged in, the app redirects to `/login?redirect=...` and returns you to the page after sign-in.

## Documentation

| Document | Description |
|----------|-------------|
| [KETCHUP_PORTALS_PRD.md](KETCHUP_PORTALS_PRD.md) | Product requirements (v1.4). |
| [docs/PRD_AUDIT_REPORT_v1.4.1.md](docs/PRD_AUDIT_REPORT_v1.4.1.md) | PRD audit report and validation checklist. |
| [PRD_IMPLEMENTATION_STATUS.md](PRD_IMPLEMENTATION_STATUS.md) | Implementation status vs PRD. |
| [WHATS_LEFT_TO_IMPLEMENT.md](WHATS_LEFT_TO_IMPLEMENT.md) | Short “what’s left” checklist. |
| [docs/DATABASE_AND_API_DESIGN.md](docs/DATABASE_AND_API_DESIGN.md) | Database schema and `/api/v1` API spec. |
| [docs/DATES.md](docs/DATES.md) | Date handling: storage, API format, UI display, date-fns. |
| [docs/NEON_SETUP.md](docs/NEON_SETUP.md) | Neon + Drizzle setup and connection. |
| [docs/NEON_AUTH_SETUP.md](docs/NEON_AUTH_SETUP.md) | Portal auth (cookie/Bearer) and Neon. |
| [docs/SMS_DESIGN.md](docs/SMS_DESIGN.md) | SMS queue, cron, webhooks, env vars. |
| [docs/SECURITY.md](docs/SECURITY.md) | Security: validation, logging, auth, rate limiting, CORS. |
| [docs/NEON_DRIZZLE_NEXTJS_SETUP.md](docs/NEON_DRIZZLE_NEXTJS_SETUP.md) | Neon + Drizzle + Next.js: connection, migrations, .sql workflow. |
| [COMPONENT_INVENTORY.md](COMPONENT_INVENTORY.md) | UI component inventory. |

## Deploy (Vercel)

1. Connect the repo to Vercel.
2. Set `DATABASE_URL` (and optional SMS/CRON vars) in project environment variables.
3. Deploy; Vercel cron runs `POST /api/v1/sms/process` every 5 minutes when `CRON_SECRET` is set (see [vercel.json](vercel.json) and [docs/SMS_DESIGN.md](docs/SMS_DESIGN.md)).

## License

Private – Ketchup Software Solutions.
