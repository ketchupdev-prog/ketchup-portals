# DNS & Redirects for Ketchup Portals

**Status:** **Canonical / most current** — This file is the **single source of truth** for Ketchup Portals **DNS**, **TLS/Vercel assignment**, **redirect and login URL behaviour**, **per-bank `*.ketchup.cc` AIS/OAuth sites**, **cutover order**, and **cross-repo env alignment** (Buffr Connect, SmartPay `fintech/`). If [DOMAIN_AND_ENV_RECOMMENDATIONS.md](./DOMAIN_AND_ENV_RECOMMENDATIONS.md), [KETCHUP_PORTALS_PRD.md](../KETCHUP_PORTALS_PRD.md) §18, or Buffr docs disagree on these topics, **prefer this document** and update the others to match.

**Last updated:** 2026-03-22 (aligned Vercel matrix, health/status probe URLs, and `BUFFR_API_URL` wording with [buffr-ais-platform IMPLEMENTATION_ROADMAP.md](../../../buffr-connect/buffr-ais-platform/IMPLEMENTATION_ROADMAP.md#dns-tls-redirects-and-cross-repo-alignment)). **Doc index:** [docs/README.md](./README.md) (all portal technical docs; redundant root completion reports removed March 2026).

---

**Quick reference (domains):** See [DOMAIN_AND_ENV_RECOMMENDATIONS.md](./DOMAIN_AND_ENV_RECOMMENDATIONS.md) for a compact table: **app.ketchup.cc** (beneficiary app), **portal.ketchup.cc** (portals), **admin.ketchup.cc** (optional portal alias / internal admin entry → same app as portals), **api.ketchup.cc** (recommended public API / `BUFFR_API_URL` target).

**Canonical API hostname:** Use **`https://api.ketchup.cc`** for **`BUFFR_API_URL`**, SmartPay mobile/backend bases, and portal→API calls unless your runbook explicitly standardises on another gateway. The deployment matrix below may list **`backend.ketchup.cc`** as a *service/backplane* host for an API deployment—treat it as an **optional alias or split**; keep **one** public API base per environment in env files to avoid split-brain callbacks and webhooks.

**Related (cross-repo):**

- **Buffr Connect PRD — ecosystem hostname alignment:** [PRD.md §7.4.1](../../../buffr-connect/buffrconnect/PRD.md) (v5 `*.buffr.ai` vs Ketchup `*.ketchup.cc`, `BUFFR_CONNECT_URL` / simulators)
- **Buffr Connect — Vercel domain map (`*.buffr.ai`):** [vercel-domains.md](../../../buffr-connect/buffrconnect/docs/integration/vercel-domains.md)
- **SmartPay Mobile — OBS/OAuth flows** (routes, `buffr://oauth-callback`, services, env): [SMARTPAY_MOBILE_FLOWS_AND_STATE.md](../../../fintech/apps/smartpay-mobile/SMARTPAY_MOBILE_FLOWS_AND_STATE.md) §14 *Banking & Open Banking*
- **Buffr Connect — OAuth / AIS (PKCE, `/api/v1`, simulators):** [OAUTH_QUICK_START.md](../../../buffr-connect/buffrconnect/docs/guides/OAUTH_QUICK_START.md)
- **AIS platform — DNS/TLS/cutover mirror + API segments (`status`, `metrics`, `providers`, `openapi`, `docs`):** [IMPLEMENTATION_ROADMAP.md § DNS, TLS, redirects](../../../buffr-connect/buffr-ais-platform/IMPLEMENTATION_ROADMAP.md#dns-tls-redirects-and-cross-repo-alignment)

**Regulatory context (no repo link):** **Namibia Open Banking Standards v1.0** (2025) defines scheme-level expectations (TPP ↔ data provider, consent, SCA, registered redirect URIs). Use the **official** standard / compliance-controlled copies for audits — do not treat informal markdown exports in the repo as authoritative.

**Architecture note:** Separate hostnames per bank AIS/OAuth site (`fnb|bwk|nedbank|sbn.ketchup.cc`) support **data-provider isolation**, **per-bank TLS identity**, and **tight redirect-uri allowlists**. This doc covers **DNS, redirects, and env** only.

---

Per-portal auth URLs and optional DNS/subdomain setup so each portal can have its own sign-in URL (e.g. for subdomains or separate domains).

## Per-portal auth URLs

Each portal has its own login and forgot-password pages:

| Portal      | Login              | Forgot password              |
|------------|---------------------|------------------------------|
| Ketchup    | `/ketchup/login`    | `/ketchup/forgot-password`   |
| Government | `/government/login` | `/government/forgot-password` |
| Agent      | `/agent/login`      | `/agent/forgot-password`     |
| Field Ops  | `/field-ops/login`  | `/field-ops/forgot-password` |

- **Redirect param:** `?redirect=/ketchup/dashboard` (or any path) sends the user back after sign-in.
- **Forgot password:** `?returnTo=/ketchup/dashboard` (or `redirect`) is used as the post-reset destination.
- **Config:** `src/lib/portal-auth-config.ts` defines `PORTAL_AUTH`, `getPortalFromPath()`, `getPortalLoginPath()`, `getPortalForgotPasswordPath()`.

## Global `/login` and `/forgot-password`

- **`/login`** – If `?redirect=` points to a portal path (e.g. `/ketchup/dashboard`), the app redirects to that portal’s login (e.g. `/ketchup/login?redirect=...`). Otherwise it shows Agent portal login.
- **`/forgot-password`** – Same idea: redirect to the portal’s forgot-password page when `returnTo`/`redirect` matches a portal path.

So linking to `/login?redirect=/ketchup/dashboard` still works and will redirect to `/ketchup/login?redirect=/ketchup/dashboard`.

## 401 redirects

When a user is unauthenticated (e.g. session expired):

- **Portal layout** and **portal-fetch** infer the portal from the current pathname and redirect to that portal’s login, e.g. `/ketchup/dashboard` → `/ketchup/login?redirect=/ketchup/dashboard`.

## DNS / subdomain setup (recommended)

The portal app remains deployed at **portal.ketchup.cc** (optionally `admin.ketchup.cc` for short admin entry URLs).  
Bank domains are separate AIS/OAuth websites and are **not** tenant aliases of `ketchup-portals`.

1. **Domain architecture (separate concerns):**  
   - **Bank AIS/OAuth websites (separate apps + separate Neon DBs):**
     - `fnb.ketchup.cc`
     - `bwk.ketchup.cc`
     - `nedbank.ketchup.cc`
     - `sbn.ketchup.cc`
   - **Shared platform hosts:**
     - `portal.ketchup.cc` (portal app)
     - `app.ketchup.cc` (core app/mobile entry)
     - **`api.ketchup.cc` (recommended public API / `BUFFR_API_URL` target)**
     - `backend.ketchup.cc` (optional: alternate or internal API hostname if you split services)
     - `ai.ketchup.cc` (AI / inference service)
     - optional `admin.ketchup.cc`, `ops.ketchup.cc`

2. **Vercel + DNS model:**  
   - Point each subdomain CNAME to its Vercel target (`came.vercel-dns.com` or project-specific generated target).
   - Vercel provisions TLS automatically once DNS is correct.
   - Bank sites should use dedicated Vercel projects (or clearly isolated deployments) because each bank has its own data and OAuth/AIS configuration.

3. **Portal middleware host mapping (portal-only aliases):**

   ```ts
   const PORTAL_HOSTS: Record<string, string> = {
     'admin.ketchup.cc': '/ketchup',
     'gov.ketchup.cc': '/government',
     'agent.ketchup.cc': '/agent',
     'mobile.ketchup.cc': '/field-ops',
   };
   // If request host matches and path is /, redirect to mapped portal root.
   // Unknown hosts should return safe tenant-not-found (404) response.
   ```

4. **Routing policy:**  
   - For portal hostnames, reject unknown hosts with a safe `404` tenant-not-found response.
   - For bank AIS/OAuth sites, map hostname to the correct bank deployment/config and isolated DB.
   - Keep API versioning canonical at **`/api/v1/*`** across all service hostnames (do not couple versioning to domain). On **Buffr AIS platform** (and aligned backends), operators typically probe **`GET /api/v1/health`** (optional `?ready=1`), **`GET /api/v1/status`**, **`GET /api/v1/metrics`** (prod: secure), discovery **`GET /api/v1/providers`**, and docs **`/api/v1/docs`** with spec **`/api/v1/openapi`**.

## Summary

- Use per-portal auth URLs (`/ketchup/login`, etc.) and preserve `redirect`/`returnTo`.
- Keep bank AIS/OAuth websites separate from the portals app (separate deploys and DBs).
- Keep `/api/v1/*` as canonical on every host.
- Store bank-specific secrets per project/environment; only share team-level secrets when truly shared.

## Recommended Vercel assignment

Use this as the deployment matrix:

| Domain | Suggested Vercel project | Notes |
|---|---|---|
| `fnb.ketchup.cc` | `fnb-ais-site` (example) | Dedicated FNB AIS/OAuth website + dedicated Neon DB |
| `bwk.ketchup.cc` | `bwk-ais-site` (example) | Dedicated BWK AIS/OAuth website + dedicated Neon DB |
| `nedbank.ketchup.cc` | `nedbank-ais-site` (example) | Dedicated Nedbank AIS/OAuth website + dedicated Neon DB |
| `sbn.ketchup.cc` | `sbn-ais-site` (example) | Dedicated SBN AIS/OAuth website + dedicated Neon DB |
| `portal.ketchup.cc` | `ketchup-portals` | Portals app (ketchup/government/agent/field-ops routes) |
| `app.ketchup.cc` | `ketchup-app` | Core app / mobile entry host |
| **`api.ketchup.cc`** | `ketchup-api` or `ketchup-backend` (example) | **Recommended** public API / platform backend base for **`BUFFR_API_URL`** and portal→API calls; canonical paths **`/api/v1/*`** |
| `backend.ketchup.cc` | e.g. `ketchup-backend-internal` (optional) | **Optional** alternate or internal API hostname if you split services — do **not** treat as the primary public base alongside `api.ketchup.cc` in the same environment (avoid split-brain callbacks/webhooks) |
| `ai.ketchup.cc` | `ketchup-ai` | AI / inference service (separate concern) |
| `admin.ketchup.cc` | `ketchup-portals` or dedicated (optional) | Optional portal alias (`/ketchup`) or internal admin entry — same codebase as portals when aliased |
| `ops.ketchup.cc` | `ketchup-ops` (optional) | Internal ops host |

Bank websites should not be routed through `ketchup-portals` middleware.
Use separate deployments/projects for each bank site.

## Bank AIS/OAuth site — environment template (per bank)

Each bank hostname (`fnb`, `bwk`, `nedbank`, `sbn`) is its **own** Vercel project with its **own** Neon database and secrets. Copy this checklist into that project’s Vercel env (and a local `.env.example` in the bank-site repo). **Do not** reuse another bank’s `DATABASE_URL` or OAuth secrets.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Neon Postgres for this bank only (`?sslmode=require`). Used for scraped AIS data, consent, tokens, audit. |
| `BANK_CODE` | Yes | Stable tenant key: `fnb` \| `bwk` \| `nedbank` \| `sbn` (logging, multi-tenant guardrails, config). |
| `PUBLIC_SITE_URL` | Yes | Canonical **server-side** origin of this bank deploy, e.g. `https://fnb.ketchup.cc` (use whatever name your app reads in `process.env`; some repos alias this as `BASE_URL`). |
| `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_APP_URL` | If client needs origin | Public origin for browser code and OAuth return URLs. **Buffr Connect** uses `NEXT_PUBLIC_APP_URL` + `OAUTH_REDIRECT_URI` (see alignment below). |
| `OAUTH_ISSUER` / `AUTH_SERVER_URL` | As implemented | Base URL of **this** bank’s authorization server (if the site acts as AS). Must match metadata you register with TPPs. |
| `OAUTH_CLIENT_ID` / `OAUTH_CLIENT_SECRET` | If bank registers TPP clients | Server-side client credentials for machine-to-machine or admin flows; **never** expose secret to the browser. |
| `OAUTH_REDIRECT_URI_ALLOWLIST` | Yes (prod) | Comma-separated allowed `redirect_uri` values for authorization-code flow (TPP / Buffr Connect / SmartPay callbacks). |
| `SESSION_SECRET` or `JWT_SECRET` | Yes | Sign cookies or JWTs for end-user sessions on the bank site (use a long random value per bank). |
| `CORS_ALLOWED_ORIGINS` | If APIs are browser-called | Origins allowed to call this bank’s APIs (e.g. `https://portal.ketchup.cc`, `https://app.ketchup.cc`). Tighten in production. |
| `TPP_WEBHOOK_SECRET` | Optional | HMAC or shared secret for outbound webhooks to platform backends. |
| `LOG_LEVEL` | Optional | e.g. `info` in prod, `debug` only in non-prod. |

**Redirect URI examples** (adjust to your actual routes; register exactly in AS + TPP config):

- User auth callback: `https://<bank>.ketchup.cc/api/v1/oauth/callback` (or your app’s canonical callback path).
- TPP / Buffr Connect: must match what Buffr Connect registers for this bank AS (often a single HTTPS callback per environment).

**Smoke checks per bank deploy**

1. `GET https://<bank>.ketchup.cc/api/v1/health` → `200` (readiness: `.../api/v1/health?ready=1` if your stack implements strict mode).
2. DB: run a trivial query or migration status against **that** Neon project only.
3. OAuth: authorize once with a test TPP client; confirm tokens stored in **that** bank’s DB.
4. AIS: hit one read-only account endpoint with a valid consent token; confirm no cross-bank data.

See also [DOMAIN_AND_ENV_RECOMMENDATIONS.md](./DOMAIN_AND_ENV_RECOMMENDATIONS.md) for broader platform URLs.

### Alignment with this monorepo (names, not values)

Use the same **values** as your production domains, but keep the **variable names** each app already expects. **Full cross-repo dictionary:** [DOMAIN_AND_ENV_RECOMMENDATIONS.md](./DOMAIN_AND_ENV_RECOMMENDATIONS.md#cross-repo-environment-variable-dictionary).

| Area | File / app | Variables to set for prod |
|------|------------|---------------------------|
| Buffr Connect portal | `buffr-connect/buffrconnect/.env.local.example` | `OAUTH_REDIRECT_URI` (must match Supabase **Redirect URLs**), `NEXT_PUBLIC_APP_URL`, simulator URLs `FNB_NAMIBIA_URL`, `STANDARD_BANK_URL`, `BANK_WINDHOEK_URL`, `NEDBANK_NAMIBIA_URL` (or commented `BANK_SIMULATOR_*` overrides), **`WEBHOOK_SECRET`** (outbound webhook signing from Buffr), per-bank `*_OAUTH_CLIENT_ID` as needed |
| Buffr AIS platform | `buffr-connect/buffr-ais-platform/.env.example` | Same Supabase project as Connect when sharing identity; `NEXT_PUBLIC_APP_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `REDIS_URL`; optional simulator URLs for `resolveBankAdapter()`; `METRICS_BEARER_TOKEN` in prod |
| Bank Windhoek simulator | `buffr-connect/banks/bank-windhoek/.env.example` | `AIS_PLATFORM_CALLBACK_URL` (platform return URL after consent) |
| SmartPay backend | `fintech/apps/smartpay-backend/.env.example` | **`BUFFR_CONNECT_URL`** = Connect **origin** only (no `/api`); **`BUFFR_API_URL`** = single public API base for the environment — production target **`https://api.ketchup.cc`** (or `https://api.ketchup.cc/api` only if your gateway expects that shape); must match how `BuffrClient` appends paths; **`BUFFR_WEBHOOK_SECRET`** must match verifier; optional `OPEN_BANKING_*` for live AIS |
| SmartPay mobile | `fintech/apps/smartpay-mobile/.env.example` | `EXPO_PUBLIC_API_BASE_URL` → SmartPay backend; `EXPO_PUBLIC_BUFFR_CONNECT_URL` → Buffr Connect **origin**; test persona fields are optional helpers, not bank logins |
| Ketchup Portals | `ketchup-smartpay/ketchup-portals/.env.example` | **`BUFFR_WEBHOOK_SECRET`** (HMAC from Buffr—same **value** as SmartPay backend when verifying the same integration); **`BUFFR_API_URL`**, **`SMARTPAY_BACKEND_URL`** (default port **4000**, same as SmartPay backend `PORT`) |

**Important:** The repo only ships **examples** and **local defaults** (`localhost`, `connect.buffr.ai` placeholders). Whether `*.ketchup.cc` callbacks, webhooks, and secrets are **fully configured in Vercel/Supabase** is an operations checklist — it is **not** guaranteed by static files in git.

### Simulator test users, accounts, and transaction history

There is **no single “test user”** with one identity across all four banks. Each bank simulator uses its own mock directory:

| Bank | Mock data path | Accounts / history (high level) |
|------|----------------|--------------------------------|
| FNB Namibia | `buffr-connect/banks/fnb-namibia/data/mock-users.json` | Many users with **1–2 current accounts** and balances; **transactions are not stored in this JSON** — the FNB app generates **90-day synthetic transactions** via `src/lib/transaction-generator` / AIS helpers when you call transaction APIs. |
| Bank Windhoek | `buffr-connect/banks/bank-windhoek/data/mock-users.json` | Large fixture set; demo users (e.g. `bwk.demo.01` / password `bwk1k`) include **embedded `transactions` arrays** on accounts (rich activity for PFM-style flows). |
| Nedbank Namibia | `buffr-connect/banks/nedbank-namibia/data/mock-users.json` | Many users (e.g. synthetic padding to **27** per export note); accounts include **substantial `transactions`** (business/agric scenarios, etc.). |
| Standard Bank Namibia | `buffr-connect/banks/standard-bank-namibia/data/mock-users.json` | Many users (padding note **35**); **some** scenario users have empty `transactions: []` (balances only), others have **detailed transaction lists** — pick a user from the JSON for the scenario you need. |

**SmartPay DB seeds** (`fintech/apps/smartpay-backend/scripts/seedTestData.ts`, `seedData.ts`) create **wallet/voucher/tx** data for **+264…** phones (Anna/Ben/Catherine or John/Jane/Bob). That is **separate** from bank simulator logins. E2E docs reference a **canonical** `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` (see `seedTestData.ts` header and Buffr Connect `.env.test`) for portal/OBS flows — not a unified “all banks” retail user.

**Docs:** [OAUTH_QUICK_START.md](../../../buffr-connect/buffrconnect/docs/guides/OAUTH_QUICK_START.md) (mock credentials, redirect troubleshooting).

## DNS + TLS checklist (Namecheap + Vercel)

1. Add each domain in the matching Vercel project.
2. In Namecheap, set CNAME records to the Vercel target (`came.vercel-dns.com` or project-specific generated target).
3. Wait for propagation; verify with `dig +short CNAME <host>`.
4. Confirm certificate status in Vercel (TLS is auto-provisioned once DNS is correct).
5. Validate each host with `curl -I https://<host>` and ensure expected app/tenant response.

## Safe cutover order

1. `backend.ketchup.cc` and `ai.ketchup.cc` (service backplane first)
2. `app.ketchup.cc` (core app path)
3. Bank tenant hosts: `fnb`, `bwk`, `nedbank`, `sbn`
4. Optional internal hosts: `admin`, `ops`

After each cutover, run smoke checks (align with AIS platform ops: [IMPLEMENTATION_ROADMAP.md](../../../buffr-connect/buffr-ais-platform/IMPLEMENTATION_ROADMAP.md#dns-tls-redirects-and-cross-repo-alignment)):
- **`GET /api/v1/health`** (and **`GET /api/v1/status`** where implemented) on API and bank AIS hosts
- Key **`/api/v1/*`** probes on the public API host (`api.ketchup.cc` when used)
- Tenant homepage / login / redirect behaviour on bank hosts
