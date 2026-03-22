'use client';

/**
 * Admin Portal Reset Password Page
 * Location: src/app/admin/reset-password/page.tsx
 */

import { PortalResetPasswordForm } from '@/components/auth/PortalResetPasswordForm';

export default function AdminResetPasswordPage() {
  return <PortalResetPasswordForm portal="admin" />;
}
