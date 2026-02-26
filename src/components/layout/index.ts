/**
 * Layout – Sidebar, Header, PortalLayout, Breadcrumbs, Tabs, Accordion
 * Re-exports for the suggested boilerplate structure.
 */

export { Header } from '../header';
export { PortalLayout } from '../portal-layout';
export { KetchupSidebar } from '../sidebars/ketchup-sidebar';
export { GovernmentSidebar } from '../sidebars/government-sidebar';
export { AgentSidebar } from '../sidebars/agent-sidebar';
export { FieldOpsSidebar } from '../sidebars/field-ops-sidebar';
export {
  Breadcrumbs,
  Tabs,
  Accordion,
  type BreadcrumbsProps,
  type BreadcrumbItem,
  type TabsProps,
  type TabItem,
  type AccordionProps,
  type AccordionItem,
} from '../ui';
export { DetailLayout, type DetailLayoutProps, type DetailLayoutTab } from './detail-layout';
