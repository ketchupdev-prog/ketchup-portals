# Components

Structure follows the [Component Boilerplate Inventory](../../docs/COMPONENT_BOILERPLATE_INVENTORY.md). All components live under this folder; implementation uses **DaisyUI** and **Tailwind**.

## Import paths

You can import from the namespace that fits best:

| Path | Use for |
|------|--------|
| `@/components/ui` | All primitives and styled components (single source of truth) |
| `@/components/common` | Buttons, cards, badges, quick actions, headers |
| `@/components/layout` | Header, PortalLayout, Sidebars, Breadcrumbs, Tabs, Accordion |
| `@/components/forms` | Input, Textarea, Select, Checkbox, RadioGroup, Switch, FormField |
| `@/components/data-display` | DataTable, Pagination, Timeline, MetricCard, EntityCard, CardGrid |
| `@/components/feedback` | LoadingState, ErrorState, EmptyState, Toast, Modal, ConfirmDialog, Progress, Steps |
| `@/components/navigation` | Tabs, Breadcrumbs, Accordion |
| `@/components/overlays` | Tooltip, Modal, ConfirmDialog |
| `@/components/media` | Avatar |
| `@/components/utils` | LoadingState, ErrorState, EmptyState |

Existing imports from `@/components` (root) and `@/components/ui` continue to work unchanged.

## Folders

- **ui/** – Actual component implementations (DaisyUI + Tailwind).
- **common/, layout/, forms/, data-display/, feedback/, navigation/, overlays/, media/, utils/** – Barrel re-exports only; no duplicate code.
- **sidebars/** – Portal-specific sidebars (Ketchup, Government, Agent, Field Ops).
- **ketchup/** – Ketchup portal components (e.g. DashboardCards, RecentActivity).

Future: **charts/**, **maps/** when Recharts/Leaflet wrappers are added.
