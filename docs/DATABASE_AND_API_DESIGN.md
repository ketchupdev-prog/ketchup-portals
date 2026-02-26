# Ketchup Portals – Database & API Design

This document defines the **database schema** and **API specifications** for the Ketchup Portals app (part of the Ketchup SmartPay G2P ecosystem). It covers four web portals and the beneficiary platform. The design aligns with the **PRD v1.4** and incorporates relevant principles from the **Namibian Open Banking Standards v1.0** (secure API design, OAuth2, consent, and participant management).

---

## 1. Database Schema

The database is hosted on **Neon (PostgreSQL)**. The schema is defined using **Drizzle ORM**. Tables are organised into logical groups: core entities, portal-specific tables, and audit/logging.

### 1.1 Core Tables (Shared with Beneficiary Platform)

These tables are already assumed to exist in the beneficiary platform database. They are referenced by portal tables.

#### `users` (Beneficiaries)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| phone | TEXT | Unique phone number |
| full_name | TEXT | |
| id_number | TEXT | National ID (if applicable) |
| date_of_birth | DATE | |
| region | TEXT | One of Namibia’s 14 administrative regions (see §1.1.1). |
| wallet_status | TEXT | active, frozen, suspended |
| proof_of_life_due_date | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### 1.1.1 Regions (Namibia)

All region filters, dropdowns, and `users.region` values should use **Namibia’s 14 administrative regions**. The single source of truth is **`src/lib/regions.ts`**, which exports:

- **`NAMIBIA_REGION_CODES`** – 14 region codes (e.g. `Erongo`, `Hardap`, `Karas` for ǁKaras, `Kavango East`, `Kavango West`, `Khomas`, `Kunene`, `Ohangwena`, `Omaheke`, `Omusati`, `Oshana`, `Oshikoto`, `Otjozondjupa`, `Zambezi`).
- **`REGION_SELECT_OPTIONS`** – `{ value, label }[]` for filter dropdowns (includes “All regions”).
- **`isValidRegion(value)`** – use in API handlers to validate `region` query/body params.
- **`normalizeRegion(value)`** – normalise input (e.g. “ǁKaras” or “karas” → `Karas`).

List endpoints that accept a `region` query parameter (e.g. beneficiaries, agents, duplicate-redemptions) validate against these 14 regions and return 400 when invalid.

#### `vouchers`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| beneficiary_id | UUID | References users(id) |
| programme_id | UUID | References programmes(id) |
| amount | NUMERIC(14,2) | |
| status | TEXT | available, redeemed, expired |
| issued_at | TIMESTAMPTZ | |
| redeemed_at | TIMESTAMPTZ | |
| expiry_date | DATE | |
| loan_deduction | NUMERIC(14,2) | If any loan recovered |

#### `wallets`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| user_id | UUID | References users(id) |
| balance | NUMERIC(14,2) | |
| currency | TEXT | 'NAD' |
| updated_at | TIMESTAMPTZ | |

#### `wallet_transactions`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| wallet_id | UUID | References wallets(id) |
| type | TEXT | credit, debit |
| amount | NUMERIC(14,2) | |
| reference | TEXT | e.g., voucher_id, settlement_id |
| created_at | TIMESTAMPTZ | |

#### `transactions` (POS transactions)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| beneficiary_id | UUID | References users(id) |
| agent_id | UUID | References agents(id) |
| type | TEXT | cashout, billpay, airtime |
| amount | NUMERIC(14,2) | |
| fee | NUMERIC(14,2) | |
| method | TEXT | cash, QR, code |
| timestamp | TIMESTAMPTZ | |

#### `proof_of_life_events`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| user_id | UUID | References users(id) |
| method | TEXT | app, agent, ussd |
| performed_by | UUID | References portal_users(id) if done by agent/ops |
| timestamp | TIMESTAMPTZ | |

#### `loans`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| beneficiary_id | UUID | References users(id) |
| amount | NUMERIC(14,2) | |
| outstanding | NUMERIC(14,2) | |
| status | TEXT | active, repaid, defaulted |

#### `programmes`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| name | TEXT | |
| description | TEXT | |
| allocated_budget | NUMERIC(14,2) | |
| spent_to_date | NUMERIC(14,2) | |
| start_date | DATE | |
| end_date | DATE | |
| verification_frequency_days | INT | Default 90 |

### 1.2 Portal-Specific Tables

#### `portal_users`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| email | TEXT | Unique |
| password_hash | TEXT | Managed by Supabase Auth |
| full_name | TEXT | |
| role | TEXT | ketchup_ops, ketchup_compliance, ketchup_finance, ketchup_support, gov_manager, gov_auditor, agent, field_tech, field_lead |
| agent_id | UUID | References agents(id), if role='agent' |
| created_at | TIMESTAMPTZ | |
| last_login | TIMESTAMPTZ | |
| two_factor_enabled | BOOLEAN | Default false |
| two_factor_secret | TEXT | TOTP secret (encrypted) |
| phone | TEXT | Optional; used for Field Ops SMS alerts |

#### `portal_user_preferences`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| portal_user_id | UUID | FK to portal_users(id), ON DELETE CASCADE |
| preference_key | TEXT | Default 'notification_preferences'; unique per user with portal_user_id |
| preference_value | TEXT | JSON string (e.g. notification_preferences object) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

Unique constraint on (portal_user_id, preference_key). Index on portal_user_id. See Profile & Settings spec (docs/PROFILE_AND_SETTINGS.md) §8 for JSON schema.

#### `agents`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| name | TEXT | |
| location_lat | NUMERIC(10,8) | |
| location_lng | NUMERIC(11,8) | |
| address | TEXT | |
| contact_phone | TEXT | |
| contact_email | TEXT | |
| commission_rate | NUMERIC(5,2) | Percentage |
| float_balance | NUMERIC(14,2) | Current cash float |
| status | TEXT | active, suspended |
| created_at | TIMESTAMPTZ | |

#### `agent_float_transactions`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| agent_id | UUID | References agents(id) |
| amount | NUMERIC(14,2) | |
| type | TEXT | top_up, settlement, adjustment |
| reference | TEXT | e.g., settlement ID |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |

#### `float_requests`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| agent_id | UUID | References agents(id) |
| amount | NUMERIC(14,2) | |
| status | TEXT | pending, approved, rejected |
| requested_at | TIMESTAMPTZ | |
| reviewed_by | UUID | References portal_users(id) |
| reviewed_at | TIMESTAMPTZ | |

#### `pos_terminals`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| device_id | TEXT | Hardware ID (unique) |
| model | TEXT | |
| status | TEXT | active, maintenance, offline |
| assigned_agent_id | UUID | References agents(id) |
| last_ping | TIMESTAMPTZ | |
| software_version | TEXT | |
| created_at | TIMESTAMPTZ | |

#### `assets` (Mobile Units / ATMs)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| type | TEXT | mobile_unit, atm, warehouse |
| name | TEXT | |
| location_lat | NUMERIC(10,8) | |
| location_lng | NUMERIC(11,8) | |
| status | TEXT | active, maintenance, offline |
| cash_level | NUMERIC(14,2) | For ATMs |
| last_replenishment | TIMESTAMPTZ | |
| driver | TEXT | For mobile units |
| created_at | TIMESTAMPTZ | |

#### `asset_locations` (History for mobile units)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| asset_id | UUID | References assets(id) |
| lat | NUMERIC(10,8) | |
| lng | NUMERIC(11,8) | |
| recorded_at | TIMESTAMPTZ | |

#### `maintenance_logs`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| asset_id | UUID | References assets(id) |
| technician_id | UUID | References portal_users(id) |
| type | TEXT | inspection, repair, service, replenish |
| notes | TEXT | |
| cash_before | NUMERIC(14,2) | For replenishment |
| cash_added | NUMERIC(14,2) | |
| cash_after | NUMERIC(14,2) | |
| created_at | TIMESTAMPTZ | |

#### `tasks`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| title | TEXT | |
| description | TEXT | |
| asset_id | UUID | References assets(id) |
| assigned_to | UUID | References portal_users(id) |
| due_date | DATE | |
| status | TEXT | pending, in_progress, done |
| created_by | UUID | References portal_users(id) |
| created_at | TIMESTAMPTZ | |

#### `parcels`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| tracking_code | TEXT | Unique |
| recipient_name | TEXT | |
| recipient_phone | TEXT | |
| agent_id | UUID | References agents(id) |
| status | TEXT | in_transit, ready, collected, returned |
| created_at | TIMESTAMPTZ | |
| collected_at | TIMESTAMPTZ | |
| returned_at | TIMESTAMPTZ | |

#### `audit_logs`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| user_id | UUID | References portal_users(id) |
| action | TEXT | e.g., 'beneficiary_suspend', 'voucher_issue' |
| entity_type | TEXT | 'beneficiary', 'voucher', 'agent', etc. |
| entity_id | UUID | |
| old_data | JSONB | |
| new_data | JSONB | |
| ip_address | INET | |
| user_agent | TEXT | |
| created_at | TIMESTAMPTZ | |

#### `duplicate_redemption_events` (Offline duplicate detection)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| voucher_id | UUID | References vouchers(id) |
| beneficiary_id | UUID | References users(id) |
| canonical_redemption_ref | TEXT | Reference to the legitimate redemption event (UUID or external id as text) |
| duplicate_attempt_id | TEXT | Idempotency key from the duplicate device |
| duplicate_agent_id | UUID | References agents(id) |
| duplicate_amount | NUMERIC(14,2) | |
| duplicate_requested_at | TIMESTAMPTZ | Device clock at duplicate attempt |
| detected_at | TIMESTAMPTZ | |
| status | TEXT | advance_posted, under_review, no_financial_impact, agent_appealing, resolved |
| resolution_notes | TEXT | |
| appeal_evidence_url | TEXT | URL to stored evidence for agent appeal |
| resolved_by | UUID | References portal_users(id) |
| resolved_at | TIMESTAMPTZ | |

#### `beneficiary_advances` (Advance recovery ledger)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| beneficiary_id | UUID | References users(id) |
| source_event_id | UUID | References duplicate_redemption_events(id) |
| programme_id | UUID | References programmes(id) |
| original_amount | NUMERIC(14,2) | Amount over-disbursed |
| recovered_amount | NUMERIC(14,2) | Recovered to date |
| status | TEXT | outstanding, fully_recovered, escalated |
| created_at | TIMESTAMPTZ | |
| last_recovery_at | TIMESTAMPTZ | |

#### `user_sessions` (for app analytics)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| user_id | UUID | References users(id) |
| login_at | TIMESTAMPTZ | |
| logout_at | TIMESTAMPTZ | |
| device_os | TEXT | |
| app_version | TEXT | |

#### `ussd_sessions`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | |
| user_id | UUID | References users(id) |
| session_data | JSONB | Menu selections, timestamps |
| created_at | TIMESTAMPTZ | |

---

## 2. API Design Principles

- **RESTful** architecture with JSON payloads.
- **OpenAPI 3.1** specification for documentation.
- **HTTPS** with **mTLS** (mutual TLS) for server-to-server communication, as per Open Banking standards.
- **OAuth 2.0** with **JWT** for user authentication (portal users) and client credentials for machine-to-machine.
- **Role-Based Access Control (RBAC)** enforced via middleware and database policies.
- **Versioning**: URL path (`/api/v1/...`).
- **Pagination**, filtering, sorting supported on list endpoints (as per Open Banking §9.1.4).
- **Error handling**: Consistent error response structure with `error_type` and `details`.

---

## 3. API Endpoints

Base URL: `https://api.ketchup.cc/api/v1` (local: `/api/v1`)

All endpoints require authentication (Bearer JWT or mTLS client certificate) and appropriate role permissions.

### 3.1 Authentication & User Management

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/auth/login` | Login with email/password, returns JWT | public |
| POST | `/auth/logout` | Invalidate token | all |
| POST | `/auth/refresh` | Refresh access token | all |
| POST | `/auth/2fa/setup` | Enable 2FA (returns QR code) | all |
| POST | `/auth/2fa/verify` | Verify 2FA token | all |
| POST | `/auth/password-reset/request` | Request password reset email | public |
| POST | `/auth/password-reset/confirm` | Reset password with token | public |
| GET | `/portal/me` | Current portal user (session). Cookie `portal-auth` or `Authorization: Bearer`. Returns `{ id, email, full_name, role, agent_id?, phone? }`. 401 if unauthenticated. | any authenticated |
| POST | `/auth/change-password` | Change password. Body: `{ current_password, new_password }`. Rate-limited. | any authenticated |
| GET | `/portal/user/preferences` | Get preferences (e.g. `?key=notification_preferences`). Returns `{ data: { notification_preferences: { ... } } }`. | any authenticated |
| PATCH | `/portal/user/preferences` | Update preferences. Body: `{ notification_preferences: { ... } }`. | any authenticated |

Full request/response shapes for Profile & Settings (session, password change, notification preferences) are in **docs/PROFILE_AND_SETTINGS.md** §9–10.

| GET | `/portal/users` | List portal users | ketchup_ops |
| POST | `/portal/users` | Create new portal user | ketchup_ops |
| GET | `/portal/users/{id}` | Get user details | ketchup_ops |
| PATCH | `/portal/users/{id}` | Update user (role, status) | ketchup_ops |

### 3.2 Ketchup Portal Endpoints

#### Beneficiaries

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/beneficiaries` | List beneficiaries (filterable) | ketchup_*, gov_* |
| GET | `/beneficiaries/{id}` | Get beneficiary details | ketchup_*, gov_* |
| PATCH | `/beneficiaries/{id}/status` | Suspend/reactivate | ketchup_ops, ketchup_support |
| POST | `/beneficiaries/{id}/proof-of-life` | Trigger proof-of-life | ketchup_ops |
| GET | `/beneficiaries/{id}/proof-of-life-events` | List events | ketchup_* |
| POST | `/beneficiaries/{id}/sms` | Send SMS reminder | ketchup_support |
| GET | `/beneficiaries/unverified` | List unverified beneficiaries | ketchup_compliance, gov_* |

#### Vouchers

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/vouchers` | List vouchers | ketchup_*, gov_* |
| GET | `/vouchers/{id}` | Get voucher details | ketchup_*, gov_* |
| POST | `/vouchers/issue` | Issue single voucher | ketchup_ops |
| POST | `/vouchers/batch-issue` | Batch issue (CSV upload) | ketchup_ops |
| POST | `/vouchers/{id}/expire` | Manually expire | ketchup_ops |
| GET | `/vouchers/expiring-soon` | List vouchers expiring in 7 days | ketchup_ops |

#### Agents & Terminals

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/agents` | List agents | ketchup_* |
| GET | `/agents/{id}` | Get agent details | ketchup_* |
| POST | `/agents` | Create new agent | ketchup_ops |
| PATCH | `/agents/{id}` | Update agent | ketchup_ops |
| PATCH | `/agents/{id}/float` | Adjust float | ketchup_finance |
| GET | `/agents/{id}/float-history` | List float transactions | ketchup_finance, agent |
| GET | `/agents/{id}/transactions` | Agent transaction history | ketchup_*, agent |
| GET | `/terminals` | List POS terminals | ketchup_* |
| POST | `/terminals` | Add new terminal | ketchup_ops |
| PATCH | `/terminals/{id}/assign` | Assign to agent | ketchup_ops |
| PATCH | `/terminals/{id}/status` | Update terminal status | ketchup_ops |

#### Mobile Units & ATMs

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/assets` | List mobile units/ATMs | ketchup_*, field_* |
| GET | `/assets/{id}` | Get asset details | ketchup_*, field_* |
| POST | `/assets` | Create new asset | ketchup_ops |
| PATCH | `/assets/{id}` | Update asset | ketchup_ops |
| POST | `/assets/{id}/maintenance` | Log maintenance | field_tech |
| GET | `/assets/{id}/maintenance-logs` | List logs | ketchup_*, field_* |
| POST | `/assets/{id}/location` | Update mobile unit location | field_tech |
| GET | `/assets/map` | Get GeoJSON for map | ketchup_*, field_* |

#### Trust Account Reconciliation

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/reconciliation/daily` | Get daily reconciliation summary | ketchup_finance |
| POST | `/reconciliation/adjustment` | Add manual adjustment | ketchup_finance (requires approval) |

#### Compliance & Audit

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/audit-logs` | Search audit logs | ketchup_compliance |
| GET | `/incidents` | List incidents | ketchup_compliance |
| POST | `/incidents` | Create incident report | ketchup_compliance |
| PATCH | `/incidents/{id}` | Update incident | ketchup_compliance |

#### Analytics (App & USSD)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/analytics/app-users` | List app users | ketchup_ops |
| GET | `/analytics/dau` | Daily active users | ketchup_ops |
| GET | `/analytics/redemption-rate` | Redemption rate by period | ketchup_ops |
| GET | `/analytics/channel-breakdown` | App vs USSD | ketchup_ops |
| GET | `/analytics/heatmap` | Transaction heatmap data | ketchup_ops |
| GET | `/ussd/sessions` | List USSD sessions | ketchup_support |
| GET | `/ussd/sessions/{id}` | Session details | ketchup_support |

#### Ketchup Dashboard Summary

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/portal/dashboard/summary` | KPI counts for dashboard cards: activeVouchers, beneficiariesCount, agentsCount, pendingFloatRequestsCount. Response: `{ data: { activeVouchers, beneficiariesCount, agentsCount, pendingFloatRequestsCount } }`. | ketchup_* |

### 3.3 Government Portal Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/programmes` | List programmes | gov_manager, gov_auditor |
| GET | `/programmes/{id}` | Get programme details | gov_manager, gov_auditor |
| POST | `/programmes` | Create programme | gov_manager |
| PATCH | `/programmes/{id}` | Update programme | gov_manager |
| GET | `/programmes/{id}/report` | Generate PDF report | gov_manager, gov_auditor |
| GET | `/beneficiaries/unverified` | List unverified (gov version) | gov_manager, gov_auditor |
| GET | `/vouchers` | Voucher monitoring (gov) | gov_manager, gov_auditor |
| POST | `/exports/programme-performance` | Export CSV | gov_manager, gov_auditor |

### 3.4 Agent Portal Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/agent/dashboard` | Agent dashboard summary | agent |
| GET | `/agent/float` | Current float | agent |
| GET | `/agent/float/history` | Float transaction history | agent |
| POST | `/agent/float/request` | Request top-up | agent |
| GET | `/agent/transactions` | Transaction history | agent |
| GET | `/agent/parcels` | List parcels at this agent | agent |
| POST | `/agent/parcels/{id}/collect` | Mark parcel collected | agent |
| GET | `/agent/commission` | Commission statement | agent |
| GET | `/agent/settlement` | Daily settlement summary | agent |

### 3.5 Field Ops Portal Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/field/map` | Map data (GeoJSON) | field_tech, field_lead |
| GET | `/field/assets` | List assets (filterable) | field_tech, field_lead |
| GET | `/field/assets/{id}` | Asset detail | field_tech, field_lead |
| POST | `/field/assets/{id}/location` | Update location | field_tech |
| POST | `/field/maintenance` | Log maintenance | field_tech |
| GET | `/field/tasks` | List tasks (assigned to me) | field_tech, field_lead |
| POST | `/field/tasks` | Create task | field_lead |
| PATCH | `/field/tasks/{id}` | Update task status | field_tech, field_lead |
| POST | `/field/route` | Generate simple route | field_lead |
| GET | `/field/reports/activity` | Activity report | field_lead |

### 3.6 Consent & Data Sharing (Out of scope for v1)

Out of scope for v1. Planned for v2: OAuth2 consent flows as per Open Banking standards if the system evolves to allow third-party access to beneficiary data. For now, all access is role-based within the closed ecosystem.

---

## 4. Authentication & Authorization

### 4.1 Portal User Authentication (JWT)

- Users authenticate via Supabase Auth (email/password, optional TOTP).
- Upon login, a JWT is issued containing user ID, role, and permissions.
- The JWT is included in the `Authorization: Bearer <token>` header for all API requests.
- Middleware validates the token and checks role-based access for each route.

### 4.2 Machine-to-Machine (Client Credentials)

For background jobs or service-to-service calls (e.g., mobile unit GPS updates), we use OAuth2 client credentials grant. Clients have a client ID and secret, and receive a short-lived JWT scoped to specific endpoints.

### 4.3 Mutual TLS (mTLS)

As per Open Banking standards, all API communication between servers (e.g., between Ketchup backend and external systems) should use mTLS with client certificates. This ensures both parties are authenticated. Certificates are issued by a trusted Certificate Authority (e.g., within the scheme).

### 4.4 Role-Based Access Control (RBAC)

Permissions are enforced at the API level using middleware that checks the role claim in the JWT against the required roles for each endpoint (see tables above). Row-level security (RLS) in PostgreSQL ensures users can only access data they are permitted to see (e.g., an agent can only see their own data).

#### 4.4.1 RLS policy outline (PRD Audit §3.2)

When enabling RLS on Neon/Postgres, implement policies along these lines (exact SQL in migrations):

| Table | Role | Policy intent |
|-------|------|----------------|
| `agents` | agent | SELECT only where `id = current_setting('app.current_agent_id')::uuid` (set by API from session). |
| `agents` | ketchup_* | SELECT, UPDATE all. |
| `float_requests` | agent | SELECT, INSERT only where `agent_id = app.current_agent_id`; requested_by = app.current_user_id. |
| `float_requests` | ketchup_ops, ketchup_finance | SELECT, UPDATE all. |
| `tasks` | field_tech | SELECT, UPDATE only where `assigned_to = app.current_user_id`. |
| `tasks` | field_lead | SELECT, INSERT, UPDATE all. |
| `portal_user_preferences` | all | SELECT, UPDATE only where `portal_user_id = app.current_user_id`. |
| `audit_logs` | ketchup_* | SELECT all. gov_* SELECT where entity_type/scope is government. |

API routes set session variables (e.g. `SET app.current_user_id = ...`) before running queries, or use a single database role and enforce in application code; RLS then adds a second layer of protection.

---

## 5. Consent Management (Future)

If the platform expands to allow third-party access (e.g., a credit bureau requesting beneficiary transaction data with consent), we will implement OAuth2 consent flows as described in the Open Banking standards:

- **Pushed Authorisation Requests (PAR)** – TPP submits consent request to Data Provider.
- **Authorization Code with PKCE** – User authenticates and authorizes at the Data Provider.
- **Access & Refresh Tokens** – TPP receives tokens to call APIs on behalf of the user.
- **Consent Scopes** – e.g., `banking:accounts.basic.read`, `banking:payments.write`.
- **Maximum Consent Duration** – 180 days as per standards.

For now, this is not implemented, but the database includes a `portal_users` table and audit logs that could support future consent tracking.

---

## 6. API Examples

### 6.1 List Beneficiaries (with pagination)

**Request**
```
GET /api/v1/beneficiaries?page=1&limit=20&status=active&region=Khomas
Authorization: Bearer <JWT>
```

**Response**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Doe",
      "phone": "+264811234567",
      "region": "Khomas",
      "wallet_status": "active",
      "proof_of_life_due_date": "2026-06-01T00:00:00Z"
    }
  ],
  "meta": {
    "totalRecords": 150,
    "totalPages": 8,
    "page": 1,
    "limit": 20
  },
  "links": {
    "first": "/api/v1/beneficiaries?page=1&limit=20",
    "prev": null,
    "next": "/api/v1/beneficiaries?page=2&limit=20",
    "last": "/api/v1/beneficiaries?page=8&limit=20"
  }
}
```

### 6.2 Create Float Request (Agent)

**Request**
```
POST /api/v1/agent/float/request
Authorization: Bearer <agent_jwt>
Content-Type: application/json

{
  "amount": 5000.00
}
```

**Response**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "pending",
  "requested_at": "2026-03-15T10:30:00Z"
}
```

### 6.3 Log Maintenance (Field Ops)

**Request**
```
POST /api/v1/field/maintenance
Authorization: Bearer <field_jwt>
Content-Type: application/json

{
  "asset_id": "990e8400-e29b-41d4-a716-446655440004",
  "type": "replenish",
  "notes": "Added N$50,000",
  "cash_before": 12000.00,
  "cash_added": 50000.00
}
```

**Response**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440005",
  "created_at": "2026-03-15T11:00:00Z"
}
```

### 6.4 Error Response

```json
{
  "success": false,
  "error": "Validation failed",
  "error_type": "ValidationError",
  "details": {
    "field": "amount",
    "message": "Amount must be positive"
  }
}
```

---

## 7. OpenAPI Specification

All endpoints will be documented using OpenAPI 3.1.0 YAML files, with separate files for each portal or a combined spec. The specification includes:

- Security schemes: `bearerAuth` (JWT) and `mtlsAuth` (certificate).
- Components for common schemas (Beneficiary, Voucher, etc.).
- Response definitions for 200, 400, 401, 403, 500.

Example snippet:

```yaml
openapi: 3.1.0
info:
  title: Ketchup SmartPay API
  version: 1.0.0
servers:
  - url: https://api.ketchup.cc/api/v1
paths:
  /beneficiaries:
    get:
      summary: List beneficiaries
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: limit
          in: query
          schema: { type: integer, default: 20 }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BeneficiaryList'
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

---

## 8. Conclusion

The database and API design presented here meet all functional requirements from the PRD and align with the security and architectural principles of the Namibian Open Banking Standards. The system is scalable, secure, and ready for incremental implementation. Future extensions (e.g., open consent) can be layered on top without disrupting the core.
