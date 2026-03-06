'use client';

import { usePathname } from 'next/navigation';
import { Menu, Moon, Sun, Wallet } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/providers/settings-provider';
import { useSidebar } from '@/providers/sidebar-provider';

function usePageTitle() {
  const pathname = usePathname();
  const { t } = useSettings();

  if (pathname.startsWith('/lancamentos')) return t('releases');
  if (pathname.startsWith('/categorias')) return t('categories');
  if (pathname.startsWith('/configuracoes')) return t('settings');
  if (pathname.startsWith('/dashboard')) return t('menuDashboard');
  return t('appTitle');
}

export function Header() {
  const { t } = useSettings();
  const { theme, setTheme } = useTheme();
  const { setMobileOpen } = useSidebar();
  const pageTitle = usePageTitle();

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Wallet className="h-6 w-6 md:hidden" />
          <span className="font-semibold md:hidden">{t('appTitle')}</span>
          <h1 className="hidden md:block text-lg font-semibold">{pageTitle}</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('toggleTheme')}</span>
        </Button>
      </div>
    </header>
  );
}
