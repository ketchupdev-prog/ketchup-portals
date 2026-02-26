# Component Boilerplate Inventory

Reusable structure for admin/dashboard-style portals (e.g. Ketchup). Use **Tailwind CSS**, optional **Radix UI** primitives, **class-variance-authority**, and **React**. In Ketchup Portals we use **DaisyUI** for styled components; the same folder layout applies.

---

## Folder Structure

```
src/
├── components/
│   ├── ui/                 # Primitive / styled components (DaisyUI-based in this project)
│   ├── common/             # Composed, branded components (Button, Card, etc.)
│   ├── layout/             # Sidebar, Header, Container
│   ├── forms/              # FormField, Input, Select, etc.
│   ├── data-display/       # Tables, lists, cards, badges
│   ├── feedback/           # Toasts, modals, alerts
│   ├── navigation/         # Tabs, breadcrumbs, menu
│   ├── overlays/           # Popovers, tooltips, dialogs
│   ├── media/              # Avatars, images, carousels
│   ├── charts/             # Chart wrappers (Recharts)
│   ├── maps/               # Map components (Leaflet)
│   └── utils/              # LoadingState, ErrorState, EmptyState
├── lib/
│   ├── utils.ts            # cn(), etc.
│   └── ...
└── styles/
    └── globals.css         # Tailwind imports
```

---

## 1. Utilities & Helpers

| Component   | Purpose                          | Implementation Notes                    |
|------------|-----------------------------------|----------------------------------------|
| `cn()`     | Merge Tailwind classes            | `clsx` + `tailwind-merge`              |
| `LoadingState` | Skeleton / spinner / dots     | Accept `type`, `message`, `fullscreen` |
| `ErrorState`   | Error display with retry      | Accept `error`, `onRetry`              |
| `EmptyState`   | Empty list with illustration  | Accept `title`, `description`, `action`|
| `ThemeProvider` | Theme context (colors, spacing) | React Context                          |

---

## 2. UI Primitives (Radix-style or DaisyUI)

Headless primitives (Radix) can be styled with Tailwind; or use DaisyUI for ready-styled components.

| Primitive    | Radix Component                    | Usage                 |
|-------------|-------------------------------------|-----------------------|
| Accordion   | `@radix-ui/react-accordion`         | Collapsible sections  |
| AlertDialog | `@radix-ui/react-alert-dialog`      | Confirmation modals   |
| Checkbox    | `@radix-ui/react-checkbox`         | Checkbox input        |
| Dialog      | `@radix-ui/react-dialog`            | Modal dialogs         |
| DropdownMenu| `@radix-ui/react-dropdown-menu`     | User menu, actions    |
| Label       | `@radix-ui/react-label`             | Form labels           |
| Popover     | `@radix-ui/react-popover`           | Floating panels       |
| RadioGroup  | `@radix-ui/react-radio-group`       | Radio buttons         |
| Select      | `@radix-ui/react-select`            | Dropdown select       |
| Switch      | `@radix-ui/react-switch`            | Toggle switch         |
| Tabs        | `@radix-ui/react-tabs`              | Tabbed interface      |
| Tooltip     | `@radix-ui/react-tooltip`           | Tooltips              |

---

## 3. Common (Branded) Components

### 3.1 Buttons

| Component    | Variants | Notes |
|-------------|----------|-------|
| Button      | variant, size, loading, leftIcon, rightIcon, fullWidth | Core button |
| IOSButton   | iOS-style pill | e.g. `shape="ios"` on Button |
| PillButton  | Rounded-full, tabs/filters | |
| PillGroup   | Group of pill buttons | Segmented control |
| CircleButton | Icon-only circular | |
| FAB         | Floating action button | Fixed position |

### 3.2 Cards

| Component   | Variants / Subcomponents |
|------------|---------------------------|
| Card       | CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| MetricCard | Title, value, change, icon, variant |
| EntityCard | icon, title, stats, actions |
| DriverCard | photo, name, phone, region, status, rating |
| VehicleCard| make, model, year, license, fuel, mileage |
| CardGrid   | Responsive grid, `columns` prop |

### 3.3 Badges & Status

| Component   | Notes |
|------------|--------|
| Badge      | variant, size |
| StatusBadge| status, withDot |
| BrandBadge | Silver / Gold / Platinum |

### 3.4 Avatars

| Component | Props | Notes |
|-----------|-------|--------|
| Avatar    | src, alt, fallback, size | Image or initials |

### 3.5 Brand Elements

BrandLogo, LogoMark, PortalLogo, OpenFrame, Brackets, BrandArrow, BlurOverlay, HeroBlur.

---

## 4. Layout

Container, Grid, Stack, Divider, Sidebar, Header, Breadcrumbs, Tabs, Accordion.

---

## 5. Forms

Input, Textarea, Select, Checkbox, RadioGroup, Switch, DatePicker, FileUpload, FormField, Form.

---

## 6. Data Display

Table, DataTable, Pagination, Timeline, List, DescriptionList, Tree.

---

## 7. Feedback & Overlays

Toast, Alert, Modal, ConfirmDialog, Progress, Skeleton, Spinner.

---

## 8. Navigation

MenuBar, DropdownMenu, ContextMenu, CommandPalette.

---

## 9. Media

Image, Icon, Carousel, Lightbox, Video.

---

## 10. Charts & Maps

Recharts: LineChart, BarChart, PieChart, AreaChart, RadarChart, HeatMap.  
Leaflet: Map, Marker, MarkerCluster, Popup, GeoJSONLayer, LiveLocationMarker.

---

## 11. Typography & Utility

Heading, Text, Code, Blockquote, List; Portal, VisuallyHidden, AspectRatio, ScrollArea.

---

## Implementation

- Use **Radix UI** for headless, accessible primitives when adopting that stack.
- **Ketchup Portals**: uses **DaisyUI** for styled components; same folder structure and naming.
- Style with **Tailwind** and **class-variance-authority** for variants.
- Use `cn()` (clsx + tailwind-merge) for conditional classes.
- TypeScript throughout; export from central `index.ts` per folder.

---

## Dependencies (optional / Radix stack)

```json
{
  "@radix-ui/react-accordion": "^1",
  "@radix-ui/react-alert-dialog": "^1",
  "@radix-ui/react-avatar": "^1",
  "@radix-ui/react-checkbox": "^1",
  "@radix-ui/react-dialog": "^1",
  "@radix-ui/react-dropdown-menu": "^2",
  "@radix-ui/react-label": "^2",
  "@radix-ui/react-popover": "^1",
  "@radix-ui/react-radio-group": "^1",
  "@radix-ui/react-select": "^2",
  "@radix-ui/react-separator": "^1",
  "@radix-ui/react-slider": "^1",
  "@radix-ui/react-switch": "^1",
  "@radix-ui/react-tabs": "^1",
  "@radix-ui/react-tooltip": "^1",
  "class-variance-authority": "^0.7",
  "clsx": "^2",
  "tailwind-merge": "^2",
  "lucide-react": "^0.263",
  "sonner": "^1",
  "react-hook-form": "^7",
  "zod": "^3",
  "recharts": "^2",
  "leaflet": "^1",
  "react-leaflet": "^4",
  "embla-carousel-react": "^8"
}
```

Ketchup Portals currently uses: Next.js, Tailwind, DaisyUI, clsx, tailwind-merge, class-variance-authority, Supabase, Drizzle, Neon.
