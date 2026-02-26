/**
 * Government Portal – Forgot password. Per-portal auth; uses shared PortalForgotForm.
 * Location: src/app/government/forgot-password/page.tsx
 */

import { Suspense } from 'react';
import { PortalForgotForm } from '@/components/auth';

export default function GovernmentForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><span className="loading loading-spinner text-primary" /></div>}>
      <PortalForgotForm portal="government" />
    </Suspense>
  );
}
