# Ketchup Portals

Web portals for the **Ketchup SmartPay** G2P (Government-to-Person) ecosystem: operations, compliance, field management, and agent interfaces. Single Next.js app with route-based separation for four portals. **Ketchup and the Buffr app are connected:** Ketchup issues vouchers to beneficiaries via Buffr (distribution, redemption, reconciliation); set `BUFFR_API_URL` and `BUFFR_API_KEY` when syncing or reconciling with Buffr.

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
| `npm run lint` | Run ESLint. |
| `npm run type-check` | Run TypeScript check (`tsc --noEmit`). |
| `npm run test` | Run Vitest unit tests (utils, validate, env, voucher-service). |
| `npm run e2e` | Run Playwright E2E (login, agent float, field-ops tasks). Starts dev server if not running; set `SKIP_WEBSERVER=1` to use an existing server. |
| `npm run prepare` | Set up Husky git hooks (runs after `npm install`). |
| `npm run cron:sms` | Run SMS queue processor locally (every 2 min + once on start). See [docs/SMS_DESIGN.md](docs/SMS_DESIGN.md). |

## Database & schema

- Schema: `src/db/schema.ts` (aligned with [docs/DATABASE_AND_API_DESIGN.md](docs/DATABASE_AND_API_DESIGN.md)).
- Drizzle config: `drizzle.config.ts` (uses `.env.local`).

```bash
# Generate migrations
npx drizzle-kit generate

# Push schema to DB
npx drizzle-kit push
```

## Documentation

| Document | Description |
|----------|-------------|
| [KETCHUP_PORTALS_PRD.md](KETCHUP_PORTALS_PRD.md) | Product requirements (v1.3). |
| [PRD_IMPLEMENTATION_STATUS.md](PRD_IMPLEMENTATION_STATUS.md) | Implementation status vs PRD. |
| [docs/DATABASE_AND_API_DESIGN.md](docs/DATABASE_AND_API_DESIGN.md) | Database schema and `/api/v1` API spec. |
| [docs/NEON_SETUP.md](docs/NEON_SETUP.md) | Neon + Drizzle setup and connection. |
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
