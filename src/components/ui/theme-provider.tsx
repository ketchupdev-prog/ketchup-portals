'use client';

/**
 * ThemeProvider – Portal-specific theme (colors, spacing) via React Context.
 * Location: src/components/ui/theme-provider.tsx
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ThemeConfig {
  primary?: string;
  sidebarCollapsed?: boolean;
}

const defaultTheme: ThemeConfig = {
  primary: '#226644',
  sidebarCollapsed: false,
};

const ThemeContext = createContext<{
  theme: ThemeConfig;
  setTheme: (updater: ThemeConfig | ((prev: ThemeConfig) => ThemeConfig)) => void;
} | null>(null);

export function ThemeProvider({
  children,
  initialTheme = defaultTheme,
  className,
}: {
  children: ReactNode;
  initialTheme?: ThemeConfig;
  className?: string;
}) {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme);
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return (
    <ThemeContext.Provider value={value}>
      <div className={cn(className)} data-theme-provider>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
