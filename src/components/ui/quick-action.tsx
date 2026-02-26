'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface QuickActionProps {
  href: string;
  icon?: React.ReactNode;
  label: string;
  description?: string;
  className?: string;
}

export function QuickAction({
  href,
  icon,
  label,
  description,
  className = '',
}: QuickActionProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center justify-center p-6 rounded-xl border border-base-300 bg-base-100 hover:bg-base-200 hover:border-primary/30 transition-all min-h-[120px]',
        className
      )}
    >
      {icon != null && <div className="text-2xl mb-2">{icon}</div>}
      <span className="font-medium">{label}</span>
      {description != null && (
        <span className="text-xs text-content-muted mt-1">{description}</span>
      )}
    </Link>
  );
}
