'use client';

/**
 * Admin Portal Login Page
 * Location: src/app/admin/login/page.tsx
 */

import { PortalLoginForm } from '@/components/auth/PortalLoginForm';

export default function AdminLoginPage() {
  return <PortalLoginForm portal="admin" />;
}
