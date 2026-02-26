# Ketchup Portals – Complete Component Inventory

Roadmap derived from the PRD, brand guidelines, and common UI patterns. Status: **Done** | **Pending**.

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

| Component | Description | Status |
|-----------|-------------|--------|
| `RootLayout` | Top-level layout with providers | Done |
| `PortalLayout` | Wrapper with dynamic sidebar and header | Done |
| `Sidebar` (per portal) | Ketchup, Gov, Agent, Field Ops | Done |
| `Header` | Top bar with user menu, notifications, search | Done |
| `SidebarNav` | Navigation items list (inside Sidebar) | Done (inline) |
| `UserNav` | User dropdown with profile, settings, logout | Done |
| `NotificationBell` | Real-time notifications indicator | Done |
| `Breadcrumbs` | Hierarchical navigation trail | Done |
| `Tabs` | Tabbed interface for detail views | Done |
| `Accordion` | Collapsible sections | Done |
| `Container` | Max-width centered layout | Done |
| `Divider` | Horizontal/vertical separator | Done |

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
| `LiveLocationMarker` | Real-time updates marker | Pending |
| `CoverageCircle` | Radius circle around agents | Pending |

---

## 9. Media & Carousel

| Component | Description | Status |
|-----------|-------------|--------|
| `Carousel` | Image carousel for banners, galleries | Pending |
| `Lightbox` | Full-screen image viewer | Pending |

---

## 10. Portal-Specific Components

### Ketchup Portal

| Component | Status |
|-----------|--------|
| `DashboardCards` | Done |
| `RecentActivity` | Done |
| `BeneficiaryTable` | Pending |
| `BeneficiaryDetail` | Pending |
| `VoucherTable` | Pending |
| `VoucherIssueForm` | Pending |
| `AgentTable` | Pending |
| `AgentDetail` | Pending |
| `TerminalInventory` | Pending |
| `MobileUnitMap` | Pending |
| `MobileUnitDetail` | Pending |
| `TrustReconciliation` | Pending |
| `AuditLogTable` | Pending |
| `UnverifiedBeneficiaries` | Pending |
| `NetworkMap` | Pending |
| `AppAnalytics` | Pending |
| `USSDViewer` | Pending |

### Government Portal

| Component | Status |
|-----------|--------|
| `ProgrammeDashboard` | Pending |
| `UnverifiedList` | Pending |
| `VoucherMonitor` | Pending |
| `AuditReportGenerator` | Pending |
| `ProgrammeForm` | Pending |

### Agent Portal

| Component | Status |
|-----------|--------|
| `AgentDashboard` | Pending |
| `FloatHistory` | Pending |
| `FloatRequestForm` | Pending |
| `TransactionHistory` | Pending |
| `ParcelList` | Pending |
| `ParcelScan` | Pending |
| `CommissionStatement` | Pending |

### Field Ops Portal

| Component | Status |
|-----------|--------|
| `FieldMap` | Pending |
| `AssetList` | Pending |
| `AssetDetail` | Pending |
| `TaskList` | Pending |
| `TaskForm` | Pending |
| `MaintenanceLogForm` | Pending |
| `RoutePlanner` | Pending |
| `ActivityReport` | Pending |

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
