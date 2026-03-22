# Ketchup Portals

Web portals for the **Ketchup SmartPay** G2P (Government-to-Person) ecosystem: operations, compliance, field management, and agent interfaces. This Next.js app is the **SmartPay operator portal suite** (Ketchup admin/ops, government, agent, and field ops) in a single codebase with route-based separation. **Ketchup and the Buffr app are connected:** Ketchup issues vouchers to beneficiaries via Buffr (distribution, redemption, reconciliation); set `BUFFR_API_URL` and `BUFFR_API_KEY` when syncing or reconciling with the **SmartPay / Buffr Connect** backend API.

**SmartPay Copilot** is the ecosystem’s AI assistant for beneficiaries (wallet help, programme guidance, conversational support) and runs against the **shared SmartPay backend and AI services**, not inside this portal codebase. Ketchup Portals does **not** ship a dedicated Copilot analytics screen in v1; operations and compliance teams should treat Copilot as an ecosystem component and monitor it via the **same backend observability stack** (e.g. AI service logs, Langfuse or equivalent traces) until admin/Copilot metrics are exposed through portal APIs or dashboards. See [KETCHUP_PORTALS_PRD.md](KETCHUP_PORTALS_PRD.md) §23 and [PLANNING.md](PLANNING.md) (integration strategy).

**Repository:** [https://github.com/ketchupdev-prog/ketchup-portals](https://github.com/ketchupdev-prog/ketchup-portals)

**Recommended domains:** Portal app → `portal.ketchup.cc`; per-portal subdomains → `admin.ketchup.cc` (Ketchup), `gov.ketchup.cc` (Government), `agent.ketchup.cc` (Agent), `mobile.ketchup.cc` (Field Ops, if assigned to this app); backend API → `api.ketchup.cc`; beneficiary app → `app.ketchup.cc`. **Canonical operational detail (DNS, redirects, Vercel matrix, env alignment):** [docs/DNS_AND_REDIRECTS.md](docs/DNS_AND_REDIRECTS.md). Summary table: [docs/DOMAIN_AND_ENV_RECOMMENDATIONS.md](docs/DOMAIN_AND_ENV_RECOMMENDATIONS.md).

## Related workspaces (same parent folder)

When checked out next to **Buffr Connect** and **SmartPay** (e.g. under `ai-agent-mastery-main/`):

| Workspace | Path | Role |
|-----------|------|------|
| **Buffr Connect** | [`../../buffr-connect/`](../../buffr-connect/) | Open banking portal & APIs; local API often `http://localhost:3000` — align `BUFFR_API_URL` / keys with your integration |
| **SmartPay (fintech)** | [`../../fintech/`](../../fintech/) | E-money mobile + Node/Python backends; Copilot and wallet flows |
| **Ecosystem status (2026-03-22)** | [`../../COMPLETE_ECOSYSTEM_STATUS_2026-03-22.md`](../../COMPLETE_ECOSYSTEM_STATUS_2026-03-22.md) | Three-system readiness, migrations, deployment order, financial reconciliation (George Nekwaya) |

**Last reviewed:** 2026-03-22

### Documentation (this package)

| Doc | Use for |
|-----|---------|
| [docs/DNS_AND_REDIRECTS.md](docs/DNS_AND_REDIRECTS.md) | **SSOT:** DNS, TLS, Vercel matrix, redirects, cross-repo env |
| [docs/DOMAIN_AND_ENV_RECOMMENDATIONS.md](docs/DOMAIN_AND_ENV_RECOMMENDATIONS.md) | Env variable / hostname table |
| [docs/README.md](docs/README.md) | Full technical doc index |
| [docs/ADMIN_AND_API_REFERENCE.md](docs/ADMIN_AND_API_REFERENCE.md) | Admin dashboards + links to API / realtime guides |
| [KETCHUP_PORTALS_PRD.md](KETCHUP_PORTALS_PRD.md) | Product requirements |
| [TASK.md](TASK.md) · [PLANNING.md](PLANNING.md) | Tasks & strategy |

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
| **Ketchup**   | `/ketchup`    | Operations: beneficiaries, vouchers, agents, reconciliation, compliance, audit, mobile units, network map, USSD viewer (SmartPay Copilot is beneficiary-facing; see intro) |
| **Government**| `/government` | Programme dashboard, unverified beneficiaries, voucher monitoring, reports, config |
| **Agent**     | `/agent`      | Dashboard, float, transactions, parcels, profile (demo `agent_id` until auth) |
| **Field Ops** | `/field-ops`  | Map, assets, tasks, activity, routes, reports |

## API URLs and versioning

- **Canonical public prefix for business APIs:** `/api/v1/...` (handlers in `src/app/api/v1/...`).
- **Operational routes** (`/api/health/*`, `/api/cron/*`) live under `src/app/api/health` and `src/app/api/cron`. In `next.config.ts`, **afterFiles** rewrites expose the same handlers at **`/api/v1/health/*`** and **`/api/v1/cron/*`** when no matching file exists under `api/v1`—so monitors and clients can standardise on `/api/v1` for probes while unversioned `/api/health` remains valid (see [vercel.json](vercel.json) cache headers on `/api/health/*`).
- **Neon Auth** is separate: **`/api/auth/*`** (catch-all) must not be confused with **`/api/v1/auth/login`** (portal `portal_users` session). See [docs/NEON_AUTH_SETUP.md](docs/NEON_AUTH_SETUP.md).

## Tech stack

- **Next.js 16** (App Router)
- **Neon** (serverless Postgres) + **Drizzle ORM**
- **Supabase Auth** (centralized authentication, shared with Buffr Connect)
- **Tailwind CSS** + **DaisyUI**
- **Leaflet** (maps), **Recharts** (charts), **react-big-calendar** (scheduler)
- **TypeScript**

## 🔐 Supabase Auth Integration

Ketchup Portals now uses **Supabase Auth** for centralized authentication, shared with Buffr Connect. This enables single sign-on across beneficiaries, operators, and bank users.

**Quick setup:**
1. Copy Supabase credentials from `buffr-connect/buffrconnect/.env.local` to your `.env.local`
2. Run database migration: `npm run db:push`
3. Set `NEXT_PUBLIC_REQUIRE_AUTH=true` to enable auth protection

**Documentation:** [docs/SUPABASE_AUTH_INTEGRATION.md](docs/SUPABASE_AUTH_INTEGRATION.md)

**Key features:**
- ✅ Shared Supabase project (ID: `cjmtcxfpwjbpbctjseex`)
- ✅ JWT-based session management via cookies
- ✅ Integration with Buffr Connect SDK for Open Banking
- ✅ Webhook handling for consent and transaction events
- ✅ Affordability checks before voucher issuance

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

Required and optional env vars are validated at runtime via `src/lib/env.ts` (Zod). Set variables in `.env` or `.env.local`; see [DOMAIN_AND_ENV_RECOMMENDATIONS.md](docs/DOMAIN_AND_ENV_RECOMMENDATIONS.md) for production values. Missing required vars (e.g. `DATABASE_URL`) cause a clear error. See PRD §17 for full list.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (for API/build) | Neon Postgres connection string. See [docs/NEON_SETUP.md](docs/NEON_SETUP.md). |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL (shared with Buffr Connect). Copy from `buffr-connect/buffrconnect/.env.local`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anon (public) key. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Yes** | Supabase publishable key (new format). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase service role (server-only, never expose in client). |
| `SUPABASE_AUTH_URL` | **Yes** | Supabase auth endpoint (e.g. `https://<project>.supabase.co/auth/v1`). |
| `BUFFR_API_URL` | **Yes** | Buffr Connect API base for Open Banking integration (e.g. `http://localhost:3000/api` or `https://api.ketchup.cc`). |
| `BUFFR_API_KEY` | **Yes** | Buffr API key for authenticating with Buffr Connect. |
| `BUFFR_WEBHOOK_SECRET` | **Yes** | Webhook signature verification secret (must match Buffr Connect config). |
| `NEXT_PUBLIC_PORTAL_URL` | No | Public URL of this app (password-reset links, emails); e.g. `https://portal.ketchup.cc`. |
| `NEON_AUTH_BASE_URL` | No | Neon Auth API base (server). See [NEON_AUTH_SETUP.md](docs/NEON_AUTH_SETUP.md). |
| `NEXT_PUBLIC_NEON_AUTH_URL` | No | Neon Auth URL for client-side (same value as above). |
| `NEON_AUTH_COOKIE_SECRET` | No | Cookie signing secret for Neon Auth (≥32 chars when set). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SECURE` | No | Transactional email (password reset, etc.). |
| `SMS_API_URL` | No | SMS gateway endpoint (for reminders, bulk SMS). |
| `SMS_API_KEY` | No | SMS gateway API key. |
| `SMS_WEBHOOK_SECRET` | No | Verify delivery/inbound webhooks. |
| `CRON_SECRET` | No | Bearer secret for `POST /api/v1/sms/process` (Vercel cron or local script). |
| `SMS_CRON_SECRET` | No | Alias accepted by env validation if `CRON_SECRET` is unset. |
| `BASE_URL` | No | For local cron script (default `http://localhost:3000`). |
| `NEXT_PUBLIC_REQUIRE_AUTH` | No | If `true`, redirect unauthenticated users to `/login` when no `portal-auth` / `sb-auth-token` cookie. |

\*Supabase vars are optional; use the same project as Buffr Connect when aligning identity. See `.env.example`.

Set variables in `.env` or `.env.local`; copy from `.env.example` for names and comments.

## Contact

**Support / general:** `ichigo@ketchup.cc`

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

- **Auth:** `POST /api/v1/auth/login` (email + password) validates `portal_users` and sets the **`portal-auth`** HTTP-only cookie. Protected APIs use `getPortalSession` / **`requirePermission`** and accept that cookie or **`Authorization: Bearer <token>`** for the same session. Optional **Neon Auth** lives under **`/api/auth/*`** (see [docs/NEON_AUTH_SETUP.md](docs/NEON_AUTH_SETUP.md)). Middleware may also accept a Supabase session cookie (**`sb-auth-token`**) when integrating with Buffr Connect—see `src/middleware.ts`.
- **RBAC:** Roles and permissions are in the database; route handlers call `requirePermission` (e.g. `dashboard.summary` for the Ketchup dashboard). Admin APIs include `GET/PUT /api/v1/admin/roles`, `GET/PUT /api/v1/admin/roles/:id`, `GET /api/v1/admin/permissions`, `GET /api/v1/admin/users`, `PATCH /api/v1/admin/users/:id`.
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
| [docs/README.md](docs/README.md) | Full documentation index. |
| [TASK.md](TASK.md) | Current tasks and checklist vs PRD. |
| [PLANNING.md](PLANNING.md) | Architecture and planning notes. |
| [KETCHUP_PORTALS_PRD.md](KETCHUP_PORTALS_PRD.md) | Product requirements (v1.4.4). |
| [docs/PRD_AUDIT_REPORT_v1.4.1.md](docs/PRD_AUDIT_REPORT_v1.4.1.md) | PRD audit report and validation checklist. |
| [docs/DATABASE_AND_API_DESIGN.md](docs/DATABASE_AND_API_DESIGN.md) | Database schema and `/api/v1` API spec (routing/versioning notes). |
| [docs/DATES.md](docs/DATES.md) | Date handling: storage, API format, UI display, date-fns. |
| [docs/NEON_SETUP.md](docs/NEON_SETUP.md) | Neon + Drizzle setup and connection. |
| [docs/NEON_AUTH_SETUP.md](docs/NEON_AUTH_SETUP.md) | Neon Auth (`/api/auth/*`) vs portal login (`/api/v1/auth/login`). |
| [docs/SMS_DESIGN.md](docs/SMS_DESIGN.md) | SMS queue, cron, webhooks, env vars. |
| [docs/SECURITY.md](docs/SECURITY.md) | Security: validation, logging, auth, rate limiting, CORS. |
| [docs/NEON_DRIZZLE_NEXTJS_SETUP.md](docs/NEON_DRIZZLE_NEXTJS_SETUP.md) | Neon + Drizzle + Next.js: connection, migrations, .sql workflow. |
| [docs/architecture/COMPONENT_INVENTORY.md](docs/architecture/COMPONENT_INVENTORY.md) | UI component inventory. |
| [docs/archive/README.md](docs/archive/README.md) | Archived completion and exploration reports. |

## Docker & CI/CD

**Docker (standalone Next.js image):**

```bash
docker build -t ketchup-portals .
docker run -p 3000:3000 --env-file .env ketchup-portals
```

Or with Compose: `docker compose up -d` (uses `.env` by default). For production build with real env, use `docker build --build-arg DATABASE_URL=... -t ketchup-portals .`. To use your domains (portal.ketchup.cc, admin, gov, agent) with Docker, put a reverse proxy in front and preserve the Host header; see [docs/DOCKER_AND_DOMAINS.md](docs/DOCKER_AND_DOMAINS.md).

**CI/CD (GitHub Actions):**

- **`.github/workflows/ci.yml`** – On every push/PR to `main`: lint, type-check, unit tests, and `next build`. Uses dummy env vars for the build step (see workflow file).
- **`.github/workflows/docker.yml`** – On push to `main`: build and push the image to GitHub Container Registry as `ghcr.io/<owner>/ketchup-portals:latest` and `:<sha>`.

Set `DATABASE_URL` and other runtime env when running the container (e.g. `--env-file .env` or your host’s env).

## Deploy (Vercel)

1. Connect the repo to Vercel (or use `vercel link` and `vercel --prod` from the repo root).
2. Set env vars in the project: `DATABASE_URL`, `NEXT_PUBLIC_PORTAL_URL` (e.g. `https://portal.ketchup.cc`), Supabase (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`) if used, Neon Auth, SMTP, `BUFFR_API_URL`/`BUFFR_API_KEY`, and optional SMS/CRON vars. See [docs/VERCEL_CLEANUP_AND_DEPLOY.md](docs/VERCEL_CLEANUP_AND_DEPLOY.md).
3. Add domains in Vercel: **portal.ketchup.cc** (primary), and optionally **admin.ketchup.cc**, **gov.ketchup.cc**, **agent.ketchup.cc** (and **mobile.ketchup.cc** if assigned to this project). Middleware redirects each subdomain’s `/` to the matching portal. See [docs/DNS_AND_REDIRECTS.md](docs/DNS_AND_REDIRECTS.md).
4. Deploy; Vercel crons: `POST /api/v1/sms/process` every 5 minutes when `CRON_SECRET` or `SMS_CRON_SECRET` is set, and daily `/api/cron/cleanup-reset-tokens` (also reachable as `/api/v1/cron/cleanup-reset-tokens` via rewrite). See [vercel.json](vercel.json) and [docs/SMS_DESIGN.md](docs/SMS_DESIGN.md).

## License

Private – Ketchup Software Solutions.

---

**Last updated:** 2026-03-22
