'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, Tag, Settings, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/providers/sidebar-provider';
import { useSettings } from '@/providers/settings-provider';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

const menuItems = [
  { icon: LayoutDashboard, labelKey: 'menuDashboard' as const, href: '/dashboard' },
  { icon: Receipt, labelKey: 'releases' as const, href: '/lancamentos' },
  { icon: Tag, labelKey: 'categories' as const, href: '/categorias' },
  { icon: Settings, labelKey: 'settings' as const, href: '/configuracoes' },
];

function SidebarContent({ onNavigate, forceExpanded }: { onNavigate?: () => void; forceExpanded?: boolean }) {
  const pathname = usePathname();
  const { expanded: sidebarExpanded, toggle } = useSidebar();
  const expanded = forceExpanded ?? sidebarExpanded;
  const { t } = useSettings();

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'flex items-center gap-3 px-4 h-16 w-full hover:bg-white/10 transition-colors',
          expanded ? 'justify-start' : 'justify-center'
        )}
      >
        <Wallet className="h-6 w-6 shrink-0 text-sidebar-active" />
        {expanded && (
          <span className="font-semibold text-sm whitespace-nowrap text-sidebar-foreground">FinanceApp</span>
        )}
      </button>

      <div className="h-px bg-white/10" />

      <nav className="flex-1 flex flex-col gap-1 p-2 mt-1">
        {menuItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          const linkContent = (
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-active/15 text-sidebar-active'
                  : 'text-sidebar-muted hover:bg-white/[0.08] hover:text-sidebar-foreground',
                !expanded && 'justify-center px-0'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {expanded && (
                <span className="whitespace-nowrap">{t(item.labelKey)}</span>
              )}
            </Link>
          );

          if (!expanded) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {t(item.labelKey)}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.href}>{linkContent}</div>;
        })}
      </nav>
    </>
  );
}

export function Sidebar() {
  const { expanded, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex fixed left-0 top-0 z-40 h-screen flex-col bg-sidebar border-r border-white/10 transition-all duration-300',
          expanded ? 'w-60' : 'w-16'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 h-full w-60 flex flex-col bg-sidebar border-r border-white/10 md:hidden animate-in slide-in-from-left duration-300">
            <SidebarContent onNavigate={() => setMobileOpen(false)} forceExpanded />
          </aside>
        </>
      )}
    </>
  );
}
