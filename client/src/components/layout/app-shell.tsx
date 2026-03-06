'use client';

import { cn } from '@/lib/utils';
import { useSidebar } from '@/providers/sidebar-provider';
import { Sidebar } from './sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { expanded } = useSidebar();

  return (
    <>
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300 min-h-screen',
          expanded ? 'md:ml-60' : 'md:ml-16'
        )}
      >
        {children}
      </div>
    </>
  );
}
