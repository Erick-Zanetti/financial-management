'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutList, History } from 'lucide-react';

interface SubNavigationProps {
  year: number;
  month: number;
}

export function SubNavigation({ year, month }: SubNavigationProps) {
  const pathname = usePathname();
  const isTimeline = pathname.includes('/timeline');

  const tabs = [
    {
      label: 'Lançamentos',
      href: `/${year}/${month}`,
      icon: LayoutList,
      active: !isTimeline,
    },
    {
      label: 'Linha do tempo',
      href: `/${year}/${month}/timeline`,
      icon: History,
      active: isTimeline,
    },
  ];

  return (
    <div className="border-b">
      <nav className="container flex gap-4 px-4">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors',
              tab.active
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
