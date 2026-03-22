# SMS Communication – Design & Implementation

SMS for beneficiary reminders, bulk SMS, and opt-out (STOP) as per PRD §3.2.2 and communication requirements.

---

## 1. Overview

| Feature | Description | Portal |
|--------|-------------|--------|
| Beneficiary reminders | Single SMS (proof-of-life, etc.) | Ketchup – beneficiary detail “Trigger proof-of-life” |
| Bulk SMS | Send to filtered beneficiaries | Ketchup – beneficiaries list “Send SMS reminder” |
| SMS history | View sent SMS per beneficiary | Ketchup – beneficiary detail “SMS history” tab |
| Queue processing | Pending → sent/failed via cron | POST `/api/v1/sms/process` |
| Delivery receipts | Provider webhook → update status | POST `/api/v1/webhooks/sms/delivery` |
| Inbound (STOP) | Opt-out → `users.sms_opt_out` | POST `/api/v1/webhooks/sms/inbound` |

---

## 2. Database

- **`sms_queue`** (`src/db/schema.ts`): `id`, `recipient_phone`, `message`, `status` (pending | sent | failed | delivered), `provider_message_id`, `reference_id`, `reference_type`, `attempts`, `last_attempt_at`, `created_at`, `sent_at`, `delivered_at`, `error_message`.
- **`users`**: `sms_opt_out`, `email_opt_out` (boolean, default false).

Run migrations after schema change:

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

---

## 3. SMS Service

**`src/lib/services/sms.ts`**

- `sendSms({ to, message, reference? }): Promise<SmsResult>`.
- Uses `SMS_API_URL` and `SMS_API_KEY`. Provider-agnostic (swap gateway without changing callers).
- If env vars are missing, returns `{ success: false, error: "SMS gateway not configured" }` (no throw).

---

## 4. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/beneficiaries/:id/sms` | Queue single SMS to beneficiary. Body: `{ message? }`. Skips if `sms_opt_out`. |
| POST | `/api/v1/beneficiaries/bulk-sms` | Queue SMS to many. Body: `{ beneficiary_ids: string[], message? }`. Skips opted-out. |
| GET | `/api/v1/sms/history?beneficiary_id=` | Paginated SMS history (optional filter by beneficiary). |
| POST | `/api/v1/sms/process` | Process pending queue (send via gateway). Secured by `CRON_SECRET` or `SMS_CRON_SECRET` (Bearer). |
| POST | `/api/v1/webhooks/sms/delivery` | Provider DLR webhook. Secured by `SMS_WEBHOOK_SECRET` (header or Bearer). |
| POST | `/api/v1/webhooks/sms/inbound` | Inbound SMS (STOP → set `sms_opt_out`). Secured by `SMS_WEBHOOK_SECRET`. |

---

## 5. Environment Variables

Set in `.env` or `.env.local` (and in Vercel for production). See [DOMAIN_AND_ENV_RECOMMENDATIONS.md](DOMAIN_AND_ENV_RECOMMENDATIONS.md).

In `.env.local` and Vercel:

- `SMS_API_URL` – gateway endpoint (e.g. InfoBip, Twilio).
- `SMS_API_KEY` – API key for gateway.
- `SMS_WEBHOOK_SECRET` – (optional) verify delivery/inbound webhooks.
- `CRON_SECRET` or `SMS_CRON_SECRET` – (optional) secure POST `/api/v1/sms/process`.

---

## 6. Queue Processing (Cron)

### Production (Vercel)

- **`vercel.json`** defines a cron that calls `POST /api/v1/sms/process` every 5 minutes. Vercel sends `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is set in the project environment.

### Local / external

- **`npm run cron:sms`** runs **`scripts/process-sms-cron.mjs`**: every 2 minutes (and once on start) it `POST`s to `BASE_URL/api/v1/sms/process` with optional `Authorization: Bearer CRON_SECRET` or `SMS_CRON_SECRET`. Set `BASE_URL` (default `http://localhost:3000`) and `CRON_SECRET` or `SMS_CRON_SECRET` in `.env.local` if you want to test the cron locally.

Or call manually:

```bash
curl -X POST https://portal.ketchup.cc/api/v1/sms/process \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

- Fetches up to 50 pending rows where `attempts < 3`.
- Calls `sendSms()` for each; on success sets `status = 'sent'`, `sent_at`, `provider_message_id`; on failure increments `attempts`, sets `error_message`, and sets `status = 'failed'` when `attempts >= 3`.

---

## 7. Webhooks

- **Delivery**: Payload should include `messageId` (or `message_id`/`id`) and `status` (e.g. DELIVERED, SUCCESS). Updates `sms_queue` by `provider_message_id`.
- **Inbound**: Payload should include `from` (phone) and `text`. If text is STOP/UNSUBSCRIBE/END, sets `users.sms_opt_out = true` for that phone.

---

## 8. UI Wiring

- **Beneficiaries list**: “Send SMS reminder” opens confirm; on confirm calls POST `/api/v1/beneficiaries/bulk-sms` with current filtered IDs and default message; toast shows queued count.
- **Beneficiary detail**: “Trigger proof-of-life” calls POST `/api/v1/beneficiaries/:id/sms`; “SMS history” tab calls GET `/api/v1/sms/history?beneficiary_id=:id`.

---

## 9. Security & Compliance

- Do not put full PII (e.g. full ID number) in SMS body; use generic reminders.
- Respect opt-out immediately; check `sms_opt_out` before queueing.
- Rate limiting on SMS endpoints (to be added with auth).
- All sends are recorded in `sms_queue` for audit.

---

## 10. Extensions (Future)

- Agent alerts (low float, top-up approval) via same queue + `reference_type: 'agent'`.
- Field ops task assignment SMS + `reference_type: 'field_task'`.
- Multi-channel `notifications` table (SMS, in-app, push, email) with a single worker.
