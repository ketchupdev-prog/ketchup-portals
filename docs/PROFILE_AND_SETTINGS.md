# Profile & Settings – Specification (Production-Ready)

Per-portal specification for **Profile** and **Settings** pages. Aligns with PRD §5.2.5 (Agent Profile & Settings), §5.3.5, §7.1 (Auth), §7.4 (Notifications and preferences). All implementation details are explicit; no placeholders.

**Tech stack:** Next.js App Router, `portal_users` table with bcrypt (existing auth), Neon PostgreSQL, Drizzle ORM. Optional: Supabase Auth or Neon Auth can replace custom auth later; this spec uses the current login/register flow and extends it.

---

## 1. Profile vs Settings

| Page | Purpose |
|------|--------|
| **Profile** | Who you are: name, contact, role, and (for Agent) business details (float, commission, status). Read-heavy; account data from session and APIs. |
| **Settings** | How the app behaves for you: password change, notification preferences. Edit-focused; persisted in `portal_users` and `portal_user_preferences`. |

---

## 2. Session and current user

### 2.1 Session retrieval

- **Source of truth:** `portal_users` (id, email, full_name, role, agent_id, phone). Auth uses existing `POST /api/v1/auth/login` (email + password → JWT-like `access_token` in response body).
- **Implementation:** Add cookie-based session so portal routes can identify the user without client-stored tokens.
  - On successful login, set an HTTP-only cookie (e.g. `portal-auth`) with the value of `access_token`, path `/`, sameSite=Lax, secure in production, maxAge=expires_in.
  - Add `GET /api/v1/portal/me`: reads `portal-auth` cookie (or `Authorization: Bearer <token>`), decodes token to get `sub` (user id), fetches `portal_users` by id, returns `{ id, email, full_name, role, agent_id, phone }`. Response 401 if missing/invalid.
  - Profile and Settings pages (client components) call `GET /api/v1/portal/me` on mount; result is used for Account section and for “current user” in preferences API.
- **Fallback when not logged in:** If `GET /api/v1/portal/me` returns 401 or cookie is absent, Profile/Settings pages show static copy: “Sign in to see your profile” and a link to `/login`. No mock name/email; only the role label (e.g. “Ketchup operations”) can be inferred from the current path (e.g. `/ketchup/profile`) for display until the user signs in.

### 2.2 Role-to-portal mapping

Used for `/settings` redirect and for showing the correct Settings href in the header.

- `agent` → `/agent/*`, settings href `/agent/settings`
- `ketchup_ops` | `ketchup_compliance` | `ketchup_finance` | `ketchup_support` → `/ketchup/*`, settings href `/ketchup/settings`
- `gov_manager` | `gov_auditor` → `/government/*`, settings href `/government/settings`
- `field_tech` | `field_lead` → `/field-ops/*`, settings href `/field-ops/settings`

---

## 3. Agent portal

### 3.1 Profile (`/agent/profile`)

| Section | Content | Source |
|--------|---------|--------|
| **Account** | Full name, email | `GET /api/v1/portal/me` (from session). If 401: show “Sign in to see your profile” + link to `/login`. |
| **Agent details** | Name, address, phone, email, commission rate, float balance, status | `GET /api/v1/agents/[id]` where `id` is `me.agent_id` from `/portal/me`. If `agent_id` is null, show “No agent linked. Contact Ketchup to link your account.” |
| **Actions** | Links: “Float” → `/agent/float`, “Transaction history” → `/agent/transactions`, “Parcels” → `/agent/parcels`, “Change password” → `/agent/settings` | Sidebar already provides Float, Transactions, Parcels; add a “Change password” link in the Profile page that goes to Settings. |

**API:** No new endpoints. Use existing `GET /api/v1/portal/me` (to be added) and `GET /api/v1/agents/[id]`. Agent profile page must only request agent by id when session has `agent_id`; otherwise show the “No agent linked” state.

### 3.2 Settings (`/agent/settings`)

| Section | Content | Implementation |
|--------|---------|----------------|
| **Password** | Change password | Form: current password, new password, confirm new password. Validation: new password min 8 chars; confirm must match new. Submit to `POST /api/v1/auth/change-password` (see §9). On success: toast “Password updated”; on 400/401: toast with error. Use existing `Button`, `FormField`, `Input` (type password); DaisyUI form-control. |
| **Commission rate** | Read-only | Do not duplicate. Single line: “Your commission rate is set by Ketchup and shown on your [Profile](/agent/profile).” with link to `/agent/profile`. |
| **Notifications** | Low float alert, float request approved/rejected, parcel ready | List of toggles per notification type (see §8). Each row: label + toggle (in-app on/off) and optionally “Also send email” / “Also send SMS” where applicable. Save button submits to `PATCH /api/v1/portal/user/preferences` (see §9). Data from `GET /api/v1/portal/user/preferences`. |

**Notification types for Agent (enum in code and DB):** `agent_low_float`, `agent_float_request_approved`, `agent_float_request_rejected`, `agent_parcel_ready`. Channels: `in_app` (always created when notification is sent), `email`, `sms`. Preferences store which channels are enabled per type.

---

## 4. Ketchup portal

### 4.1 Profile (`/ketchup/profile`)

| Section | Content | Source |
|--------|---------|--------|
| **Account** | Full name, email, role label | `GET /api/v1/portal/me`. Role displayed as “Ketchup operations” (or “Ketchup compliance”, etc.) derived from `role` (e.g. map `ketchup_ops` → “Ketchup operations”). If 401: “Sign in to see your profile” + link to `/login`. |
| **Department / assigned regions** | Out of scope for this release | Not stored in `portal_users` or elsewhere. Omitted from UI. Can be added in a later phase via `portal_users` metadata or a dedicated table. |

### 4.2 Settings (`/ketchup/settings`)

| Section | Content | Implementation |
|--------|---------|----------------|
| **Password** | Change password | Same as Agent: same reusable component, `POST /api/v1/auth/change-password`. |
| **Notifications** | In-app alerts: new duplicate detected, high-value adjustment | Types: `ketchup_duplicate_detected`, `ketchup_high_value_adjustment`. Optional: “Email digest” (daily summary) stored as preference key `email_digest` (daily vs off). UI: toggles per type (in_app, email) + one “Daily email digest” toggle. Save → `PATCH /api/v1/portal/user/preferences`. |
| **Default date range for reports** | Out of scope for this release | Reduces scope; can be added later in `portal_user_preferences` with key `report_date_range` and value `7d` | `30d` | `90d`. Omitted from Settings UI. |

---

## 5. Government portal

### 5.1 Profile (`/government/profile`)

| Section | Content | Source |
|--------|---------|--------|
| **Account** | Full name, email, role label | `GET /api/v1/portal/me`. Role displayed as “Government manager” / “Government auditor” from `role`. If 401: “Sign in to see your profile” + link to `/login`. |
| **Ministry/department, view-only programmes** | Out of scope for this release | Not in schema. Omitted; can be added later if required. |

### 5.2 Settings (`/government/settings`)

| Section | Content | Implementation |
|--------|---------|----------------|
| **Password** | Change password | Reuse same component, `POST /api/v1/auth/change-password`. |
| **Notifications** | Report ready (e.g. PDF by email), duplicate redemption supervisor alert | Types: `gov_report_ready`, `gov_duplicate_alert`. Channels: in_app, email. For “report ready”: add optional preference `report_delivery_frequency` (off | daily | weekly) and `report_delivery_format` (pdf). Stored in `portal_user_preferences` as JSON or separate rows (see §8). UI: toggles for in_app/email per type; dropdown for report frequency and format. |
| **Config link** | Link to Configuration | Button/link “Open Configuration” → `/government/config`. No logic change. |

---

## 6. Field Ops portal

### 6.1 Profile (`/field-ops/profile`)

| Section | Content | Source |
|--------|---------|--------|
| **Account** | Full name, email, role label, phone (if set) | `GET /api/v1/portal/me`. Role: “Field technician” / “Field lead”. If 401: “Sign in to see your profile” + link to `/login`. Phone displayed if `me.phone` is set (used for SMS task alerts). |
| **Assigned assets/region, driver vs technician** | Out of scope for this release | Assignments are in `tasks.assigned_to` and asset links; no dedicated “my assigned region” column. Profile shows only account info. Can be added later. |

### 6.2 Settings (`/field-ops/settings`)

| Section | Content | Implementation |
|--------|---------|----------------|
| **Password** | Change password | Reuse same component, `POST /api/v1/auth/change-password`. |
| **Notifications** | Task assigned, route updated | Types: `field_task_assigned`, `field_route_updated`. Channels: in_app, email, sms (SMS uses `portal_users.phone`). UI: toggles per type and channel. Save → `PATCH /api/v1/portal/user/preferences`. |
| **Push notifications** | Optional for PWA/field devices | If Field Ops PWA is in scope: add “Enable push” button that calls existing `POST /api/v1/push/subscribe` and stores subscription; preference key `push_enabled`. Otherwise omit from this release. |
| **Map default view / filter defaults** | Out of scope for this release | Omitted; can be added later in preferences (e.g. `map_default_zoom`, `filter_asset_types`). |

---

## 7. Shared /settings route

- **Decision:** Option B. Header is portal-aware and sets Settings href to the current portal’s settings page. A single `/settings` route exists as a fallback for direct navigation.
- **Implementation:**
  - Header already uses `settingsHrefByPortal(pathname)` and passes `href` for “Settings” in nav items. No change.
  - **`/settings` page (app/settings/page.tsx):** Client component. Call `GET /api/v1/portal/me`. If 200, redirect to the settings page for the user’s role: `agent` → `/agent/settings`, ketchup_* → `/ketchup/settings`, gov_* → `/government/settings`, field_* → `/field-ops/settings`. If user has multiple roles, redirect to the first matching portal (e.g. if role is `ketchup_ops`, go to `/ketchup/settings`). If 401, redirect to `/login?redirect=/settings`. No “choose a portal” UI in this phase; single-role assumption.

---

## 8. Database: portal_user_preferences

### 8.1 Schema

New table for notification and other preferences. Drizzle migration (e.g. `drizzle/0003_portal_user_preferences.sql`).

```sql
CREATE TABLE IF NOT EXISTS portal_user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_user_id uuid NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  preference_key text NOT NULL,
  preference_value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(portal_user_id, preference_key)
);

CREATE INDEX idx_portal_user_preferences_portal_user_id ON portal_user_preferences(portal_user_id);
```

- **preference_key:** e.g. `notify:agent_low_float:in_app`, `notify:agent_low_float:email`, `notify:agent_low_float:sms`, `email_digest`, `report_delivery_frequency`, `report_delivery_format`. Or a single JSON key `notification_preferences` with value a JSON object; then one row per user. **Decision:** Use one row per user with key `notification_preferences` and value JSON object `{ "agent_low_float": { "in_app": true, "email": false, "sms": true }, ... }` to avoid many rows and keep PATCH simple. Alternative: one row per (portal_user_id, key) where key is e.g. `notify:agent_low_float` and value is JSON `{ "in_app": true, "email": false }`. This spec uses **single row per user**, key `notification_preferences`, value JSON.
- **preference_value:** JSON string. Schema of the JSON: `Record<string, { in_app?: boolean; email?: boolean; sms?: boolean }>` for notification types; plus optional keys `email_digest`, `report_delivery_frequency`, `report_delivery_format` as needed.

**Drizzle schema (add to src/db/schema.ts):**

```ts
export const portalUserPreferences = pgTable("portal_user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  portalUserId: uuid("portal_user_id").notNull().references(() => portalUsers.id, { onDelete: "cascade" }),
  preferenceKey: text("preference_key").notNull().default("notification_preferences"),
  preferenceValue: text("preference_value"), // JSON string
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex().on(t.portalUserId, t.preferenceKey)]);
```

For extensibility, allow multiple keys per user (e.g. `notification_preferences`, `report_preferences`). So unique on (portal_user_id, preference_key). Default key for notifications: `notification_preferences`.

### 8.2 Applying preferences when sending notifications

- When creating an in-app notification (insert into `in_app_notifications`), always insert if the event type is relevant (no preference check for in_app; or check preference and skip if disabled).
- When sending email or SMS (e.g. float approved, task assigned), before sending: load `portal_user_preferences` for the recipient portal user id, key `notification_preferences`, parse JSON, and check the corresponding type and channel (e.g. `agent_float_request_approved.email === true`). If not enabled, skip sending that channel. If key is missing, default: in_app only (no email/SMS) or define product default (e.g. email on for critical types).

### 8.3 Notification preference keys (per portal)

Used inside the `notification_preferences` JSON object. Each key maps to `{ in_app?: boolean; email?: boolean; sms?: boolean }`. Defaults: `in_app: true`, `email: false`, `sms: false` unless stated otherwise.

| Portal | Key | Description |
|--------|-----|-------------|
| Agent | `agent_low_float` | Low float threshold alert |
| Agent | `agent_float_request_approved` | Float request approved |
| Agent | `agent_float_request_rejected` | Float request rejected |
| Agent | `agent_parcel_ready` | Parcel ready for collection |
| Ketchup | `ketchup_duplicate_detected` | New duplicate redemption detected |
| Ketchup | `ketchup_high_value_adjustment` | High-value trust/adjustment |
| Ketchup | `email_digest` | Daily email digest (value: `"off"` \| `"daily"`; not a channel object) |
| Government | `gov_report_ready` | Scheduled report ready (e.g. PDF) |
| Government | `gov_duplicate_alert` | Duplicate redemption supervisor alert |
| Government | `report_delivery_frequency` | Value: `"off"` \| `"daily"` \| `"weekly"` |
| Government | `report_delivery_format` | Value: `"pdf"` |
| Field Ops | `field_task_assigned` | Task assigned to user |
| Field Ops | `field_route_updated` | Route updated |

---

## 9. API endpoints

### 9.1 GET /api/v1/portal/me

- **Purpose:** Return current portal user from session.
- **Auth:** Cookie `portal-auth` (JWT) or `Authorization: Bearer <token>`. Decode token, get `sub` (user id). If invalid or expired, return 401.
- **Response 200:** `{ id, email, full_name, role, agent_id, phone }` (snake_case or camelCase consistently; match existing API style).
- **Response 401:** `{ error: "Unauthorized" }`.
- **Implementation:** Read cookie in route or via a shared `getSession(request)` that returns null or `{ userId, email, role }`. Query `portal_users` by id, return selected fields.

### 9.2 POST /api/v1/auth/change-password

- **Purpose:** Change password for the authenticated portal user.
- **Auth:** Required. Cookie or Bearer token; identify user from `sub`.
- **Body:** `{ current_password: string, new_password: string }`. Validate with Zod: new_password min 8 chars.
- **Logic:** Fetch user by id; bcrypt.compare(current_password, user.passwordHash). If mismatch, return 400. Else bcrypt.hash(new_password, 10), update portal_users set password_hash = hash where id = user.id. Return 200 `{ message: "Password updated" }`.
- **Rate limit:** Same as login (e.g. 10 per minute per IP or per user).
- **Validation:** Add schema to `src/lib/validate.ts`, e.g. `changePassword: z.object({ current_password: z.string().min(1), new_password: z.string().min(8) })`.

### 9.3 GET /api/v1/portal/user/preferences

- **Purpose:** Return preferences for the current user (for Settings page).
- **Auth:** Required (cookie or Bearer).
- **Query:** Optional `key` (e.g. `notification_preferences`). If omitted, return all keys for the user (e.g. list of { key, value }).
- **Response 200:** `{ data: { notification_preferences: { agent_low_float: { in_app: true, email: false, sms: true }, ... } } }` or multiple keys. If no row exists, return `{ data: { notification_preferences: null } }` or default structure so UI can show toggles with defaults (all in_app true, email/sms false).

### 9.4 PATCH /api/v1/portal/user/preferences

- **Purpose:** Update preferences (e.g. notification toggles).
- **Auth:** Required.
- **Body:** `{ notification_preferences: { agent_low_float: { in_app: true, email: false, sms: true }, ... } }`. Full object for the key; server replaces the row for (user_id, key) or inserts if not exists. Validate structure (allowed keys per portal) in the route.
- **Response 200:** `{ data: { notification_preferences: { ... } } }`.
- **Response 400:** Invalid structure or unknown notification type.

---

## 10. UI components

- **Reusable:** Use existing `SectionHeader`, `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`, `FormField`, `Input`, `DescriptionList` from `src/components/ui`. DaisyUI for form-control, input, btn.
- **New components:**
  - **ChangePasswordForm:** Client component. Props: `onSuccess` (callback), `onError` (callback). State: currentPassword, newPassword, confirmPassword, loading, error. Submit to `POST /api/v1/auth/change-password`. Use `Input` type="password" for all three. Place in `src/components/profile/change-password-form.tsx` and use on all four portal Settings pages.
  - **NotificationPreferencesForm:** Client component. Props: `portal: 'agent' | 'ketchup' | 'government' | 'field-ops'`, `preferences` (from GET preferences), `onSave` (callback). Renders list of notification types (from a constant map per portal) with toggles (Switch or checkbox) for in_app, email, sms. Save button calls `PATCH /api/v1/portal/user/preferences` with new state. Place in `src/components/profile/notification-preferences-form.tsx`.
- **Profile Account section:** When `me` is null (401), show a single Card with text “Sign in to see your profile” and `<Link href="/login">Sign in</Link>`. When `me` is set, show DescriptionList with Full name, Email, Role (and Phone for Field Ops). Reuse existing `PortalProfileView` but pass `name`, `email` from `me`, and optionally `extraItems` for role/phone; remove hardcoded placeholder when `me` is present.

---

## 11. Implementation checklist

### Phase 1 – Session and current user

| # | Task | Details |
|---|------|--------|
| 1.1 | Set cookie on login | In `POST /api/v1/auth/login`, after successful auth, set cookie `portal-auth` with value `access_token`, path=/, httpOnly, sameSite=Lax, secure in prod, maxAge=expires_in. |
| 1.2 | GET /api/v1/portal/me | New route. Read cookie or Authorization header; decode JWT; fetch portal_users by sub; return id, email, full_name, role, agent_id, phone. 401 if missing/invalid. |
| 1.3 | Profile pages use /portal/me | In Agent/Ketchup/Government/Field Ops profile pages, on mount call GET /api/v1/portal/me; if 401 show “Sign in to see your profile” + link to /login; else show Account from me and (Agent only) fetch agent by me.agent_id. |
| 1.4 | /settings redirect by role | In app/settings/page.tsx, call GET /api/v1/portal/me; if 401 redirect to /login?redirect=/settings; else redirect to /agent/settings | /ketchup/settings | /government/settings | /field-ops/settings by role. |

### Phase 2 – Password change

| # | Task | Details |
|---|------|--------|
| 2.1 | Zod schema changePassword | Add to src/lib/validate.ts. current_password string min 1, new_password string min 8. |
| 2.2 | POST /api/v1/auth/change-password | Require auth; validate body; verify current password; hash new password; update portal_users; return 200 or 400. Rate limit. |
| 2.3 | ChangePasswordForm component | Create src/components/profile/change-password-form.tsx. Three password inputs, submit, success/error toasts. |
| 2.4 | Add form to all Settings pages | Use ChangePasswordForm on Agent, Ketchup, Government, Field Ops settings pages. |

### Phase 3 – Notification preferences

| # | Task | Details |
|---|------|--------|
| 3.1 | Migration portal_user_preferences | Create drizzle migration; table with portal_user_id, preference_key, preference_value (text/JSON), timestamps; unique(portal_user_id, preference_key). |
| 3.2 | Drizzle schema | Add portalUserPreferences to src/db/schema.ts. |
| 3.3 | GET /api/v1/portal/user/preferences | Require auth; return notification_preferences JSON for current user (or default). |
| 3.4 | PATCH /api/v1/portal/user/preferences | Require auth; validate body; upsert row for (user_id, 'notification_preferences'). |
| 3.5 | NotificationPreferencesForm | Create component; per-portal type list; toggles; save to PATCH. |
| 3.6 | Wire preferences into notification send | When sending email/SMS to a portal user, load preferences and respect channel flags. |
| 3.7 | Add NotificationPreferencesForm to Settings pages | Agent, Ketchup, Government, Field Ops settings pages each render the form with correct portal prop. |

### Phase 4 – Profile polish

| # | Task | Details |
|---|------|--------|
| 4.1 | Agent profile: link to Settings | Add “Change password” link to Profile that goes to /agent/settings. |
| 4.2 | Commission rate on Settings | Keep single line with link to Profile (already specified). |
| 4.3 | Government Settings config link | Already present; no change. |

### Done already

- Agent profile: details from GET /api/v1/agents/[id] (implemented).
- Ketchup/Government/Field Ops profile: account + role placeholder (implemented); update to use /portal/me and “Sign in” when 401.
- Agent/Ketchup/Government/Field Ops settings pages and shared /settings redirect (implemented).
- Header: Settings and Profile hrefs per portal (implemented).

---

## 12. References

- PRD §5.2.5, §5.3.5 (Agent Profile & Settings)
- PRD §7.1 (Auth), §7.4 (Notifications, preferences)
- [SECURITY.md](SECURITY.md) – Add note: change-password endpoint must be rate-limited and require current password.
- [DATABASE_AND_API_DESIGN.md](DATABASE_AND_API_DESIGN.md) – Add section for `portal_user_preferences` table and GET/PATCH `/api/v1/portal/user/preferences` and GET `/api/v1/portal/me`, POST `/api/v1/auth/change-password`.
- Existing auth: `src/app/api/v1/auth/login/route.ts`, `src/app/api/v1/auth/register/route.ts`, `src/lib/validate.ts` (schemas.login, schemas.register).
- Schema: `src/db/schema.ts` (portalUsers, inAppNotifications, pushSubscriptions).

---

## 13. Out of scope (this release)

- Department, ministry, assigned regions/assets on Profile: no columns or APIs; add in a later phase.
- Default date range for reports, map default view, filter defaults: not in Settings UI; add when product requires.
- Push for Field Ops: optional; implement only if PWA push is in scope.
- Supabase Auth / Neon Auth migration: spec assumes current custom auth; migration to Supabase/Neon Auth can reuse this Profile/Settings structure and swap session source.
