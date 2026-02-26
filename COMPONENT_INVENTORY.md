# Ketchup Portals – Complete Component Inventory

Roadmap derived from the PRD, brand guidelines, and common UI patterns. Status: **Done** | **Pending**.

**Implementation:** Portal-specific components (§11) are implemented in their respective portals and wired to **real API endpoints** only—no mocks or placeholder data. Empty states and fallbacks (e.g. "—" when API returns null) are used for display only.

**Task list for pending work:** See **PENDING_COMPONENTS_TASKS.md** for a checklist of all pending components (create + use) with suggested order and locations.

**Extension to all portals:** The components in §1–§9 and §10 (Landing) are the **shared component library**. They are used consistently across:
- **Landing** (`/`) – §10 Landing Page components (Hero, Overview, Portals, CTA, Footer).
- **Auth** – Login and Forgot password use **AuthHero** (compact hero with logo, title, subline, “Back to home”, “Choose your portal”), **Card**, **Input**, **IOSButton**; **LandingFooter** via auth layout. Same library as landing and portals. **Each portal has its own login and forgot-password pages** (e.g. `/ketchup/login`, `/agent/forgot-password`). Global `/login` and `/forgot-password` redirect to the portal inferred from `?redirect=`. See **docs/DNS_AND_REDIRECTS.md**.
- **Header** (all portals) – `BrandLogo` (mark, `ketchup-logo.png`), `UserNav`, `NotificationCenter`, DaisyUI navbar/badge.
- **Ketchup Sidebar** – `BrandLogo` (mark, `ketchup-logo.png`), DaisyUI menu.
- **Government Sidebar** – `BrandLogo` (mark, `ketchup-logo.png`), DaisyUI menu.
- **Agent Sidebar** – `BrandLogo` (mark, `ketchup-logo.png`), DaisyUI menu.
- **Field Ops Sidebar** – `BrandLogo` (mark, `ketchup-logo.png`), DaisyUI menu.
- **Portal pages** (Ketchup, Government, Agent, Field Ops) – Use `Button` / `IOSButton`, `Card`, `DataTable`, `MetricCard`, `SectionHeader`, `Container`, `Input`, `Select`, `Modal`, `Toast`, etc. from this inventory. New portal UI must use these primitives; see PRD §2.4 and §28.

---

## 1. Utilities & Helpers

| Component / File | Purpose | Status |
|------------------|---------|--------|
| `cn()` | Merge Tailwind classes with clsx and tailwind-merge | Done |
| `ThemeProvider` | Portal-specific theme (colors, spacing) via context | Done |
| `LoadingState` | Skeleton, spinner, dots with optional message | Done |
| `ErrorState` | User-friendly error display with retry | Done |
| `EmptyState` | Illustration + message for empty lists | Done |

---

## 2. UI Primitives (Core)

| Component | Variants / Props | Status |
|-----------|------------------|--------|
| `Button` | variant, size, loading, leftIcon, rightIcon, fullWidth | Done |
| `IOSButton` | Pill shape, shadow, hover lift (variant of Button) | Done |
| `PillButton` | Rounded-full for tabs/filters | Done |
| `PillGroup` | Group of pill buttons (tabs, segmented control) | Done |
| `CircleButton` | Icon-only circular button | Done |
| `FAB` | Floating action button | Done |
| `Card` | variant, CardHeader, CardTitle, CardDescription, CardContent, CardFooter | Done |
| `Badge` | variant, size | Done |
| `StatusBadge` | status, size, withDot | Done |
| `Avatar` | User/agent/beneficiary avatar with image or initials | Done |
| `Tooltip` | Simple tooltip | Done |
| `Popover` | Popover for additional info/actions | Done |
| `Modal` | Reusable modal dialog | Done |
| `ConfirmDialog` | Confirmation modal with actions | Done |
| `Toast` | Notification toast (success, error, info) | Done |
| `Progress` | Linear progress bar | Done |
| `Steps` | Step indicator for wizards | Done |
| `Alert` | Inline alert (success, error, warning, info) | Done |

---

## 3. Layout & Navigation

| Component | Description | Used in | Status |
|-----------|-------------|---------|--------|
| `RootLayout` | Top-level layout with providers | All pages | Done |
| `PortalLayout` | Wrapper with dynamic sidebar and header | Ketchup, Government, Agent, Field Ops | Done |
| `Header` | Top bar: **BrandLogo** (mark, `ketchup-logo.png`), search, portal badge, UserNav, NotificationCenter | All portal routes | Done |
| `KetchupSidebar` | Nav + **BrandLogo** (mark, `ketchup-logo.png`) | `/ketchup/*` | Done |
| `GovernmentSidebar` | Nav + **BrandLogo** (mark, `ketchup-logo.png`) | `/government/*` | Done |
| `AgentSidebar` | Nav + **BrandLogo** (mark, `ketchup-logo.png`) | `/agent/*` | Done |
| `FieldOpsSidebar` | Nav + **BrandLogo** (mark, `ketchup-logo.png`) | `/field-ops/*` | Done |
| `UserNav` | User dropdown with profile, settings, logout | Header | Done |
| `NotificationBell` / `NotificationCenter` | Notifications indicator | Header | Done |
| `Breadcrumbs` | Hierarchical navigation trail | Detail pages | Done |
| `Tabs` | Tabbed interface | Detail views | Done |
| `Accordion` | Collapsible sections | Forms, detail | Done |
| `Container` | Max-width centered layout | Landing, portal content | Done |
| `Divider` | Horizontal/vertical separator | Various | Done |

---

## 4. Data Display & Tables

| Component | Description | Status |
|-----------|-------------|--------|
| `DataTable` | Generic table with columns, sorting, pagination, loading, filtering | Done |
| `Pagination` | Standalone pagination controls | Done |
| `MetricCard` | Dashboard metric card with title, value, change, icon, variant | Done |
| `Timeline` | Vertical timeline for audit/activity | Done |
| `EntityCard` | Generic card for any entity (icon, title, stats, actions) | Done |
| `DriverCard` | Driver profile card with photo, contact, status, rating | Done |
| `VehicleCard` | Vehicle profile card with details, fuel, mileage | Done |
| `CardGrid` | Responsive grid for cards | Done |
| `DescriptionList` | Key-value pairs (dl/dt/dd) for details view | Done |

---

## 5. Brand-Specific Graphic Elements

| Component | Description | Status |
|-----------|-------------|--------|
| `BrandLogo` | Full logo (horizontal, vertical, mark, wordmark) | Done |
| `LogoMark` | Isolated circular logo mark | Done |
| `PortalLogo` | Logo with portal label | Done |
| `BrandBadge` | Silver/Gold/Platinum partner badges | Done |
| `PartnerBadge` | Horizontal/vertical lockup | Done |
| `OpenFrame` | Branded frame element | Done |
| `Brackets` | Content-framing brackets | Done |
| `BrandArrow` | Directional arrows for flow | Done |
| `BlurOverlay` | Blurred background overlay | Done |
| `HeroBlur` | Hero section with blurred background | Done |

---

## 6. Forms & Inputs

| Component | Description | Status |
|-----------|-------------|--------|
| `Input` | Text input with label, error, optional icon | Done |
| `Textarea` | Multi-line text input | Done |
| `Select` | Dropdown with options | Done |
| `Checkbox` | Checkbox with label | Done |
| `RadioGroup` | Radio button group | Done |
| `Switch` | Toggle switch | Done |
| `DatePicker` | Date selection | Done |
| `FileUpload` | CSV/PDF upload with drag-and-drop | Done |
| `FormField` | Wrapper for form field with label/error (React Hook Form) | Done |

---

## 7. Charts & Data Visualization

| Component | Description | Library | Status |
|-----------|-------------|---------|--------|
| `LineChart` | Line chart for trends | Recharts | Done |
| `BarChart` | Bar chart for comparisons | Recharts | Done |
| `PieChart` | Pie/donut chart for proportions | Recharts | Done |
| `AreaChart` | Area chart for cumulative data | Recharts | Done |
| `HeatMap` | Regional heat map (grid-based) | Recharts / custom | Done |

---

## 8. Maps & Location

| Component | Description | Library | Status |
|-----------|-------------|---------|--------|
| `Map` | Base map component | Leaflet | Done |
| `MarkerCluster` | Clustered markers wrapper | Leaflet | Done |
| `AssetMarker` | Custom marker for units, ATMs, agents | Leaflet | Done |
| `LiveLocationMarker` | Real-time updates marker | Leaflet | Done |
| `CoverageCircle` | Radius circle around agents | Leaflet | Done |

---

## 9. Media & Carousel

| Component | Description | Status |
|-----------|-------------|--------|
| `Carousel` | Image carousel for banners, galleries | Done |
| `Lightbox` | Full-screen image viewer | Done |

---

## 10. Landing Page (Home)

| Component | Description | Uses | Status |
|-----------|-------------|------|--------|
| `LandingHero` | Hero: logo, headline, CTAs | IOSButton (pill, shadow, hover lift), Image | Done |
| `LandingOverview` | Value prop + four benefit cards | Container, Card, CardHeader, CardTitle, CardContent | Done |
| `LandingPortals` | Four portal entry cards | Container, Card, Badge, Link | Done |
| `LandingCta` | Bottom CTA strip | Container, IOSButton | Done |
| `LandingFooter` | Footer: logo, links, copyright | Container, LogoMark | Done |
| `AuthHero` | Compact hero for sign-in / forgot-password: logo, title, subline, “Back to home”, “Choose your portal” | LogoMark | Done |

**Location:** `src/components/landing/`. Composed in `app/page.tsx`. All sections use the shared UI primitives (IOSButton, Card, Badge, Container, LogoMark) per this inventory.

**Auth (Login & Forgot password):** The sign-in page (`/login`) and forgot-password page (`/forgot-password`) use the same shell: **AuthHero** (branding, headline, links to home and `/#portals`), **Card**, **Input**, **IOSButton**. The auth layout (`(auth)/layout.tsx`) wraps all auth pages with **LandingFooter** so every step shows portal links and “Sign in” / “Choose your portal”. See Extension to all portals above. Each portal has its own auth URLs (e.g. `/ketchup/login`, `/agent/forgot-password`); shared **PortalLoginForm** and **PortalForgotForm**; global `/login` and `/forgot-password` redirect by `?redirect=`. See **docs/DNS_AND_REDIRECTS.md**.

---

## 11. Portal-Specific Components

### Ketchup Portal

| Component | Status |
|-----------|--------|
| `DashboardCards` | Done |
| `RecentActivity` | Done |
| `BeneficiaryTable` | Done |
| `BeneficiaryDetail` | Done |
| `VoucherTable` | Done |
| `VoucherIssueForm` | Done |
| `AgentTable` | Done |
| `AgentDetail` | Done |
| `TerminalInventory` | Done |
| `MobileUnitMap` | Done |
| `MobileUnitDetail` | Done |
| `TrustReconciliation` | Done |
| `AuditLogTable` | Done |
| `UnverifiedBeneficiaries` | Done |
| `NetworkMap` | Done |
| `AppAnalytics` | Done |
| `USSDViewer` | Done |

### Government Portal

| Component | Status |
|-----------|--------|
| `ProgrammeDashboard` | Done |
| `UnverifiedList` | Done |
| `VoucherMonitor` | Done |
| `AuditReportGenerator` | Done |
| `ProgrammeForm` | Done |

### Agent Portal

| Component | Status |
|-----------|--------|
| `AgentDashboard` | Done |
| `FloatHistory` | Done |
| `FloatRequestForm` | Done |
| `TransactionHistory` | Done |
| `ParcelList` | Done |
| `ParcelScan` | Done |
| `CommissionStatement` | Done |

### Field Ops Portal

| Component | Status |
|-----------|--------|
| `FieldMap` | Map with units, ATMs, live positions, coverage circles | Done |
| `AssetList` | Done |
| `AssetDetail` | Done |
| `TaskList` | Task table + create/mark-done modals; used on field-ops/tasks | Done |
| `TaskForm` | Done |
| `MaintenanceLogForm` | Done |
| `RoutePlanner` | Done |
| `ActivityReport` | Done |

---

## Implementation Order (Suggested)

1. **Utilities & Helpers** – cn, LoadingState, ErrorState, EmptyState
2. **UI Primitives** – Button, Card, Badge, StatusBadge, Avatar, Tooltip, Modal, Toast
3. **Layout** – RootLayout, PortalLayout, Sidebar, Header, Breadcrumbs, Tabs, Accordion
4. **Forms** – Input, Select, Checkbox, FormField, DatePicker, FileUpload
5. **Data Display** – DataTable, Pagination, MetricCard, Timeline, EntityCard, DriverCard, VehicleCard, CardGrid
6. **Brand Elements** – BrandLogo, OpenFrame, Brackets, BrandArrow, BlurOverlay
7. **Feedback & Overlays** – ConfirmDialog, Progress, Steps
8. **Charts & Maps** – Recharts and Leaflet wrapper components
9. **Portal-specific** – Ketchup dashboard and core tables, then Agent, Field Ops, Government
