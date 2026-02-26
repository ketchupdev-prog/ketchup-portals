# Ketchup Portals – Exploration & Fix Plan

**Implementation status:** Fixes 1 and 2 are **implemented**. Fix 3 (per-page 401 redirect) is implemented via `portalFetch` on key list pages.

---

## 1. Portal & page inventory

### Root
| Path | Behavior |
|------|----------|
| `/` | Redirects to `/ketchup/dashboard`. |

### Auth
| Path | Notes |
|------|--------|
| `/login` | Email/password; sets `portal-auth` cookie; uses `?redirect=` for post-login URL. |
| `/register` | Registration form (present). |

### Ketchup (`/ketchup/*`)
| Path | Data source | Auth handling |
|------|-------------|----------------|
| `/ketchup/dashboard` | GET `/api/v1/portal/dashboard/summary` | ✅ 401 → redirect to login (implemented). |
| `/ketchup/beneficiaries` | GET `/api/v1/beneficiaries` | No `credentials: 'include'`; no 401 redirect. |
| `/ketchup/beneficiaries/[id]` | Beneficiary detail APIs | Same. |
| `/ketchup/vouchers` | GET `/api/v1/vouchers`, `/api/v1/vouchers/expiring-soon` | No credentials. |
| `/ketchup/vouchers/[id]` | Voucher detail | Same. |
| `/ketchup/vouchers/duplicates` | GET `/api/v1/vouchers/duplicates`, `/api/v1/advance-ledger/summary` | No credentials. |
| `/ketchup/agents` | Agents list API | Same. |
| `/ketchup/agents/[id]` | GET `/api/v1/agents/[id]` | Same. |
| `/ketchup/float-requests` | GET `/api/v1/float-requests` (protected) | Needs credentials. |
| `/ketchup/terminal-inventory` | Terminals API | Same. |
| `/ketchup/mobile-units` | GET `/api/v1/assets?type=mobile_unit|atm` | No credentials. |
| `/ketchup/mobile-units/[id]` | Asset detail | Same. |
| `/ketchup/network-map` | Map/assets APIs | Same. |
| `/ketchup/reconciliation` | GET `/api/v1/reconciliation/daily`, POST adjustment | No credentials. |
| `/ketchup/compliance` | Incidents/unverified/audit | Same. |
| `/ketchup/audit` | GET `/api/v1/audit-logs` | Same. |
| `/ketchup/app-analytics` | Analytics APIs | Same. |
| `/ketchup/ussd-viewer` | GET `/api/v1/ussd/sessions` | No credentials. |
| `/ketchup/profile` | GET `/api/v1/portal/me` | ✅ credentials. |
| `/ketchup/settings` | Portal settings, change password, preferences | ✅ credentials. |

### Government (`/government/*`)
| Path | Data source | Auth handling |
|------|-------------|----------------|
| `/government/dashboard` | Dashboard KPIs | May call APIs without credentials. |
| `/government/programmes` | GET `/api/v1/programmes` | No credentials. |
| `/government/unverified` | GET `/api/v1/beneficiaries/unverified` | No credentials. |
| `/government/vouchers` | GET `/api/v1/programmes`, vouchers | No credentials. |
| `/government/reports` | Reports (stub/PDF) | Same. |
| `/government/config` | Config page | Same. |
| `/government/profile` | GET `/api/v1/portal/me` | ✅ credentials. |
| `/government/settings` | Settings forms | ✅ credentials. |

### Agent (`/agent/*`)
| Path | Data source | Auth handling |
|------|-------------|----------------|
| `/agent/dashboard` | GET `/api/v1/agents?limit=1` | No credentials. |
| `/agent/float` | GET `/api/v1/agents`, POST float request | No credentials (float request needs auth). |
| `/agent/transactions` | GET `/api/v1/agents` | No credentials. |
| `/agent/parcels` | GET `/api/v1/agents` | No credentials. |
| `/agent/profile` | GET `/api/v1/portal/me`, `/api/v1/agents/[id]` | ✅ credentials. |
| `/agent/settings` | Settings forms | ✅ credentials. |

### Field Ops (`/field-ops/*`)
| Path | Data source | Auth handling |
|------|-------------|----------------|
| `/field-ops/map` | GET `/api/v1/field/map` | No credentials. |
| `/field-ops/assets` | GET `/api/v1/field/assets` | No credentials. |
| `/field-ops/tasks` | GET `/api/v1/field/tasks`, POST/PATCH | No credentials. |
| `/field-ops/activity` | GET `/api/v1/field/reports/activity` | No credentials. |
| `/field-ops/routes` | Stub (no API yet) | N/A. |
| `/field-ops/reports` | Reports stub | N/A. |
| `/field-ops/profile` | GET `/api/v1/portal/me` | ✅ credentials. |
| `/field-ops/settings` | Settings forms | ✅ credentials. |

### Shared
| Path | Notes |
|------|--------|
| `/settings` | Fetches `/api/v1/portal/me`; redirects by role to portal settings. ✅ credentials. |
| `/profile` | Profile redirect or content. |

---

## 2. Issues identified

1. **Missing `credentials: 'include'`**  
   Most list/detail pages that call `/api/v1/*` do not send cookies. When those APIs are later protected by session, requests will return 401 and pages will show empty or errors.

2. **No global 401 handling for portal routes**  
   Only the Ketchup dashboard explicitly redirects to `/login?redirect=...` on 401. Other portal pages do not; if an API returns 401, the user sees empty data or a generic error.

3. **Root always redirects to Ketchup**  
   `/` → `/ketchup/dashboard`. If the user is not logged in, they hit dashboard → 401 → login (after our fix). Acceptable; optional improvement: redirect to login when unauthenticated and then to dashboard after login.

4. **Sidebars**  
   Ketchup sidebar has no “Settings” link; Settings is in the header (user dropdown). Same for other portals. Consistent and OK.

5. **API auth coverage**  
   Currently only a subset of routes use `requirePermission` or `getPortalSession`: portal/me, portal/dashboard/summary, portal/user/preferences, auth/change-password, admin/*, agent/float/request, float-requests. List routes (vouchers, beneficiaries, programmes, assets, etc.) do not require auth yet. Sending credentials everywhere prepares the app for when those routes are protected.

---

## 3. Fix plan (priority order)

| # | Fix | Status |
|---|-----|--------|
| 1 | **Add `credentials: 'include'`** to all `fetch()` calls from portal pages that call `/api/v1/*`. | ✅ Implemented |
| 2 | **Portal layout auth check** – In `PortalLayout` (or a wrapper), on mount fetch `/api/v1/portal/me` with `credentials: 'include'`; on 401 redirect to `/login?redirect=<current path>`. | Single place to enforce “must be logged in for any portal page” and consistent redirect. |
| 3 | **(Optional)** Per-page 401 handling for critical fetches (e.g. vouchers list, duplicates) that show a clear “Session expired” and redirect to login. | Better UX if layout check is not used or is delayed. |

---

## 4. Files updated

- **Portal layout:** `src/components/portal-layout.tsx` – auth check and 401 redirect.
- **Helper:** `src/lib/portal-fetch.ts` – `portalFetch()` wraps fetch with credentials and 401 → login redirect.
- **Fetches:** All portal pages and shared components that call `/api/v1/*` now use `credentials: 'include'`; key list pages use `portalFetch()` for 401 redirect.

---

## 5. Verification

- Not logged in: open `/ketchup/dashboard` → redirect to `/login?redirect=...` → after login, land on dashboard.
- Logged in: open each portal section (Ketchup, Government, Agent, Field Ops), click through sidebar links; no unexpected 401 or blank lists once APIs are protected and credentials are sent.
- Settings and Profile on each portal work with existing credentials.
