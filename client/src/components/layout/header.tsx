'use client';

import { Menu, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/providers/settings-provider';
import { useSidebar } from '@/providers/sidebar-provider';

export function Header() {
  const { t } = useSettings();
  const { setMobileOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-2 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 md:hidden" />
          <span className="font-semibold md:hidden">{t('appTitle')}</span>
        </div>
      </div>
    </header>
  );
}
