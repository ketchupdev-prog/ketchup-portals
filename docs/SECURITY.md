# Ketchup Portals – Security & observability

This document summarizes **security controls** and **monitoring** for the Ketchup Portals Next.js app (SmartPay admin/ops suite). For product scope including **SmartPay Copilot**, see [KETCHUP_PORTALS_PRD.md](../KETCHUP_PORTALS_PRD.md) §11 and §23.1.

## Authentication & authorization

- **Portal session:** `POST /api/v1/auth/login` sets the **`portal-auth`** HTTP-only cookie; protected APIs use `requirePermission` / RBAC. Optional **Neon Auth** under `/api/auth/*` and Supabase cookies may apply per environment—see [NEON_AUTH_SETUP.md](NEON_AUTH_SETUP.md).
- **Principle of least privilege:** Route handlers enforce permissions aligned with the PRD permissions matrix (§20).

## Validation & errors

- **Input validation:** Zod (and related helpers) on API inputs; invalid requests return structured 400 responses.
- **Errors:** Avoid leaking stack traces or secrets to clients; log server-side with context (route, request id where available).

## Rate limiting

- Auth and sensitive mutations use rate limiting (see `src/lib/rate-limit.ts` and route handlers). For multi-instance production, prefer a shared store (Redis/KV) over in-memory limits.

## Logging & audit

- **Application logs:** Structured logging to stdout; aggregate in production (e.g. Logtail, Datadog).
- **Audit trail:** Critical operations write to **`audit_logs`** (immutable retention per PRD).
- **PII:** Do not log full national IDs, passwords, or session tokens.

## CORS & headers

- Configure allowed origins for browser clients per deployment; avoid `*` in production when credentials are used.

## Error tracking & performance

- **Sentry:** Enable when `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` are set (PRD §17).
- **Web vitals / RUM:** Track LCP and related metrics for portal pages (Vercel Analytics or equivalent).

## SmartPay Copilot (ecosystem)

- **SmartPay Copilot** serves beneficiaries through the **shared SmartPay / Buffr backend and AI services**, not through Ketchup Portals v1 UI.
- **Monitoring:** Treat Copilot like any critical dependency—health of the **API** (`api.ketchup.cc`), **AI proxy / inference service**, and trace tooling (e.g. Langfuse) owned by the backend team. Portal-specific Copilot dashboards are **out of scope for v1**; see PRD §23.1 for planned v2 considerations.
- **Secrets:** AI provider keys and service URLs belong in the **backend** or AI service env; do not duplicate into portal env unless a future admin API requires it.

## Checklist (release)

- [ ] Required env vars validated (`DATABASE_URL`, etc.) per `src/lib/env.ts`
- [ ] No secrets committed; `.env.local` gitignored
- [ ] RBAC verified on new `/api/v1` routes
- [ ] Rate limits on auth and high-risk mutations
- [ ] Audit logging for new privileged actions

---

**Last updated:** 2026-03-21
