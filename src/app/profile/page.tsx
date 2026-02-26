'use client';

/**
 * Profile – Shared profile route used from header when not in a portal context.
 * Redirects to Agent profile (the only dedicated profile page for now).
 * Location: src/app/profile/page.tsx
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/agent/profile');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-content-muted">Redirecting to profile…</p>
    </div>
  );
}
