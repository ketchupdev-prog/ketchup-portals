/**
 * Portal auth config – per-portal login/forgot URLs and copy for DNS-friendly, per-portal auth.
 * Used by: per-portal login/forgot pages, global login redirect, LandingPortals, portal-fetch, PortalLayout.
 * Location: src/lib/portal-auth-config.ts
 */

export type PortalSlug = 'ketchup' | 'government' | 'agent' | 'field-ops' | 'admin';

export const PORTAL_AUTH: Record<
  PortalSlug,
  { defaultRedirect: string; loginTitle: string; loginSubline: string; forgotTitle: string; forgotSubline: string; label: string }
> = {
  ketchup: {
    defaultRedirect: '/ketchup/dashboard',
    loginTitle: 'Sign in to Ketchup Portal',
    loginSubline: 'Operations, beneficiaries, vouchers, agents, reconciliation & compliance.',
    forgotTitle: 'Reset password',
    forgotSubline: "Ketchup Portal — we'll send you a link to reset your password.",
    label: 'Ketchup Portal',
  },
  government: {
    defaultRedirect: '/government/dashboard',
    loginTitle: 'Sign in to Government Portal',
    loginSubline: 'Programme monitoring, unverified beneficiaries, voucher oversight & reports.',
    forgotTitle: 'Reset password',
    forgotSubline: "Government Portal — we'll send you a link to reset your password.",
    label: 'Government Portal',
  },
  agent: {
    defaultRedirect: '/agent/dashboard',
    loginTitle: 'Sign in to Agent Portal',
    loginSubline: 'Float balance, transactions, parcels, settlement & commission statements.',
    forgotTitle: 'Reset password',
    forgotSubline: "Agent Portal — we'll send you a link to reset your password.",
    label: 'Agent Portal',
  },
  'field-ops': {
    defaultRedirect: '/field-ops/map',
    loginTitle: 'Sign in to Field Ops Portal',
    loginSubline: 'Map, assets, tasks, activity, routes & field reports.',
    forgotTitle: 'Reset password',
    forgotSubline: "Field Ops Portal — we'll send you a link to reset your password.",
    label: 'Field Ops Portal',
  },
  admin: {
    defaultRedirect: '/admin/dashboard',
    loginTitle: 'Sign in to Admin Portal',
    loginSubline: 'System monitoring, compliance, security, analytics & AI/ML management.',
    forgotTitle: 'Reset password',
    forgotSubline: "Admin Portal — we'll send you a link to reset your password.",
    label: 'Admin Portal',
  },
};

const PORTAL_PREFIXES: { prefix: string; portal: PortalSlug }[] = [
  { prefix: '/ketchup', portal: 'ketchup' },
  { prefix: '/government', portal: 'government' },
  { prefix: '/agent', portal: 'agent' },
  { prefix: '/field-ops', portal: 'field-ops' },
  { prefix: '/admin', portal: 'admin' },
];

/**
 * Infer portal from pathname (e.g. /ketchup/dashboard → ketchup).
 * Returns null if pathname is not a portal path.
 */
export function getPortalFromPath(pathname: string): PortalSlug | null {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  for (const { prefix, portal } of PORTAL_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(prefix + '/')) return portal;
  }
  return null;
}

/**
 * Return portal-specific login URL with optional redirect.
 * Use for 401 redirects and links from landing/footer.
 */
export function getPortalLoginPath(portal: PortalSlug, redirectPath?: string): string {
  const path = `/${portal}/login`;
  const redirect = redirectPath ?? PORTAL_AUTH[portal].defaultRedirect;
  return `${path}?redirect=${encodeURIComponent(redirect)}`;
}

/**
 * Return portal-specific forgot-password URL (optional returnTo for after reset).
 */
export function getPortalForgotPasswordPath(portal: PortalSlug, returnTo?: string): string {
  const path = `/${portal}/forgot-password`;
  if (returnTo) return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
  return path;
}
