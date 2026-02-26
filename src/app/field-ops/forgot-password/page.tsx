/**
 * Field Ops Portal – Forgot password. Per-portal auth; uses shared PortalForgotForm.
 * Location: src/app/field-ops/forgot-password/page.tsx
 */

import { Suspense } from 'react';
import { PortalForgotForm } from '@/components/auth';

export default function FieldOpsForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><span className="loading loading-spinner text-primary" /></div>}>
      <PortalForgotForm portal="field-ops" />
    </Suspense>
  );
}
