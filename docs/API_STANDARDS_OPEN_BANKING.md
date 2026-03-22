# API Standards – Open Banking & ISO 20022 Alignment

Reference: `g2p/docs/NAMIBIAN_OPEN_BANKING_STANDARDS_V1.txt` (Namibian Open Banking Standards v1.0).

---

## 1. Response shape (root object)

All API responses use a **root object**:

- **Success (200/201):** `{ data, meta?, links? }`
  - `data`: mandatory (single resource or array).
  - `meta`: optional (pagination, version, etc.).
  - `links`: optional (pagination links, self, related).

- **Error (4xx/5xx):** `{ errors: Array<{ code, title?, message, field? }> }`
  - Use `jsonErrors()` or `jsonErrorOpenBanking()` from `@/lib/api-response`.

Existing helpers:

- `jsonSuccess(data, { meta?, links?, status? })` – success with root `data`.
- `jsonPaginated(data, meta, links)` – already root `{ data, meta, links }`.
- `jsonErrors(errors, status, { retryAfter?, route? })` – error root with optional `Retry-After`.

---

## 2. Request shape (mutations)

For POST/PUT with a body:

- **Preferred (Open Banking):** root object `{ data: { ... } }`. Use `parseRootData(body)` from `@/lib/open-banking` to read `data`; fall back to flat body for backward compatibility.
- **Content-Type:** `application/json` required for mutations. Use `guardMutation(..., { requireJsonBody: true })` or `requireJson(request)`.

---

## 3. Headers

| Header | Direction | Usage |
|--------|-----------|--------|
| `Content-Type` | Request | `application/json` for POST/PUT with body. |
| `Accept` | Request | Optional; default `application/json`. |
| `x-v` | Request | API version (positive integer). Optional; default 1. |
| `Idempotency-Key` | Request | Recommended for payment/voucher/float mutations. Use `guardMutation(..., { requireIdempotency: true })` when required. |
| `Retry-After` | Response | Sent with 429 (rate limit). |

---

## 4. Security (per endpoint)

- **Rate limiting:** Apply to auth and all mutation endpoints via `guardMutation(request, { rateLimitKey, rateLimitMax })`. Returns 429 with `Retry-After` when exceeded.
- **Auth:** Use `requirePermission()` / `requireAnyPermission()` for protected routes.
- **Validation:** Use Zod via `validateBody(schema, body)`; return 400 with `errors` array.
- **Idempotency:** For payment initiation, voucher issue, float request: support `Idempotency-Key` to avoid duplicate submissions.

---

## 5. ISO 20022–style payment initiation

For payment-like operations (vouchers, transfers, float), payloads can be aligned with ISO 20022 concepts:

- **Instruction identification** – maps to Idempotency-Key or a unique `instructionId`.
- **Debtor / Creditor** – payer and payee (party id, name, account id).
- **Amount / Currency** – amount in minor units, ISO 4217 currency.
- **End-to-end reference** – `endToEndId` for tracing.
- **Remittance information** – unstructured note.

See `@/lib/open-banking`: `PaymentInitiationPayload`, `mapToPaymentInitiation()`.

---

## 6. Error codes (consistent)

Use these `code` values in `errors[].code`:

| Code | HTTP | Meaning |
|------|------|---------|
| `ValidationError` | 400 | Invalid or missing input. |
| `Unauthorized` | 401 | Not authenticated. |
| `Forbidden` | 403 | Authenticated but not allowed. |
| `NotFound` | 404 | Resource not found. |
| `UnsupportedMediaType` | 415 | Content-Type not application/json. |
| `IdempotencyKeyRequired` | 400 | Idempotency-Key header missing (when required). |
| `RateLimitExceeded` | 429 | Too many requests; retry after Retry-After. |
| `InternalError` | 500 | Server error. |

---

## 7. Endpoints updated to this standard

- `POST /api/v1/auth/login` – 429 and 4xx/5xx use root `{ errors }`; success remains at root for backward compatibility.
- `POST /api/v1/auth/register` – Rate limit via `guardMutation`, root `{ data }` response, `{ errors }` for failures.
- `POST /api/v1/vouchers/issue` – Rate limit, root `data` request/response, validation → `errors`.
- `POST /api/v1/agent/float/request` – Rate limit, root `data` response, Open Banking error codes.
- `POST /api/v1/beneficiaries/[id]/sms` – Rate limit via `guardMutation`, root `{ data }` response, accepts root `{ data }` or flat body.
- `POST /api/v1/beneficiaries/bulk-sms` – Rate limit, root `{ data }` request/response, `{ errors }` for failures.

Other routes can be migrated incrementally to use `jsonSuccess`/`jsonErrorOpenBanking` and `guardMutation` where appropriate.

---

## 8. References

- Namibian Open Banking Standards (root object, headers, errors): `g2p/docs/NAMIBIAN_OPEN_BANKING_STANDARDS_V1.txt`.
- Security: `docs/SECURITY.md`.
- API design: `docs/DATABASE_AND_API_DESIGN.md`.
