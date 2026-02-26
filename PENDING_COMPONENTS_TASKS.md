# Pending Components – Task / Todo List

Checklist derived from **COMPONENT_INVENTORY.md**. Each task = create the component and wire it into the app (page or parent component). Status: ⬜ Not started | 🟦 In progress | ✅ Done.

**Implementation:** All tasks below are implemented with **real API data** only (no mocks, no placeholders). Pages fetch from the documented API routes and pass responses to components.

---

## How to use this list

1. Pick a section or portal below.
2. Create the component in the path indicated (reuse DataTable, Card, Modal, etc. from COMPONENT_INVENTORY §1–§9).
3. Use the component on the corresponding page(s) and update COMPONENT_INVENTORY.md to **Done**.
4. Mark the task ✅ here when done.

---

## Ketchup Portal

| # | Task | Component | Location / Use | PRD ref |
|---|------|-----------|----------------|--------|
| K1 | ✅ Create **BeneficiaryTable** | Table of beneficiaries with search, filters, link to detail | `src/components/ketchup/beneficiary-table.tsx` → use on `app/ketchup/beneficiaries/page.tsx` | §3.x |
| K2 | ✅ Create **BeneficiaryDetail** | Detail view for one beneficiary (proof-of-life, history) | `src/components/ketchup/beneficiary-detail.tsx` → use on `app/ketchup/beneficiaries/[id]/page.tsx` | §3.x |
| K3 | ✅ Create **VoucherTable** | Table of vouchers (status, expiry, link to detail) | `src/components/ketchup/voucher-table.tsx` → use on `app/ketchup/vouchers/page.tsx` | §3.x |
| K4 | ✅ Create **VoucherIssueForm** | Form/modal to issue voucher(s) | `src/components/ketchup/voucher-issue-form.tsx` → use from vouchers or duplicate-redemptions flow | §3.x |
| K5 | ✅ Create **AgentTable** | Table of agents with status, float, link to detail | `src/components/ketchup/agent-table.tsx` → use on `app/ketchup/agents/page.tsx` | §3.x |
| K6 | ✅ Create **AgentDetail** | Detail view for one agent (float, terminals, history) | `src/components/ketchup/agent-detail.tsx` → use on `app/ketchup/agents/[id]/page.tsx` | §3.x |
| K7 | ✅ Create **TerminalInventory** | List/grid of terminals per agent or global | `src/components/ketchup/terminal-inventory.tsx` → use on `app/ketchup/terminal-inventory/page.tsx` | §3.x |
| K8 | ✅ Create **MobileUnitMap** | Map view of mobile units (already exists: `mobile-units-map.tsx`) – verify and mark **Done** or extend | `src/components/ketchup/mobile-units-map.tsx` → `app/ketchup/mobile-units/page.tsx` | §3.2.5 |
| K9 | ✅ Create **MobileUnitDetail** | Detail view for one mobile unit / ATM | `src/components/ketchup/mobile-unit-detail.tsx` → use on `app/ketchup/mobile-units/[id]/page.tsx` | §3.x |
| K10 | ✅ Create **TrustReconciliation** | Trust account reconciliation view | `src/components/ketchup/trust-reconciliation.tsx` → use on `app/ketchup/reconciliation/page.tsx` | §3.x |
| K11 | ✅ Create **AuditLogTable** | Table of audit log entries with filters | `src/components/ketchup/audit-log-table.tsx` → use on `app/ketchup/audit/page.tsx` | §3.x |
| K12 | ✅ Create **UnverifiedBeneficiaries** | List of unverified / overdue beneficiaries | `src/components/ketchup/unverified-beneficiaries.tsx` → use on Ketchup or Government flow | §3.x |
| K13 | ✅ Create **NetworkMap** | Integrated network map (page exists; ensure component is named and used) | `src/components/ketchup/network-map.tsx` or reuse Map + markers → `app/ketchup/network-map/page.tsx` | §3.2.8 |
| K14 | ✅ Create **AppAnalytics** | App usage analytics (DAU, sessions, etc.) | `src/components/ketchup/app-analytics.tsx` → use on `app/ketchup/app-analytics/page.tsx` | §3.x |
| K15 | ✅ Create **USSDViewer** | USSD session / flow viewer | `src/components/ketchup/ussd-viewer.tsx` → use on `app/ketchup/ussd-viewer/page.tsx` | §3.x |

---

## Government Portal

| # | Task | Component | Location / Use | PRD ref |
|---|------|-----------|----------------|--------|
| G1 | ✅ Create **ProgrammeDashboard** | Dashboard for programme monitoring (KPIs, status) | `src/components/government/programme-dashboard.tsx` → use on `app/government/dashboard/page.tsx` or programmes | §4.x |
| G2 | ✅ Create **UnverifiedList** | List of unverified beneficiaries for government oversight | `src/components/government/unverified-list.tsx` → use on `app/government/unverified/page.tsx` | §4.x |
| G3 | ✅ Create **VoucherMonitor** | Monitor voucher issuance / redemption by programme | `src/components/government/voucher-monitor.tsx` → use on `app/government/vouchers/page.tsx` or new page | §4.x |
| G4 | ✅ Create **AuditReportGenerator** | Generate / export audit reports | `src/components/government/audit-report-generator.tsx` → use on reports or config | §4.x |
| G5 | ✅ Create **ProgrammeForm** | Create / edit programme | `src/components/government/programme-form.tsx` → use on `app/government/programmes/page.tsx` or modal | §4.x |

---

## Agent Portal

| # | Task | Component | Location / Use | PRD ref |
|---|------|-----------|----------------|--------|
| A1 | ✅ Create **AgentDashboard** | Agent-specific dashboard (float, pending parcels, recent tx) | `src/components/agent/agent-dashboard.tsx` → use on `app/agent/dashboard/page.tsx` | §5.x |
| A2 | ✅ Create **FloatHistory** | History of float requests and top-ups | `src/components/agent/float-history.tsx` → use on `app/agent/float/page.tsx` or tab | §5.x |
| A3 | ✅ Create **FloatRequestForm** | Form to request float top-up | `src/components/agent/float-request-form.tsx` → use on agent float page | §5.x |
| A4 | ✅ Create **TransactionHistory** | List of agent transactions | `src/components/agent/transaction-history.tsx` → use on `app/agent/transactions/page.tsx` | §5.x |
| A5 | ✅ Create **ParcelList** | List of parcels (ready for pickup, etc.) | `src/components/agent/parcel-list.tsx` → use on `app/agent/parcels/page.tsx` | §5.x |
| A6 | ✅ Create **ParcelScan** | Scan / acknowledge parcel | `src/components/agent/parcel-scan.tsx` → use from parcels flow | §5.x |
| A7 | ✅ Create **CommissionStatement** | Commission statement view / export | `src/components/agent/commission-statement.tsx` → use on agent profile or dedicated page | §5.x |

---

## Field Ops Portal

| # | Task | Component | Location / Use | PRD ref |
|---|------|-----------|----------------|--------|
| F1 | ✅ Create **AssetList** | List of assets (units, ATMs) with status | `src/components/field-ops/asset-list.tsx` → use on `app/field-ops/assets/page.tsx` | §6.x |
| F2 | ✅ Create **AssetDetail** | Detail view for one asset (maintenance, tasks) | `src/components/field-ops/asset-detail.tsx` → use on asset detail page if added | §6.x |
| F3 | ✅ Create **TaskForm** | Standalone task create/edit form (optional if TaskList covers create) | `src/components/field-ops/task-form.tsx` → reuse in TaskList or separate flow | §6.2.3 |
| F4 | ✅ Create **MaintenanceLogForm** | Log maintenance for an asset | `src/components/field-ops/maintenance-log-form.tsx` → use from asset detail or tasks | §6.x |
| F5 | ✅ Create **RoutePlanner** | Plan / view routes for field techs | `src/components/field-ops/route-planner.tsx` → use on `app/field-ops/routes/page.tsx` | §6.x |
| F6 | ✅ Create **ActivityReport** | Activity / field report view or form | `src/components/field-ops/activity-report.tsx` → use on `app/field-ops/activity/page.tsx` or reports | §6.x |

---

## Summary counts

| Portal    | Pending | Done (inventory) |
|-----------|---------|-------------------|
| Ketchup   | 0       | 17 (DashboardCards, RecentActivity, + 15 created) |
| Government| 0       | 5                 |
| Agent     | 0       | 7                 |
| Field Ops | 0       | 8 (FieldMap, TaskList, + 6 created) |
| **Total** | **0**   | **37**            |

---

## Suggested implementation order

1. **Agent** – AgentDashboard, FloatHistory, FloatRequestForm, TransactionHistory (agent dashboard and float are central).
2. **Ketchup** – BeneficiaryTable, BeneficiaryDetail, VoucherTable, AgentTable, AgentDetail (core ops).
3. **Government** – ProgrammeDashboard, UnverifiedList, VoucherMonitor (oversight).
4. **Field Ops** – AssetList, AssetDetail, MaintenanceLogForm, RoutePlanner, ActivityReport (field workflows).
5. **Ketchup (rest)** – TerminalInventory, MobileUnitDetail, TrustReconciliation, AuditLogTable, UnverifiedBeneficiaries, NetworkMap, AppAnalytics, USSDViewer, VoucherIssueForm.

---

## Notes

- Reuse **DataTable**, **Card**, **Modal**, **Button**, **Input**, **Select**, **SectionHeader**, **LoadingState**, **ErrorState** from the shared library.
- Each component: add a short doc comment (purpose, location, PRD), then wire into the page listed in “Location / Use”.
- After implementing, set the component’s row in **COMPONENT_INVENTORY.md** to **Done** and mark the row above with ✅.
