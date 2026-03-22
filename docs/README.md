# Ketchup Portals – Documentation index

**SSOT DNS / redirects / Vercel / cross-repo env:** [DNS_AND_REDIRECTS.md](./DNS_AND_REDIRECTS.md)  
**SSOT env variable names (table):** [DOMAIN_AND_ENV_RECOMMENDATIONS.md](./DOMAIN_AND_ENV_RECOMMENDATIONS.md)

**Hygiene (2026-03):** Redundant root-level `*_IMPLEMENTATION*.md`, `ADMIN_DASHBOARDS_*`, `API_INTEGRATION_COMPLETE.md`, `ENV_DNS_AUDIT_*.md`, and similar completion reports were removed. Use **[TASK.md](../TASK.md)** for task status, **[ADMIN_AND_API_REFERENCE.md](./ADMIN_AND_API_REFERENCE.md)** for admin/API pointers, and this index for everything else.

---

## Product & implementation

| Doc | Description |
|-----|-------------|
| [../KETCHUP_PORTALS_PRD.md](../KETCHUP_PORTALS_PRD.md) | Product requirements: portals, modules, DB, API, ecosystem. |
| [../TASK.md](../TASK.md) | Current tasks and completed checklist. |
| [../PLANNING.md](../PLANNING.md) | Architecture and strategic planning. |
| [ADMIN_AND_API_REFERENCE.md](./ADMIN_AND_API_REFERENCE.md) | Admin routes, links to API / realtime / backend guides. |

## Backend & API

| Doc | Description |
|-----|-------------|
| [DATABASE_AND_API_DESIGN.md](./DATABASE_AND_API_DESIGN.md) | Schema and `/api/v1` design (rewrites for health/cron). |
| [OPEN_BANKING_AND_ISO20022.md](./OPEN_BANKING_AND_ISO20022.md) | Open Banking, consent, ISO 20022 (PRD §17). |
| [API_STANDARDS_OPEN_BANKING.md](./API_STANDARDS_OPEN_BANKING.md) | API standards alignment. |
| [DATES.md](./DATES.md) | UTC storage, ISO API, UI locale. |
| [NEON_SETUP.md](./NEON_SETUP.md) | Neon + Drizzle, migrations. |
| [NEON_DRIZZLE_NEXTJS_SETUP.md](./NEON_DRIZZLE_NEXTJS_SETUP.md) | Next.js + Drizzle detail. |
| [NEON_AUTH_SETUP.md](./NEON_AUTH_SETUP.md) | Neon Auth, domains, sessions. |
| [../API_INTEGRATION_GUIDE.md](../API_INTEGRATION_GUIDE.md) | Portal ↔ SmartPay client layer (root). |
| [../REALTIME_DATA_ARCHITECTURE.md](../REALTIME_DATA_ARCHITECTURE.md) | Polling / WebSocket (root). |
| [../BACKEND_SETUP_REQUIREMENTS.md](../BACKEND_SETUP_REQUIREMENTS.md) | Backend/AI service contract (root). |

## Deployment & domains

| Doc | Description |
|-----|-------------|
| [DOMAIN_AND_ENV_RECOMMENDATIONS.md](./DOMAIN_AND_ENV_RECOMMENDATIONS.md) | Hostnames and env vars across apps. |
| [DNS_AND_REDIRECTS.md](./DNS_AND_REDIRECTS.md) | **Canonical** DNS, TLS, redirects, cutover, per-bank hosts. |
| [DOCKER_AND_DOMAINS.md](./DOCKER_AND_DOMAINS.md) | Docker + reverse proxy + SSL. |
| [VERCEL_CLEANUP_AND_DEPLOY.md](./VERCEL_CLEANUP_AND_DEPLOY.md) | Vercel deploy notes. |

## Auth & security

| Doc | Description |
|-----|-------------|
| [SUPABASE_AUTH_INTEGRATION.md](./SUPABASE_AUTH_INTEGRATION.md) | Supabase Auth in portals. |
| [SECURITY.md](./SECURITY.md) | Validation, logging, rate limits, CORS. |
| [security/AUTHENTICATION_MARKERS.md](./security/AUTHENTICATION_MARKERS.md) | Email/SMS markers (SEC-008). |
| [security/psd-12-cybersecurity-framework.md](./security/psd-12-cybersecurity-framework.md) | PSD-12 framework notes. |

## Compliance

| Doc | Description |
|-----|-------------|
| [compliance/SETUP.md](./compliance/SETUP.md) | Compliance dashboard setup. |
| [compliance/virtual-assets-exclusion-analysis.md](./compliance/virtual-assets-exclusion-analysis.md) | Virtual assets / PSD-3. |

## Features & ops

| Doc | Description |
|-----|-------------|
| [SMS_DESIGN.md](./SMS_DESIGN.md) | SMS queue, cron, webhooks. |
| [features/BE-001-ADVANCE-RECOVERY.md](./features/BE-001-ADVANCE-RECOVERY.md) | Advance recovery feature. |
| [monitoring/HEALTH_CHECKS.md](./monitoring/HEALTH_CHECKS.md) | Health endpoints & external monitoring. |
| [monitoring/README.md](./monitoring/README.md) | Monitoring doc index. |
| [testing/INTEGRATION_TESTS.md](./testing/INTEGRATION_TESTS.md) | Integration tests. |
| [dev/RBAC_IMPLEMENTATION_TEMPLATE.md](./dev/RBAC_IMPLEMENTATION_TEMPLATE.md) | RBAC template. |

## UI & components

| Doc | Description |
|-----|-------------|
| [architecture/COMPONENT_INVENTORY.md](./architecture/COMPONENT_INVENTORY.md) | Component inventory. |
| [../src/components/README.md](../src/components/README.md) | `src/components` layout. |

## Archive (read-only)

| Doc | Description |
|-----|-------------|
| [../.archive/deleted-markdown-20260321/README.md](../.archive/deleted-markdown-20260321/README.md) | Historical snapshots (RBAC, P0, etc.). |

## Quick links

- **Root README:** [../README.md](../README.md) — install, scripts, portals table.  
- **Troubleshooting:** [../TROUBLESHOOTING.md](../TROUBLESHOOTING.md)  
- **Portals:** `/ketchup`, `/government`, `/agent`, `/field-ops`.  
- **API:** Prefer `/api/v1/...`; health/cron rewrites — see root README and `next.config.ts`.
