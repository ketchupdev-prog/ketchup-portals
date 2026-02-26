'use client';

/**
 * IOSButton – iOS-style pill button with shadow and hover lift.
 * Location: src/components/ui/ios-button.tsx
 */

import { Button, type ButtonProps } from './button';
import { cn } from '@/lib/utils';

export type IOSButtonProps = Omit<ButtonProps, 'shape'>;

export function IOSButton({ className, ...props }: IOSButtonProps) {
  return (
    <Button
      shape="pill"
      className={cn(
        'shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all',
        className
      )}
      {...props}
    />
  );
}
