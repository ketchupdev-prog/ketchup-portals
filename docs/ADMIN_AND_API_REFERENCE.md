# Admin dashboards & API integration — reference

**Purpose:** One entry point for operators and engineers after redundant root-level “implementation complete” Markdown was removed (2026-03).  
**Location:** `ketchup-portals/docs/ADMIN_AND_API_REFERENCE.md`

## Code (source of truth)

| Area | Path |
|------|------|
| Admin app shell & routes | `src/app/admin/` (compliance, financial, security, analytics, ai-ml, settings) |
| Shared admin UI | `src/components/admin/` |
| API clients, mocks, hooks | `src/lib/api/`, `src/lib/hooks/` |

## Long-form guides (repo root)

| Topic | File |
|--------|------|
| Unified client, dashboard APIs, auth, errors | [../API_INTEGRATION_GUIDE.md](../API_INTEGRATION_GUIDE.md) |
| Polling vs WebSocket, hybrid real-time | [../REALTIME_DATA_ARCHITECTURE.md](../REALTIME_DATA_ARCHITECTURE.md) |
| SmartPay backend / AI service expectations | [../BACKEND_SETUP_REQUIREMENTS.md](../BACKEND_SETUP_REQUIREMENTS.md) |
| Common failures | [../TROUBLESHOOTING.md](../TROUBLESHOOTING.md) |

## Product & compliance

| Doc | Path |
|-----|------|
| PRD | [../KETCHUP_PORTALS_PRD.md](../KETCHUP_PORTALS_PRD.md) |
| Tasks & completed work | [../TASK.md](../TASK.md) |
| Strategy / planning | [../PLANNING.md](../PLANNING.md) |
| Compliance setup | [compliance/SETUP.md](./compliance/SETUP.md) |
| Virtual assets (PSD-3) | [compliance/virtual-assets-exclusion-analysis.md](./compliance/virtual-assets-exclusion-analysis.md) |

## DNS, TLS, env (canonical)

- **[DNS_AND_REDIRECTS.md](./DNS_AND_REDIRECTS.md)** — SSOT for domains, Vercel, redirects, cross-repo env alignment.  
- **[DOMAIN_AND_ENV_RECOMMENDATIONS.md](./DOMAIN_AND_ENV_RECOMMENDATIONS.md)** — compact variable / hostname table.

Historical one-off env/DNS audits are **not** kept as separate files; fix drift by updating the two documents above.
