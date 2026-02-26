# Security – Ketchup Portals

Guidance for securing the Ketchup Portals API and addressing common vulnerabilities.

---

## 1. Input validation

- **API bodies:** Use Zod schemas in `src/lib/validate.ts`. Critical routes (auth/login, beneficiaries/[id]/sms, bulk-sms) validate with `validateBody(schema, body)` and return 400 with a clear message on failure.
- **Path params:** Validate `[id]` params with `validateId(id)` (UUID format) before DB or business logic to avoid injection and bad data.
- **Query params:** Pagination uses `parsePagination()` (page/limit clamped). Other query params should be validated (type, length, allowed values) where used.

**Do not:** Trust `request.json()` or `params.id` without validation. **Do:** Use `validateBody` / `validateId` and return 400 for invalid input.

---

## 2. SQL / NoSQL injection

- **Database:** All queries use **parameterized inputs** via Drizzle (template literals with bound values). Do not build SQL with string concatenation or user input.
- **Neon:** `@neondatabase/serverless` with `sql` template literals keeps queries parameterized.

---

## 3. Authentication and authorization

- **Current state:** Auth is optional. When `NEXT_PUBLIC_REQUIRE_AUTH=true`, middleware redirects unauthenticated users from portal routes to `/login`. Supabase Auth and RBAC are not yet wired.
- **API routes:** Most `/api/v1/*` routes do not enforce auth. Sensitive operations (e.g. issue voucher, adjust float, cron) should be protected when auth is implemented (e.g. JWT + role checks).
- **Cron:** `POST /api/v1/sms/process` is protected by `CRON_SECRET` (or `SMS_CRON_SECRET`): request must send `Authorization: Bearer <secret>` when the env var is set.

---

## 4. Rate limiting

- **Current state:** In-memory rate limiting is implemented for auth and SMS (Rule 16).
  - **POST /api/v1/auth/login:** 10 requests per minute per IP.
  - **POST /api/v1/beneficiaries/bulk-sms:** 20 requests per minute per IP.
  - **POST /api/v1/beneficiaries/[id]/sms:** 20 requests per minute per IP.
  - Implementation: `src/lib/rate-limit.ts` (per-instance store; returns 429 with `Retry-After` when over limit).
- **Production:** For distributed limits across Vercel serverless instances, use Redis or Vercel KV instead of in-memory store.

---

## 5. CORS

- **Current state:** Next.js API routes do not set CORS by default; same-origin only. If the front end and API share the same origin, no change is needed.
- **Cross-origin:** If the API is called from another domain, set `Access-Control-Allow-Origin` (and related headers) explicitly; avoid `*` for authenticated or sensitive endpoints.

---

## 6. Logging and PII

- **Structured logging:** Use `src/lib/logger.ts` (logger.info/warn/error) with route and context. Do not log passwords, full tokens, or full PII (e.g. full ID numbers, full phone numbers). Log enough for debugging (e.g. route, error message, non-PII identifiers).
- **5xx responses:** When returning 500, pass the route into `jsonError(..., 500, ROUTE)` so the logger can record the failing route.

---

## 7. Dependencies and supply chain

- Run `npm audit` and address critical/high issues where possible (e.g. `npm audit fix`; avoid `--force` without review).
- Keep dependencies up to date; review release notes for security fixes.

---

## 8. Checklist (before production)

| Item | Status |
|------|--------|
| No secrets in repo (use `.env` / `.env.local` / `backend/.env`; never commit; use `.env.example` for variable names only) | Enforced via `.gitignore` |
| Input validation (body + path params) on sensitive routes | Partial (login, SMS; extend to others) |
| Parameterized DB queries | Done (Drizzle) |
| Auth and RBAC on sensitive APIs | Not implemented |
| Cron/worker endpoints protected by secret | Done (SMS process) |
| Rate limiting | Done (auth + SMS; in-memory; use Redis/KV for production) |
| CORS configured if cross-origin | Same-origin default |
| No PII in logs | Structured logger; avoid logging secrets/PII |
| HTTPS only | Enforced by Vercel in production |

---

## 9. References

- PRD §12 (Compliance & Security): `KETCHUP_PORTALS_PRD.md`
- API design: `docs/DATABASE_AND_API_DESIGN.md`
- SMS and cron: `docs/SMS_DESIGN.md`
