'use client';

/**
 * Admin Portal Forgot Password Page
 * Location: src/app/admin/forgot-password/page.tsx
 */

import { PortalForgotForm } from '@/components/auth/PortalForgotForm';

export default function AdminForgotPasswordPage() {
  return <PortalForgotForm portal="admin" />;
}
