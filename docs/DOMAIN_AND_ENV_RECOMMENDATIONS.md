# Domain & env recommendations (Ketchup SmartPay)

Recommended public domains and corresponding environment variables across the beneficiary app, portals, and backend.

**Operational authority:** For **DNS records**, **redirect flows**, **per-portal login URLs**, **Vercel project ↔ hostname matrix**, **bank AIS subdomains**, and **env alignment across repos**, the canonical doc is **[DNS_AND_REDIRECTS.md](./DNS_AND_REDIRECTS.md)** (most current). This page is a **short companion** (summary tables and copy-paste env snippets); if anything conflicts, update this file to match **DNS_AND_REDIRECTS.md**. Do **not** add separate root-level env/DNS “audit” Markdown — merge findings into these two files.

**Last updated (env templates):** 2026-03-20 — Buffr Connect monorepo documents **`buffr-ais-platform`** as the primary AIS surface; portal uses **`BUFFR_SANDBOX_URL`** → AIS origin (local `:3005` via `npm run dev:ais-platform`).

---

## Cross-repo environment variable dictionary

Use **one value per environment** across apps; **names** stay per-app (do not rename env vars in code in this pass—only templates and docs).

| Concept | Meaning | Example (local) | Used in |
|--------|---------|-----------------|---------|
| **Buffr Connect origin** | Scheme + host (+ port) of the **Next.js Buffr Connect** app **only**—no `/api` suffix. Used by clients that append paths themselves. | `http://localhost:3000` | `BUFFR_CONNECT_URL`, `NEXT_PUBLIC_BUFFR_CONNECT_URL`, `EXPO_PUBLIC_BUFFR_CONNECT_URL` (SmartPay backend `buffrConnectClient.ts` appends `/api/...`) |
| **Buffr API base** | Base URL for **server** HTTP clients (often includes `/api`). Axios/SDK may append route segments. | `http://localhost:3000/api` | `BUFFR_API_URL` (Ketchup Portals, SmartPay `BuffrClient`), optional prod `https://api.ketchup.cc/api` if your gateway serves Buffr-compatible routes |
| **AIS platform origin** | **Buffr AIS Platform** (`buffr-connect/buffr-ais-platform/`) — OIDC + AIS + consent HTTP API. Used as the **split** AIS deploy in this monorepo. | `http://localhost:3005` (e.g. `npm run dev:ais-platform` from `buffr-connect/`) or `https://ais.buffr.ai` | `NEXT_PUBLIC_APP_URL` on the AIS app; **portal** links provider `buffr_sandbox` via **`BUFFR_SANDBOX_URL`** (legacy alias **`BANK_SIMULATOR_AIS_PLATFORM_URL`**) — see `buffrconnect/lib/providers/bank-simulator-env.ts` |
| **SmartPay backend** | Express API (port in its `.env.example`). | `http://localhost:4000` | `PORT=4000`, `EXPO_PUBLIC_API_BASE_URL`, Ketchup `SMARTPAY_BACKEND_URL` / `NEXT_PUBLIC_SMARTPAY_BACKEND_URL` |
| **SmartPay AI (FastAPI)** | Copilot / ML service. | `http://localhost:8000` | `SMARTPAY_AI_URL`, `AI_SERVICE_URL`, `EXPO_PUBLIC_AI_API_BASE_URL` |
| **Webhook HMAC (Buffr → SmartPay/Ketchup)** | Same **secret value** wherever verification runs; **names differ by repo**. | `openssl rand -hex 32` | Buffr Connect: `WEBHOOK_SECRET`. SmartPay backend + Ketchup Portals: `BUFFR_WEBHOOK_SECRET` |
| **Supabase (shared identity)** | Same project across Buffr Connect, AIS platform, Ketchup when using centralized auth. | Dashboard API settings | `NEXT_PUBLIC_SUPABASE_URL`, publishable or `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only) |
| **Bank simulators (monorepo)** | Local Next apps under `buffr-connect/banks/*`. | `3001`–`3004` | `FNB_NAMIBIA_URL`, `STANDARD_BANK_URL`, `BANK_WINDHOEK_URL`, `NEDBANK_NAMIBIA_URL` (+ optional `BANK_SIMULATOR_*` overrides) |

**Production API hostname (Ketchup / SmartPay stack):** prefer a **single** public API base (e.g. **`https://api.ketchup.cc`**) for `BUFFR_API_URL` / mobile API bases unless your runbook splits gateways—see [DNS_AND_REDIRECTS.md](./DNS_AND_REDIRECTS.md).

**Template files (safe to commit):** `fintech/apps/*/.env.example`, `ketchup-smartpay/ketchup-portals/.env.example`, `buffr-connect/buffrconnect/.env.local.example`, `buffr-connect/buffrconnect/.env.production.example`, `buffr-connect/buffr-ais-platform/.env.example`, `buffr-connect/buffr-ais-platform/.env.production.example`, `buffr-connect/banks/*/.env.example`.

---

## Recommended domains

| Purpose | Domain | Used by |
|--------|--------|---------|
| **Beneficiary app** (mobile / PWA) | `app.ketchup.cc` | Buffr G2P mobile app – beneficiaries view vouchers, redeem, etc. |
| **Portals** (all four: Ketchup, Government, Agent, Field Ops) | `portal.ketchup.cc` | Next.js ketchup-portals app – operations, compliance, agents, field. |
| **Ketchup portal (admin)** | `admin.ketchup.cc` | Same app as `portal.ketchup.cc`; alias or redirect to `portal.ketchup.cc/ketchup` (optional). |
| **Backend API** | `api.ketchup.cc` | Single API used by beneficiary app, portals, and any other clients. |
| **SmartPay Copilot** | Same **`api.ketchup.cc`** (and optional dedicated **AI / inference** service) | Beneficiary-facing AI; chat proxy and model calls typically live on the **backend / AI stack**. Ketchup Portals does not require Copilot env vars in v1; monitor Copilot via backend observability. See PRD §23.1. |
| **Bank AIS/OAuth sites** | `fnb.ketchup.cc`, `bwk.ketchup.cc`, `nedbank.ketchup.cc`, `sbn.ketchup.cc` | **Separate** Next (or other) apps + **separate Neon DBs** per bank — not ketchup-portals tenants. Per-bank env template and DNS: [DNS_AND_REDIRECTS.md](./DNS_AND_REDIRECTS.md). |

**Contact / support:** `ichigo@ketchup.cc` (Namecheap Private Email). Use for support, security reports, and as the human-facing mailbox; transactional mail (e.g. password reset) can use `no-reply@ketchup.cc` or the same address via `SMTP_FROM` in env.

## 1. Buffr G2P – beneficiary-facing app (separate `buffr-g2p` checkout)

> Paths below are **illustrative** for a dedicated `buffr-g2p` repository. In the **`ai-agent-mastery-main`** tree, the closest siblings are **`fintech/`** (SmartPay mobile + backends — use `BUFFR_CONNECT_URL` / API bases there) and **`buffr-connect/`** (open banking portal + simulators). Align env values with [DNS_AND_REDIRECTS.md](./DNS_AND_REDIRECTS.md) and [Buffr Connect PRD §7.4.1](../../../buffr-connect/buffrconnect/PRD.md).

### Backend (`buffr-g2p/backend/.env`)

- **API / app URL** – backend is the API; when deployed, it serves `api.ketchup.cc`.  
  For the **beneficiary app** public URL (links, redirects, CORS), use `app.ketchup.cc`:

```bash
# Backend (API) base – when deployed this is api.ketchup.cc
BASE_URL=https://api.ketchup.cc

# Beneficiary app URL (for emails, redirects, CORS)
NEXT_PUBLIC_APP_URL=https://app.ketchup.cc

# CORS – allow beneficiary app and portals
ALLOWED_ORIGINS=https://app.ketchup.cc,https://portal.ketchup.cc,https://admin.ketchup.cc,https://gov.ketchup.cc,https://agent.ketchup.cc,https://mobile.ketchup.cc,http://localhost:3000,http://localhost:3001,http://localhost:3002
```

- **Buffr / Ketchup** – portal and backend both talk to the same API; keep:

```bash
BUFFR_API_URL=https://api.ketchup.cc
# KETCHUP_SMARTPAY already points to api.ketchup.cc
KETCHUP_SMARTPAY_API_URL=https://api.ketchup.cc
```

### Mobile (`buffr-g2p/mobile/.env`)

- **API** – point to backend at `api.ketchup.cc`.  
- **App URL** – beneficiary app at `app.ketchup.cc`:

```bash
# Production API
EXPO_PUBLIC_API_BASE_URL=https://api.ketchup.cc
EXPO_PUBLIC_API_URL=https://api.ketchup.cc
EXPO_PUBLIC_KETCHUP_API_URL=https://api.ketchup.cc

# Beneficiary app (links / redirects)
NEXT_PUBLIC_APP_URL=https://app.ketchup.cc
```

(Local dev can keep `http://localhost:3001` for API and override only when building for production.)

---

## 2. Ketchup Portals (`ketchup-portals`)

- **Portal app** is deployed at **`portal.ketchup.cc`** (and optionally **`admin.ketchup.cc`** for Ketchup portal).
- **Backend API** used by the portal for voucher sync, reconciliation, etc.: **`api.ketchup.cc`**.

### `.env` / `.env.example`

```bash
# Supabase (optional — same project as Buffr Connect when sharing identity)
# NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...   # server-only

# Backend API (voucher sync, reconciliation, etc.)
BUFFR_API_URL=https://api.ketchup.cc
# BUFFR_API_KEY=...

# SmartPay Node backend (must match fintech/apps/smartpay-backend PORT, default 4000)
# SMARTPAY_BACKEND_URL=http://localhost:4000
# NEXT_PUBLIC_SMARTPAY_BACKEND_URL=http://localhost:4000

# Webhook verification (same secret value as configured for outbound Buffr webhooks)
# BUFFR_WEBHOOK_SECRET=...

# Optional: public URL of this portal app (emails, password reset links)
# NEXT_PUBLIC_PORTAL_URL=https://portal.ketchup.cc
```

- **Vercel / hosting:** set the portal project’s domain to `portal.ketchup.cc`.  
  Optionally add **admin.ketchup.cc**, **gov.ketchup.cc**, **agent.ketchup.cc**, **mobile.ketchup.cc** as additional domains (same app); middleware redirects each subdomain’s `/` to that portal path. See [DNS_AND_REDIRECTS.md](DNS_AND_REDIRECTS.md).

---

## Summary table

| Repo / app | File | Variable | Recommended value |
|------------|------|----------|-------------------|
| SmartPay monorepo | `fintech/apps/smartpay-backend/.env` | `BUFFR_CONNECT_URL` | `https://connect.buffr.ai` (or your Buffr Connect origin); see backend `.env.example` |
| SmartPay monorepo | `fintech/apps/smartpay-mobile/.env` | `EXPO_PUBLIC_API_BASE_URL` | `https://api.ketchup.cc` (prod) per mobile README |
| buffr-g2p backend | `backend/.env` | `BASE_URL` | `https://api.ketchup.cc` |
| buffr-g2p backend | `backend/.env` | `NEXT_PUBLIC_APP_URL` | `https://app.ketchup.cc` |
| buffr-g2p backend | `backend/.env` | `ALLOWED_ORIGINS` | Include `https://app.ketchup.cc`, `https://portal.ketchup.cc`, `https://admin.ketchup.cc` |
| buffr-g2p backend | `backend/.env` | `BUFFR_API_URL` | `https://api.ketchup.cc` |
| buffr-g2p mobile | `mobile/.env` | `EXPO_PUBLIC_API_BASE_URL` | `https://api.ketchup.cc` (prod) |
| buffr-g2p mobile | `mobile/.env` | `EXPO_PUBLIC_API_URL` | `https://api.ketchup.cc` (prod) |
| buffr-g2p mobile | `mobile/.env` | `EXPO_PUBLIC_KETCHUP_API_URL` | `https://api.ketchup.cc` |
| buffr-g2p mobile | `mobile/.env` | `NEXT_PUBLIC_APP_URL` | `https://app.ketchup.cc` |
| ketchup-portals | `.env` | `BUFFR_API_URL` | `https://api.ketchup.cc` or Buffr Connect API base with path as needed |
| ketchup-portals | `.env` | `SMARTPAY_BACKEND_URL` | Same host as SmartPay backend; local `http://localhost:4000` |
| ketchup-portals | `.env` | `BUFFR_WEBHOOK_SECRET` | Same **value** as Buffr `WEBHOOK_SECRET` for that webhook channel |
| ketchup-portals | `.env` | `NEXT_PUBLIC_PORTAL_URL` | `https://portal.ketchup.cc` (optional) |
| SmartPay backend | `fintech/apps/smartpay-backend/.env` | `PORT` | `4000` (default in `.env.example`) |
| Buffr AIS platform | `buffr-connect/buffr-ais-platform/.env` | `NEXT_PUBLIC_APP_URL` | AIS deploy origin; SDK `baseUrl` often `…/api/v1` |

**Contact / support:** `ichigo@ketchup.cc`. Set in env only where needed (e.g. `SMTP_FROM` for transactional mail; see `.env.example`).

DNS: point **app.ketchup.cc**, **portal.ketchup.cc**, **admin.ketchup.cc**, **gov.ketchup.cc**, **agent.ketchup.cc**, **api.ketchup.cc** (and **mobile.ketchup.cc** if used for Field Ops portal) to the respective deployments (Vercel, backend host, etc.).
