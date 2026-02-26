# Ketchup Portals – What’s Left to Implement

**Reference:** `KETCHUP_PORTALS_PRD.md` v1.4, `PRD_IMPLEMENTATION_STATUS.md`  
**Purpose:** Single checklist of remaining work for MVP and post-MVP.

---

## Already done (recent)

- **Profile & Settings:** Session (cookie + GET `/api/v1/portal/me`), password change (POST `/api/v1/auth/change-password`), notification preferences (GET/PATCH `/api/v1/portal/user/preferences`), `portal_user_preferences` table, NotificationPreferencesForm and ChangePasswordForm on all four Settings pages, `/settings` redirect by role.
- **Ketchup Dashboard:** GET `/api/v1/portal/dashboard/summary` (activeVouchers, beneficiariesCount, agentsCount, pendingFloatRequestsCount); KetchupDashboard uses it with LoadingState/ErrorState. **401 → redirect to `/login?redirect=...`** so unauthenticated users are sent to sign-in and returned to the dashboard after login.
- **RBAC (permission-based):** Roles and permissions in DB; `requirePermission` / `requireAnyPermission` on portal and admin endpoints; admin APIs: GET/PUT `/api/v1/admin/roles`, GET/PUT `/api/v1/admin/roles/:id`, GET `/api/v1/admin/permissions`, GET `/api/v1/admin/users`, PATCH `/api/v1/admin/users/:id`. Float request approve/request and dashboard/summary require appropriate permission slugs. Seed: `npm run db:seed` creates roles, permissions, and portal users (password `TestPassword1!`). See README “Portal auth & seed users”.
- **Namibia’s 14 regions:** Single source of truth `src/lib/regions.ts`; all region filters and dropdowns (beneficiaries, agents, compliance, network map, government unverified, duplicate redemptions) use `REGION_SELECT_OPTIONS`; list APIs validate `region` query param and return 400 for invalid values.
- **Apply notification preferences when sending:** Float approve/reject and task-assigned SMS respect `portal_user_preferences` (notification_preferences); `src/lib/services/notification-preferences.ts` (`isNotificationChannelEnabled`, `shouldSendToAny`). In-app notifications still created; SMS only if user enabled that channel for the type.
- **Duplicate redemptions schema:** `duplicate_redemption_events.canonical_redemption_ref` (TEXT); migration `0006_canonical_redemption_ref.sql` renames from `canonical_redemption_id`. Apply with `npm run db:migrate` or `node scripts/apply-0005-0006.mjs`.

---

## 1. Auth & permissions (MVP)

| Item | PRD | Status |
|------|-----|--------|
| **Enforce RBAC on API routes** | §20 | **Done for core routes:** dashboard/summary, admin (roles, permissions, users), float request approve/request use `requirePermission`/`requireAnyPermission`. Remaining: ensure every `/api/v1/portal/*` and shared list endpoint has an appropriate permission check. |
| **2FA (TOTP) for sensitive roles** | §25 | Not implemented. Optional for MVP; required for roles like `ketchup_finance` if policy says so. |
| **Password reset flow (forgot password)** | §25 | Request reset email + confirm with token not implemented. Login exists; reset is separate flow. |
| **Apply notification preferences when sending** | §7.4, §8.2 | ✅ **Done.** Float approve/reject and task-assigned SMS gated by `portal_user_preferences` via `src/lib/services/notification-preferences.ts`. |

---

## 2. Backend / API (MVP)

| Item | PRD | Status |
|------|-----|--------|
| **Audit logging to DB** | §7.5, §9 | Audit log UI exists; backend does not write to `audit_logs` on actions (voucher issue, float approve, etc.). |
| **POST advance-recovery** | §10.2 | Trigger manual advance recovery for a cycle. Optional; GET advance-ledger and summary exist. |
| **Email: password reset & onboarding** | §7.4.1 | SMTP/sendEmail exists; wire into “forgot password” and “welcome/set password” when those flows exist. |

---

## 3. UI / features (MVP)

| Item | PRD | Status |
|------|-----|--------|
| **Voucher “Expire now”** | §3.2.3 | Optional action on voucher detail. |
| **Agent enrolment UI** | §3.2.4 | Create/new agent form; list and detail exist. |
| **Unit/ATM creation form** | §3.2.5 | Add mobile unit or ATM; list/detail/maintenance exist. |
| **Government reports (PDF)** | §4.2.4 | Generate programme/audit reports as PDF download; report type selection exists. |
| **Global search** | §7.6 | Not implemented; per-list filters exist. |

---

## 4. Infra & quality (MVP / polish)

| Item | PRD | Status |
|------|-----|--------|
| **Testing** | §22 | Add integration tests for new endpoints (me, preferences, change-password, dashboard/summary). E2E for Settings and dashboard. |
| **Monitoring** | §23 | Define and wire metrics (duplicate rate, float response time, API latency, etc.) to logging or APM. |
| **OpenAPI 3.1 spec** | §10 | Optional; document `/api/v1` in YAML. |

---

## 5. Out of scope for v1 (PRD v1.4)

- Supabase Auth (current: custom JWT/cookie auth).
- Supabase Realtime for live updates.
- Supabase Storage for file uploads.
- Additional languages (Afrikaans, Oshiwambo); English only for v1.
- OTP/verification via SMS (v2).
- Consent management / Open Banking (v2).
- AI/ML fraud detection dashboard (v2).

---

## Suggested order

1. **RBAC coverage** – Ensure every portal and shared API route has `requirePermission` or `requireAnyPermission` where appropriate (many already do).
2. **Audit logging** – Write to `audit_logs` on key actions (issue voucher, approve/reject float, duplicate resolution, etc.).
3. **Password reset** – Forgot password + email with reset link + confirm endpoint.
4. **PDF reports** – Government programme/audit report as PDF.
5. **2FA** – If required by policy for certain roles.
6. **Remaining UI** – Expire voucher, agent enrolment, unit/ATM creation, global search as needed.

Use `PRD_IMPLEMENTATION_STATUS.md` for the full per-section breakdown; this file is the short “what’s left” list.
