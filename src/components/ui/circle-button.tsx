'use client';

import { Button, type ButtonProps } from './button';

export type CircleButtonProps = Omit<ButtonProps, 'shape' | 'children'> & {
  'aria-label': string;
  children?: React.ReactNode;
};

export function CircleButton({ children, ...props }: CircleButtonProps) {
  return (
    <Button shape="circle" size={props.size ?? 'md'} {...props}>
      {children}
    </Button>
  );
}
