# Ketchup Portals – Documentation index

## Product & implementation

| Doc | Description |
|-----|-------------|
| [../KETCHUP_PORTALS_PRD.md](../KETCHUP_PORTALS_PRD.md) | Product requirements (v1.3): portals, modules, common features, DB, API. |
| [../PRD_IMPLEMENTATION_STATUS.md](../PRD_IMPLEMENTATION_STATUS.md) | Implementation status: what’s done, partial, or not implemented vs PRD. |

## Backend & API

| Doc | Description |
|-----|-------------|
| [DATABASE_AND_API_DESIGN.md](DATABASE_AND_API_DESIGN.md) | Full database schema and `/api/v1` API specification (PRD §29). |
| [NEON_SETUP.md](NEON_SETUP.md) | Neon (serverless Postgres) + Drizzle: connection, schema, migrations, build/deploy. |

## Features

| Doc | Description |
|-----|-------------|
| [SMS_DESIGN.md](SMS_DESIGN.md) | SMS: queue, cron (Vercel + local script), webhooks, env vars, UI wiring. |
| [SECURITY.md](SECURITY.md) | Security: validation, logging, auth, rate limiting, CORS, checklist. |

## UI & components

| Doc | Description |
|-----|-------------|
| [../COMPONENT_INVENTORY.md](../COMPONENT_INVENTORY.md) | UI component inventory. |
| [COMPONENT_BOILERPLATE_INVENTORY.md](COMPONENT_BOILERPLATE_INVENTORY.md) | Component boilerplate inventory. |
| [../src/components/README.md](../src/components/README.md) | Components folder structure. |

## Quick links

- **Root README:** [../README.md](../README.md) – setup, env, scripts, deploy.
- **Portals:** `/ketchup`, `/government`, `/agent`, `/field-ops`.
