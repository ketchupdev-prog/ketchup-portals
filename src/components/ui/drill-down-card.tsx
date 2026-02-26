'use client';

/**
 * DrillDownCard – Card that navigates to a filtered list or detail page (organ → tissue).
 * Location: src/components/ui/drill-down-card.tsx
 */

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';

export interface DrillDownCardProps {
  title: string;
  value?: string | number;
  description?: string;
  href: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function DrillDownCard({
  title,
  value,
  description,
  href,
  icon,
  className = '',
  children,
}: DrillDownCardProps) {
  const router = useRouter();

  return (
    <Card
      className={cn('cursor-pointer hover:shadow-lg transition-shadow', className)}
      onClick={() => router.push(href)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon != null && <div className="h-4 w-4 text-content-muted">{icon}</div>}
      </CardHeader>
      <CardContent>
        {value != null && <div className="text-2xl font-bold">{value}</div>}
        {description != null && <CardDescription>{description}</CardDescription>}
        {children}
      </CardContent>
    </Card>
  );
}
