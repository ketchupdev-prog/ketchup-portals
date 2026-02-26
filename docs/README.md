# Ketchup Portals – Documentation index

## Product & implementation

| Doc | Description |
|-----|-------------|
| [../KETCHUP_PORTALS_PRD.md](../KETCHUP_PORTALS_PRD.md) | Product requirements (v1.4): portals, modules, common features, DB, API. |
| [../PRD_IMPLEMENTATION_STATUS.md](../PRD_IMPLEMENTATION_STATUS.md) | Implementation status: what’s done, partial, or not implemented vs PRD. |
| [PRD_AUDIT_REPORT_v1.4.1.md](PRD_AUDIT_REPORT_v1.4.1.md) | PRD audit report and validation checklist (v1.4.1). |
| [../WHATS_LEFT_TO_IMPLEMENT.md](../WHATS_LEFT_TO_IMPLEMENT.md) | Short “what’s left” checklist for MVP and post-MVP. |

## Backend & API

| Doc | Description |
|-----|-------------|
| [DATABASE_AND_API_DESIGN.md](DATABASE_AND_API_DESIGN.md) | Full database schema and `/api/v1` API specification (PRD §29). |
| [DATES.md](DATES.md) | Date handling: storage (UTC), API (ISO 8601), UI (locale), date-fns and components. |
| [NEON_SETUP.md](NEON_SETUP.md) | Neon (serverless Postgres) + Drizzle: connection, schema, migrations, build/deploy. |
| [NEON_AUTH_SETUP.md](NEON_AUTH_SETUP.md) | Portal authentication (cookie + Bearer), login, session, RBAC (roles/permissions). |

## Features

| Doc | Description |
|-----|-------------|
| [SMS_DESIGN.md](SMS_DESIGN.md) | SMS: queue, cron (Vercel + local script), webhooks, env vars, UI wiring. |
| [SECURITY.md](SECURITY.md) | Security: validation, logging, auth, rate limiting, CORS, checklist. |
| [PROFILE_AND_SETTINGS.md](PROFILE_AND_SETTINGS.md) | What belongs on each portal’s Profile and Settings pages (PRD §5.2.5, §7.4). |

## UI & components

| Doc | Description |
|-----|-------------|
| [../COMPONENT_INVENTORY.md](../COMPONENT_INVENTORY.md) | UI component inventory. |
| [COMPONENT_BOILERPLATE_INVENTORY.md](COMPONENT_BOILERPLATE_INVENTORY.md) | Component boilerplate inventory. |
| [../src/components/README.md](../src/components/README.md) | Components folder structure. |

## Quick links

- **Repository:** [https://github.com/ketchupdev-prog/ketchup-portals](https://github.com/ketchupdev-prog/ketchup-portals)
- **Root README:** [../README.md](../README.md) – setup, env, scripts, deploy.
- **Portals:** `/ketchup`, `/government`, `/agent`, `/field-ops`.
