# Ketchup Portals PRD v1.4.1 – Comprehensive Audit Report

**Document audited:** KETCHUP_PORTALS_PRD.md (v1.4.1)  
**Auditor role:** Senior technical lead / solutions architect (Next.js, Supabase, PostgreSQL, G2P, PSD/ETA compliance)  
**Date:** February 2026  
**Scope:** Full PRD including all sections and appendices (§1–§29, Appendix A–C).

---

## Executive Summary

The PRD is **substantial and largely implementable**, with clear module specs, API tables, and code examples. The audit identified **critical** and **high** findings mainly in security (cookie attributes, RLS, rate limiting scope), **data/schema** (preference_value type, float_requests.requested_by, audit PII), and **compliance** (dual control, retention/purge). **Medium** and **low** items cover edge cases (appeal evidence storage, clock skew logging), consistency (notification keys enum, endpoint vs permissions matrix), and documentation gaps (ENCRYPTION_KEY usage, scheduled report trigger). Recommendations are listed per finding with section references.

---

## 1. Functional Completeness & Edge Cases

### Finding 1.1: Agent appeal workflow – evidence storage not specified  
**Section:** §3.3.11, §3.3.11.4, §12.1  
**Description:** The PRD states the agent may "appeal within 7 days via the Agent Portal with supporting evidence" and that "Ketchup reviews evidence," but it does not define where evidence is stored (e.g. file storage table, Supabase Storage bucket, or inline in `resolution_notes`), maximum size, or allowed formats.  
**Severity:** High  
**Recommendation:** Add a short "Appeal evidence" subsection under §3.3.11: (1) Storage: e.g. `duplicate_redemption_events.appeal_evidence_url` (TEXT) pointing to a stored document, or a dedicated `duplicate_appeal_attachments` table with `event_id`, `file_url`, `uploaded_at`, `uploaded_by`. (2) Allowed types: e.g. PDF, images; max size (e.g. 5MB total per appeal). (3) UI: Agent Portal "Appeal" form with file upload; Ketchup view to download/see evidence before resolving.

---

### Finding 1.2: All duplicate statuses in UI/API  
**Section:** §3.3.11.4, §9 (duplicate_redemption_events), §10.2  
**Description:** Statuses `advance_posted`, `under_review`, `no_financial_impact`, `agent_appealing`, `resolved` are defined. The PRD does not explicitly require that the Duplicate Redemptions screen and PATCH API accept and display all five; missing one could block valid workflows.  
**Severity:** Medium  
**Recommendation:** In §3.3.11.4 (Duplicate Events Table) and in the API table for `PATCH /api/v1/portal/duplicate-redemptions/{id}`, state: "All statuses (`advance_posted`, `under_review`, `no_financial_impact`, `agent_appealing`, `resolved`) must be supported in filters and in the PATCH body; validation must reject any other value with 400."

---

### Finding 1.3: Clock skew – tolerance and audit logging  
**Section:** §3.3.11.2, §12.1  
**Description:** ±5 minutes tolerance for device timestamps is mentioned, but (1) where in reconciliation logic this tolerance is applied is not specified, and (2) logging of skew "for audit" is not defined (table, field, or log format).  
**Severity:** Medium  
**Recommendation:** In §3.3.11.2 or §12.1: (1) Specify that when comparing `duplicate_requested_at` (device) to server time, events within ±5 minutes are not rejected solely on time; document the exact comparison (e.g. `detected_at` vs `duplicate_requested_at`). (2) Add an audit requirement: "When device time differs from server time by more than X minutes, log to `audit_logs` (or a dedicated `clock_skew_events` table) with event_id, device_id, delta_seconds, for compliance review."

---

### Finding 1.4: Multiple advances per beneficiary – FIFO and partial recovery  
**Section:** §3.3.11.3, §12.1, §9 (beneficiary_advances)  
**Description:** FIFO recovery and "oldest advance first" are stated. The schema uses `recovered_amount` and generated `outstanding_amount` per row; the PRD does not explicitly say that when applying the next voucher, the system (1) sums outstanding across all advances for the beneficiary (and optionally programme), (2) deducts in FIFO order, and (3) for partial recovery updates `recovered_amount` and `last_recovery_at` on the oldest advance first.  
**Severity:** Medium  
**Recommendation:** In §3.3.11.3 or §12.1 add a short "Multiple advances – recovery algorithm" bullet: (1) Query `beneficiary_advances` for beneficiary (and programme if scoped) where status = outstanding, ordered by `created_at` ASC. (2) For next voucher: total_deduction = min(voucher_amount, sum(outstanding_amount)); apply deduction to rows in order, updating `recovered_amount` and `last_recovery_at` until total_deduction is consumed; create `advance_recovery_transactions` rows accordingly. (3) When `recovered_amount >= original_amount` set status to `fully_recovered`.

---

### Finding 1.5: Configuration thresholds – scope (global vs per programme)  
**Section:** §3.3.11.5  
**Description:** Parameters such as `offline_lock_ttl_minutes`, `duplicate_advance_rollover_cycles`, `agent_appeal_window_days`, `duplicate_alert_threshold_nad` are given defaults but it is not stated whether they are global or overridable per programme.  
**Severity:** Low  
**Recommendation:** In §3.3.11.5 add one row or note: "Scope: All parameters are global for v1. Per-programme overrides (e.g. `programmes.duplicate_alert_threshold_nad`) are planned for v2."

---

### Finding 1.6: Float approval – dual control threshold and workflow  
**Section:** §3.3.6, §5.3.2, §12, §12.1  
**Description:** "Dual control" and "two approvals" for trust account adjustment and "large float" are mentioned, but (1) the threshold (e.g. amount > N$50,000) is not defined, and (2) the workflow (e.g. first approver sets status to `approved_pending_second`, second approver confirms) is not specified.  
**Severity:** High  
**Recommendation:** Add §5.3.2.1 or extend §12.1: (1) Define constant or config: `dual_control_float_threshold_nad` (e.g. 50_000). (2) For float request PATCH: if amount >= threshold, require two distinct approvers: e.g. first PATCH sets status to `approved_pending_second` and stores `first_reviewed_by`/`first_reviewed_at`; second PATCH (by different user with ketchup_ops/ketchup_finance) sets status to `approved` and updates agent float. (3) Schema: add `first_reviewed_by`, `first_reviewed_at` to `float_requests` if not present. (4) Same pattern for trust account adjustment in §3.3.6.

---

### Finding 1.7: Float request – who requested (requested_by)  
**Section:** §9 (float_requests), §10.2 (POST float-requests), §26.1 (createFloatRequest)  
**Description:** The `float_requests` table has `reviewed_by` and `reviewed_at` but no `requested_by` (portal user id). The API and code example pass `session.userId` to the service but the schema does not store it, so audit trail for "who requested" is incomplete.  
**Severity:** High  
**Recommendation:** Add column `requested_by UUID REFERENCES portal_users(id)` to `float_requests` in §9 and in Drizzle/schema. In POST float-requests and in `createFloatRequest`, set `requested_by` to the authenticated user id. Document in §10.2 request/response and in §7.5 (audit) that float request creation is logged with requester.

---

### Finding 1.8: Task assignment – notification preferences  
**Section:** §6.3.3, §7.4, §7.4.1  
**Description:** "When task assigned, push notification (via email/SMS) to assignee" and preferences are described globally; implementation now respects `field_task_assigned` for SMS. The PRD does not explicitly state that email/push for task-assigned must also respect `portal_user_preferences`.  
**Severity:** Low  
**Recommendation:** In §6.3.3 add: "Notifications (in-app, email, SMS, push) must respect the assignee's `portal_user_preferences` for type `field_task_assigned`; only enabled channels are used." Cross-reference §7.4 and §8.

---

### Finding 1.9: Profile & Settings – session cookie attributes  
**Section:** §7.5 (PRD), docs/PROFILE_AND_SETTINGS.md §2.1  
**Description:** The PRD §7.5 says "set HTTP-only cookie `portal-auth`" but does not state Secure, SameSite, or path. PROFILE_AND_SETTINGS.md §2.1 correctly specifies "sameSite=Lax, secure in production, maxAge=expires_in."  
**Severity:** High (if implementers rely only on PRD)  
**Recommendation:** In §7.5 (Session) add: "Cookie `portal-auth`: HttpOnly, Secure (in production), SameSite=Lax, Path=/, Max-Age=expires_in. See Profile & Settings spec §2.1 for implementation."

---

### Finding 1.10: Password change rate limit – per user vs per IP  
**Section:** §10.3 (Change password), §20  
**Description:** Rate limit is described as "same as login (e.g. 10/min per IP or per user)." For password change, limiting per user is preferable to prevent targeted abuse of a single account.  
**Severity:** Medium  
**Recommendation:** In §10.3 and §20 state explicitly: "Rate limit for POST /api/v1/auth/change-password: 10 requests per minute **per authenticated user** (not per IP)." Implement using user id in the rate-limit key.

---

### Finding 1.11: Government scheduled reports – trigger and delivery  
**Section:** §4.2.4, §7.4.1  
**Description:** "Scheduled reports" and cron-based email delivery are mentioned, but (1) what triggers the cron (e.g. daily 06:00 UTC), (2) how recipients are determined (e.g. gov users with `report_delivery_frequency` != off in preferences), and (3) that PDF is generated and attached per `report_delivery_format` are not fully specified.  
**Severity:** Medium  
**Recommendation:** Add §4.3.4.1 or extend §4.3.4: (1) Cron trigger: e.g. daily at 06:00 UTC (configurable). (2) Query `portal_user_preferences` for key `notification_preferences` and filter users where `report_delivery_frequency` is daily/weekly and role is gov_*. (3) Generate PDF per report type (programme performance, ghost payment prevention); attach to email; respect `report_delivery_format` (pdf). (4) Store `report_delivery_frequency` and `report_delivery_format` in the same preferences JSON or as separate keys; document in §9 / Profile & Settings §8.

---

### Finding 1.12: Data hierarchy – breadcrumbs and drill-down consistency  
**Section:** §8, §27.11  
**Description:** Breadcrumbs and drill-down are described in §27.11 and §8, but the PRD does not list which list pages must have row-click → detail and which detail pages must show breadcrumbs.  
**Severity:** Low  
**Recommendation:** In §8 or §27.11 add a short table: "List pages with row-click to detail: Ketchup (beneficiaries, vouchers, agents, duplicates), Government (programmes, unverified, vouchers), Agent (parcels, transactions), Field Ops (assets, tasks). Detail pages must include breadcrumbs (e.g. Beneficiaries > [Name])."

---

## 2. Technical Consistency

### Finding 2.1: portal_user_preferences.preference_value type  
**Section:** §9.1  
**Description:** `preference_value` is TEXT; notification preferences are JSON. Storing as JSONB allows indexing and querying and avoids repeated parse/serialize.  
**Severity:** Medium  
**Recommendation:** Change `preference_value` to JSONB in §9.1 SQL and in Drizzle schema. If backward compatibility is required, add a migration that converts existing TEXT to JSONB. Update any code that reads/writes this column.

---

### Finding 2.2: commission_rate semantics  
**Section:** §9.1 (agents), §27.2 (schema)  
**Description:** `commission_rate NUMERIC(5,2) DEFAULT 0.5` – it is unclear whether 0.5 means 0.5% or 50%. This affects display and calculations.  
**Severity:** Medium  
**Recommendation:** In §9.1 and schema comments state: "commission_rate: decimal representation of percentage (e.g. 0.5 = 0.5%, 2.25 = 2.25%). Display as percentage in UI."

---

### Finding 2.3: Missing indexes on foreign keys and hot columns  
**Section:** §9.1  
**Description:** Beyond `portal_user_preferences(portal_user_id)`, the PRD does not mandate indexes on FKs (e.g. `float_requests.agent_id`, `tasks.assigned_to`, `audit_logs.user_id`) or on frequently filtered columns (`status`, `created_at`). This can cause slow list and filter queries.  
**Severity:** High  
**Recommendation:** In §9.1 add an "Indexes" subsection: e.g. index on `float_requests(agent_id)`, `float_requests(status)`, `tasks(assigned_to)`, `tasks(status)`, `audit_logs(user_id)`, `audit_logs(created_at)`, `duplicate_redemption_events(status)`, `duplicate_redemption_events(detected_at)`. Align with DATABASE_AND_API_DESIGN.md and Drizzle migrations.

---

### Finding 2.4: API endpoint vs Permissions Matrix coverage  
**Section:** §10.2, §20  
**Description:** §20 lists permissions for several portal endpoints but does not explicitly cover e.g. `GET /api/v1/portal/dashboard/summary`, `GET /api/v1/portal/duplicate-redemptions`, `GET/PATCH /api/v1/portal/duplicate-redemptions/{id}`, `GET /api/v1/portal/beneficiaries/{id}/advance-ledger`, `GET /api/v1/portal/advance-ledger/summary`, `GET /api/v1/beneficiaries`, `GET /api/v1/vouchers`, `GET /api/v1/agents`.  
**Severity:** Medium  
**Recommendation:** Extend §20 with rows for: dashboard/summary (ketchup_*), duplicate-redemptions list/PATCH (ketchup_*), advance-ledger and summary (ketchup_*, gov_* as read-only if applicable), and shared list endpoints (beneficiaries, vouchers, agents) with role restrictions. Ensure every §10.2 endpoint has a §20 entry.

---

### Finding 2.5: Pagination on all list endpoints  
**Section:** §21.1, §10.2  
**Description:** §21.1 states list endpoints accept page, limit, etc., but the §10.2 table does not mark which endpoints are list endpoints and therefore must support pagination.  
**Severity:** Low  
**Recommendation:** In §10.2 add a "Pagination" column or note: "All endpoints that return arrays (list float-requests, list tasks, list parcels, list duplicate-redemptions, list programmes, list audit-logs, list beneficiaries, list vouchers, list agents) support query params page, limit and return meta (total, page, limit, totalPages) and links."

---

### Finding 2.6: Notification preference keys – single source of truth  
**Section:** §7.4, §7.4.1, §8 (Profile & Settings), §10.3 (preferences response), PROFILE_AND_SETTINGS.md §8  
**Description:** Notification types (e.g. `agent_low_float`, `agent_float_request_approved`, `field_task_assigned`) appear in multiple places. A typo or mismatch could break preference checks.  
**Severity:** Low  
**Recommendation:** In §7.4 or §8 add: "Canonical list of notification type keys: see Profile & Settings spec §8 (or Appendix D). Backend and UI must use the same keys; add new types only via a single enum or constant exported from a shared module."

---

### Finding 2.7: Code example – createFloatRequest does not store requestedBy  
**Section:** §26.1 (lib/services/floatRequestService.ts)  
**Description:** The example calls `createFloatRequest(agent_id, amount, session.userId)` but the insert does not include `requested_by`. This aligns with Finding 1.7 (schema missing column).  
**Severity:** High (consistent with 1.7)  
**Recommendation:** After adding `requested_by` to schema (Finding 1.7), update the code example to `.values({ agent_id: agentId, amount, status: 'pending', requested_at: new Date(), requested_by: requestedBy })` and document in the comment.

---

### Finding 2.8: DashboardCards fetch – credentials already present  
**Section:** §27.9.7  
**Description:** The example already uses `fetch(..., { credentials: 'include' })`. No change needed; note for auditors that this is correct.  
**Severity:** N/A (positive finding)  
**Recommendation:** None. Optional: add a short PRD note that all authenticated API calls from the client must send credentials (cookie or Bearer) and that dashboard/summary example is correct.

---

### Finding 2.9: POST float-requests – agent_id validation for agent role  
**Section:** §10.2, §26.1  
**Description:** For role `agent`, the backend must ensure `agent_id` in the body matches the session's `agent_id` so an agent cannot create requests for another agent. The example validates amount but does not show this check.  
**Severity:** High  
**Recommendation:** In §10.2 (POST float-requests) and in §26.1 code example add: "When role is `agent`, require body.agent_id to equal session.agent_id; otherwise return 403." In the route example: `if (session.role === 'agent' && body.agent_id !== session.agentId) return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });`

---

## 3. Security Vulnerabilities

### Finding 3.1: Cookie attributes not in main PRD  
**Section:** §7.5  
**Description:** See Finding 1.9. Cookie security (HttpOnly, Secure, SameSite) is critical and should be explicit in the main PRD.  
**Severity:** High  
**Recommendation:** Same as 1.9: add full cookie attributes in §7.5 and reference Profile & Settings.

---

### Finding 3.2: Row-level security (RLS) not specified  
**Section:** §12 (Authorization), §9  
**Description:** The PRD states "RLS in PostgreSQL enforced via Supabase" but no policies are defined. Without them, a single API bug could expose cross-tenant or cross-role data.  
**Severity:** Critical  
**Recommendation:** Add §12.2 "Row-Level Security (Outline)": (1) `agents`: agent role can SELECT only where id = session.agent_id; ketchup_* can SELECT/UPDATE all. (2) `float_requests`: agent can SELECT/INSERT only own agent_id; ketchup_ops/finance can SELECT/UPDATE all. (3) `tasks`: field_tech can SELECT/UPDATE where assigned_to = session.user_id; field_lead can SELECT/INSERT/UPDATE all. (4) `portal_user_preferences`: users can SELECT/UPDATE only own portal_user_id. (5) `audit_logs`: restrict by role (e.g. ketchup_* see all, gov_* see gov actions). Provide policy names and conditions; full SQL can live in DATABASE_AND_API_DESIGN.md or a migrations doc.

---

### Finding 3.3: ENCRYPTION_KEY usage not documented  
**Section:** §17, §12  
**Description:** ENCRYPTION_KEY is listed and §12 says "sensitive PII encrypted at rest (column-level via pgcrypto)" but the PRD does not state which columns or how the key is used (e.g. which service encrypts/decrypts, key rotation).  
**Severity:** High  
**Recommendation:** In §12 or §17 add: "ENCRYPTION_KEY is used for [e.g. encrypting beneficiary phone/name in column X, or for token vault]. Columns encrypted: [list]. Rotation: [e.g. re-encrypt on key change, runbook in security doc]." If not yet implemented, mark as "Planned; document when implemented."

---

### Finding 3.4: Audit log PII and data minimization  
**Section:** §9.1 (audit_logs), §12 (Data Minimization)  
**Description:** §12 says "no PII in logs" but `audit_logs` has `old_data` and `new_data` as JSONB, which could contain PII (e.g. beneficiary name, phone) when logging updates to users/vouchers.  
**Severity:** High  
**Recommendation:** In §9.1 and §12 specify: "When logging to audit_logs, redact PII from old_data/new_data for entity types beneficiary, portal_user (e.g. mask phone, email, name with ***). Log only entity_type, entity_id, and non-PII field names and non-sensitive values." Add a short "Audit log redaction" subsection under §12.

---

### Finding 3.5: Login and sensitive action logging  
**Section:** §7.5 (Audit Logging)  
**Description:** Audit logging is required for "all user actions" but login attempts (success and failure) are not explicitly listed. For security monitoring and PSD/ETA, failed and successful logins should be logged.  
**Severity:** Medium  
**Recommendation:** In §7.5 add: "Log to audit_logs (or a dedicated auth_events table): successful login (user_id, ip, user_agent, timestamp); failed login (identifier used, ip, user_agent, timestamp). Do not log passwords or tokens."

---

### Finding 3.6: 2FA setup route accessibility  
**Section:** §25.3  
**Description:** "After login, if 2FA not set, redirect to `/auth/2fa/setup`." Middleware must allow unauthenticated access to login but authenticated access to 2FA setup; if 2FA setup is under a protected path, the redirect must occur after auth and the route must be reachable without triggering auth redirect.  
**Severity:** Medium  
**Recommendation:** In §25.3 or §26.3 add: "Ensure middleware allows GET /auth/2fa/setup only for authenticated users who have not yet set 2FA; redirect others to dashboard or login as appropriate. Do not expose /auth/2fa/setup to unauthenticated users."

---

### Finding 3.7: CORS  
**Section:** §12, §10  
**Description:** If the frontend and API are on the same origin (e.g. same Vercel project), CORS may not be an issue. If API is ever on a different subdomain or used by a separate SPA, CORS must be configured.  
**Severity:** Low  
**Recommendation:** In §12 or §18 add one line: "CORS: If API is consumed from a different origin than the portal app, configure Access-Control-Allow-Origin (and credentials if using cookies) per environment; same-origin deployment requires no CORS for cookie auth."

---

## 4. Performance & Scalability

### Finding 4.1: Indexes (see Finding 2.3)  
**Section:** §9.1  
**Description:** Same as 2.3 – missing indexes affect performance.  
**Severity:** High  
**Recommendation:** As in 2.3.

---

### Finding 4.2: Dashboard summary caching  
**Section:** §3.3.1, §10.2 (dashboard/summary)  
**Description:** Dashboard refresh is "every 5 minutes" but there is no requirement to cache the summary response server-side to avoid repeated DB load.  
**Severity:** Low  
**Recommendation:** In §3.3.1 or §10.2 add: "Optional: Cache GET /api/v1/portal/dashboard/summary response for 1–5 minutes (e.g. in-memory or Vercel KV) to reduce DB load; invalidate on relevant data changes or accept stale reads for dashboard."

---

### Finding 4.3: Map and real-time  
**Section:** §3.3.8, §6.3.1  
**Description:** Marker clustering and "up to 500 markers" are mentioned; real-time subscription on asset_locations is specified. The PRD does not require RLS on broadcast or limiting broadcast fields.  
**Severity:** Low  
**Recommendation:** In §6.3.1 or §12 note: "Supabase Realtime: apply RLS so subscribers receive only rows they are allowed to see; broadcast only necessary fields (e.g. id, lat, lng, status) for map performance."

---

## 5. Compliance & Regulatory

### Finding 5.1: Audit log retention and purge  
**Section:** §7.5, §24  
**Description:** "Retained for 5 years (ETA s.24)" is stated but there is no mention of a purge or archival process after 5 years, or how to comply with "right to erasure" within legal limits.  
**Severity:** Medium  
**Recommendation:** In §7.5 or §24 add: "After 5 years, audit logs may be archived or purged per retention policy; document process in runbook. Where regulation requires longer retention, configure accordingly. Personal data in audit logs (e.g. IP) may be anonymized after N months per privacy policy."

---

### Finding 5.2: PSD-12 incident reporting process  
**Section:** §3.2.7, §12  
**Description:** "Integration with incident response workflow (PSD-12)" and "Notifies BoN compliance officer" are mentioned but the step-by-step process (who creates incident, who is notified, how BoN is notified, SLA) is not detailed.  
**Severity:** Medium  
**Recommendation:** Add a short "PSD-12 incident workflow" under §12 or §3.2.7: (1) Who can create an incident (e.g. ketchup_compliance, gov_auditor). (2) Fields required (date, description, impact, actions taken). (3) How BoN is notified (e.g. email to configured address, or export and manual send). (4) Resolution and closure steps. Reference external PSD-12 doc if needed.

---

### Finding 5.3: Dual control (see Finding 1.6)  
**Section:** §3.3.6, §12  
**Description:** Dual control for adjustments and large float is not fully specified.  
**Severity:** High  
**Recommendation:** As in Finding 1.6.

---

## 6. Documentation Clarity

### Finding 6.1: Glossary – Advance Ledger, Duplicate Redemption  
**Section:** §16  
**Description:** Terms such as "Advance Ledger," "Duplicate Redemption," "Canonical redemption," "Advance recovery" are used throughout but not all are in the Glossary.  
**Severity:** Low  
**Recommendation:** In §16 add: **Advance Ledger** – Record of over-disbursements (duplicate redemptions) to be recovered from future beneficiary disbursements. **Duplicate Redemption** – A second redemption of the same voucher (e.g. offline double-spend). **Canonical redemption** – The first accepted redemption event for a voucher. **Advance recovery** – Deduction from a future voucher to repay an advance.

---

### Finding 6.2: Cross-reference to DATABASE_AND_API_DESIGN.md  
**Section:** §9, §29  
**Description:** §9 and §29 reference docs/DATABASE_AND_API_DESIGN.md. Ensure that document exists and is kept in sync (schema, indexes, regions).  
**Severity:** Low  
**Recommendation:** In PRD maintenance notes or §29 state that DATABASE_AND_API_DESIGN.md is the technical companion and must be updated when schema or API changes; list sections that mirror PRD (e.g. regions §1.1.1, portal_user_preferences, indexes).

---

## 7. Code Quality & Implementation Readiness

### Finding 7.1: TypeScript types for dashboard response  
**Section:** §27.9.7  
**Description:** The example uses `json.data ?? json` and `Record<string, number>`; a concrete interface for the dashboard summary (activeVouchers, beneficiariesCount, agentsCount, pendingFloatRequestsCount) would improve type safety.  
**Severity:** Low  
**Recommendation:** In §27.9.7 or §10.2 add an optional "Response type" note: e.g. `interface DashboardSummary { activeVouchers: number; beneficiariesCount: number; agentsCount: number; pendingFloatRequestsCount: number }` and use it in the DashboardCards example.

---

### Finding 7.2: Error handling in code examples  
**Section:** §26.1, §27  
**Description:** Examples use try/catch and return 500 with a generic message; they do not show structured logging (e.g. logger.error with route and err).  
**Severity:** Low  
**Recommendation:** In §26 or §19 add a note: "In production, log errors with request id, route, and user id (if any) using the app logger; use jsonError() or equivalent for consistent error shape and status codes."

---

## 8. Integration with Beneficiary Platform

### Finding 8.1: sms_queue and shared schema  
**Section:** §11, §7.4.1  
**Description:** The PRD assumes an `sms_queue` table and shared DB; it does not state whether sms_queue is in the same Neon schema or in the Beneficiary Platform.  
**Severity:** Low  
**Recommendation:** In §11 add: "SMS queue: [Assume sms_queue is in the same database/schema as portal tables, or document the cross-service contract if it lives in another service.] All portal-originated SMS (agents, field ops, beneficiaries) use the same queue and gateway; see §7.4.1."

---

## 9. Monitoring & Observability

### Finding 9.1: How metrics are collected  
**Section:** §23  
**Description:** Metrics (duplicate rate, float response time, etc.) are listed with targets, but the mechanism (e.g. log aggregation, custom metrics endpoint, DB queries in a dashboard) is not defined.  
**Severity:** Medium  
**Recommendation:** In §23 add: "Collection: [e.g. Application logs include structured fields (route, duration, user_id); duplicate rate and float response time are computed from DB or log aggregation. Alternatively, expose a /metrics endpoint (Prometheus format) or use Vercel Analytics + custom events.] Alerts: [e.g. Sentry for errors; PagerDuty/email for threshold breaches from monitoring tool.]"

---

### Finding 9.2: Alerting channels  
**Section:** §23  
**Description:** "Alert if spike above baseline" and similar targets are given but the alerting channel (email, Slack, etc.) and ownership are not.  
**Severity:** Low  
**Recommendation:** In §23 add one row or sentence: "Alert delivery: [e.g. email to ops@, Slack #alerts]. Owner: [e.g. Ketchup ops team]. Thresholds are configured in [e.g. Sentry, Datadog, or log-based alerting]."

---

## 10. Testing

### Finding 10.1: Critical flows in test strategy  
**Section:** §22  
**Description:** E2E and integration tests cover login, float, tasks, duplicate redemptions, Profile/Settings. The appeal workflow (agent submits evidence, Ketchup resolves) and 2FA setup are not explicitly listed.  
**Severity:** Medium  
**Recommendation:** In §22 add to E2E or integration: "Duplicate redemption appeal: Agent (or mock) sets status to agent_appealing with notes; Ketchup user resolves to resolved/no_financial_impact; assert advance and notifications. 2FA setup: After login, redirect to /auth/2fa/setup; complete TOTP setup; next login requires TOTP code."

---

### Finding 10.2: Test data seeding  
**Section:** §22  
**Description:** "Use seeded data" is mentioned but there is no reference to a seed script or fixture set (e.g. users per role, float requests in various statuses, duplicate events).  
**Severity:** Low  
**Recommendation:** In §22 add: "Seed data: Maintain a seed script (e.g. drizzle/seed.ts or fixtures in tests/) with at least one user per role, sample agents, float_requests (pending/approved/rejected), duplicate_redemption_events in each status, and beneficiary_advances for recovery tests."

---

## 11. Post-audit implementation status

The following items have been implemented and documented.

### 11.1 Duplicate redemptions – canonical reference column

- **Schema:** `duplicate_redemption_events` uses `canonical_redemption_ref` (TEXT), not `canonical_redemption_id` (UUID), so the system can store a reference to the legitimate redemption even if it lives in another system.
- **Migration:** `drizzle/0006_canonical_redemption_ref.sql` renames `canonical_redemption_id` → `canonical_redemption_ref` and alters type to TEXT (existing UUIDs cast to text). Apply with `npm run db:migrate` or run the SQL manually.
- **Drizzle push prompt:** When running `drizzle-kit push`, if prompted whether the column is new or renamed, choose **rename column** (`canonical_redemption_id` → `canonical_redemption_ref`) so existing data is preserved.
- **Docs:** KETCHUP_PORTALS_PRD.md §9 and docs/DATABASE_AND_API_DESIGN.md §1 list `canonical_redemption_ref` (TEXT) and `appeal_evidence_url`.

### 11.2 Configurable RBAC (roles and permissions)

- **Schema:** `roles`, `permissions`, `role_permissions`; `portal_users.role_id` (optional FK to `roles`). When `role_id` is set, permissions come from the database; otherwise from legacy `role` text via `LEGACY_ROLE_PERMISSIONS`.
- **Admin API:** Admins manage roles and user assignments via API (no hardcoded role checks):
  - `GET/PUT /api/v1/admin/roles` (list, update role name/description/permission_ids) – requires `admin.manage_roles`.
  - `GET /api/v1/admin/permissions` – requires `admin.manage_roles` or `admin.manage_users`.
  - `GET /api/v1/admin/users`, `PATCH /api/v1/admin/users/:id` (list users, set user role) – requires `admin.manage_users` or `admin.manage_roles`.
- **Seeding:** `scripts/seed-roles-permissions.mjs` seeds roles, permissions, and role_permissions from the legacy mapping; `npm run db:seed` runs it before portal user seed and sets `portal_users.role_id` for seeded users.
- **Guards:** Float list/summary and float request POST/PATCH use `requirePermission(request, "float_requests.list" | "float_requests.approve" | "agent.float.request", route)` instead of hardcoded role names.

### 11.3 Validation checklist

| Check | Location |
|-------|----------|
| Schema defines `canonical_redemption_ref` TEXT | `src/db/schema.ts` (duplicateRedemptionEvents) |
| Seed uses `canonical_redemption_ref` | `scripts/seed-portal.mjs` |
| Service uses `canonical_redemption_ref` | `src/lib/services/duplicate-redemption-service.ts` |
| Migration 0006 applied | `drizzle/0006_canonical_redemption_ref.sql` |
| Roles/permissions seeded | `npm run db:seed` or `npm run db:seed:roles` |
| Admin can set user role | `PATCH /api/v1/admin/users/:id` with `role_id` |
| Admin can set role permissions | `PUT /api/v1/admin/roles/:id` with `permission_ids` |

---

## Summary Table

| Severity | Count |
|----------|-------|
| Critical | 1 (RLS) |
| High     | 8 (appeal evidence, dual control, requested_by, cookie attributes, agent_id validation, RLS, ENCRYPTION_KEY, audit PII) |
| Medium   | 14 (statuses, clock skew, FIFO/partial recovery, rate limit per user, scheduled reports, preference_value type, commission_rate, indexes, permissions matrix, login logging, 2FA route, retention/purge, PSD-12 workflow, metrics collection, test flows) |
| Low      | 10 (threshold scope, task notification prefs, drill-down table, notification keys enum, pagination column, CORS, dashboard cache, map RLS, glossary, DATABASE_AND_API_DESIGN sync, TypeScript types, error logging, sms_queue, alerting channels, seed data) |

---

## Recommended Priority Order for Remediation

1. **Critical:** Define RLS outline (§12.2) and implement policies.
2. **High:** Add cookie attributes (§7.5); add `requested_by` to float_requests and code; validate agent_id for agent role; document ENCRYPTION_KEY usage; specify audit log PII redaction; specify dual control workflow and threshold; add appeal evidence storage.
3. **Medium:** Fix preference_value to JSONB; add indexes; align §20 with §10.2; rate limit change-password per user; scheduled report trigger and preferences; clock skew logging; FIFO/partial recovery algorithm; login audit logging; 2FA route note; retention/purge; PSD-12 workflow; metrics collection; test coverage for appeal and 2FA.
4. **Low:** Apply remaining documentation and small consistency improvements as part of regular PRD updates.

---

*End of audit report.*
