# Portal exploration checklist – 100% coverage

Use this at **http://localhost:3000** after logging in.

**Login:** `seed-ketchup_ops@test.ketchup.local` / `TestPassword1!`

---

## 1. Auth

- [ ] Open http://localhost:3000 → redirects to `/login?redirect=/ketchup/dashboard`
- [ ] Sign in → redirects to `/ketchup/dashboard` (or the `redirect` path)
- [ ] Sign out (header) → back to login

---

## 2. Ketchup portal (`/ketchup`)

- [ ] **Dashboard** – `/ketchup/dashboard` – summary cards, no errors
- [ ] **Beneficiaries** – `/ketchup/beneficiaries` – table, filters, export CSV, Send SMS
- [ ] **Vouchers** – `/ketchup/vouchers` – list, filters, Issue Voucher, expiring-soon alert
- [ ] **Duplicate Redemptions** – `/ketchup/vouchers/duplicates` – summary, table, resolve modal
- [ ] **Agents** – `/ketchup/agents` – list; click row → agent detail (float, transactions, parcels)
- [ ] **Float requests** – `/ketchup/float-requests` – list, Approve/Reject
- [ ] **Terminal Inventory** – `/ketchup/terminal-inventory`
- [ ] **Mobile Units** – `/ketchup/mobile-units` – assets list
- [ ] **Network Map** – `/ketchup/network-map`
- [ ] **Reconciliation** – `/ketchup/reconciliation` – daily totals, Add adjustment
- [ ] **Compliance** – `/ketchup/compliance`
- [ ] **Audit** – `/ketchup/audit` – audit logs table
- [ ] **App Analytics** – `/ketchup/app-analytics`
- [ ] **USSD Viewer** – `/ketchup/ussd-viewer` – sessions list
- [ ] **Profile** – `/ketchup/profile`
- [ ] **Settings** (header) – `/ketchup/settings` – preferences, change password

---

## 3. Government portal (`/government`)

- [ ] **Dashboard** – `/government/dashboard`
- [ ] **Programmes** – `/government/programmes` – list, Add programme modal
- [ ] **Unverified** – `/government/unverified` – beneficiaries table
- [ ] **Vouchers** – `/government/vouchers` – metrics, vouchers table, export CSV
- [ ] **Reports** – `/government/reports`
- [ ] **Config** – `/government/config`
- [ ] **Profile** – `/government/profile`
- [ ] **Settings** (header) – `/government/settings`

---

## 4. Agent portal (`/agent`)

- [ ] **Dashboard** – `/agent/dashboard`
- [ ] **Float** – `/agent/float` – balance, history, Request top-up
- [ ] **Transactions** – `/agent/transactions` – list, pagination
- [ ] **Parcels** – `/agent/parcels` – incoming / history, Mark collected
- [ ] **Profile** – `/agent/profile`
- [ ] **Settings** (header) – `/agent/settings`

---

## 5. Field Ops portal (`/field-ops`)

- [ ] **Map** – `/field-ops/map`
- [ ] **Assets** – `/field-ops/assets` – list
- [ ] **Tasks** – `/field-ops/tasks` – list, create/update task
- [ ] **Activity** – `/field-ops/activity`
- [ ] **Routes** – `/field-ops/routes`
- [ ] **Reports** – `/field-ops/reports`
- [ ] **Profile** – `/field-ops/profile`
- [ ] **Settings** (header) – `/field-ops/settings`

---

## 6. Session expiry

- [ ] While on any list page (e.g. Vouchers, Beneficiaries), clear cookies or wait for session to expire, then trigger a load (e.g. change filter) → redirect to `/login?redirect=<current path>`

---

**Note:** If you see blank tables, check the browser console and network tab for 401/500. All portal API requests now send `credentials: 'include'` and key pages use `portalFetch()` to redirect to login on 401.
