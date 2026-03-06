'use client';

import { cn } from '@/lib/utils';
import { LayoutList, History } from 'lucide-react';
import { useSettings } from '@/providers/settings-provider';

export type SubTab = 'releases' | 'timeline';

interface SubNavigationProps {
  activeTab: SubTab;
  onTabChange: (tab: SubTab) => void;
}

export function SubNavigation({ activeTab, onTabChange }: SubNavigationProps) {
  const { t } = useSettings();

  const tabs = [
    {
      id: 'releases' as SubTab,
      label: t('releases'),
      icon: LayoutList,
      active: activeTab === 'releases',
    },
    {
      id: 'timeline' as SubTab,
      label: t('timeline'),
      icon: History,
      active: activeTab === 'timeline',
    },
  ];

  return (
    <div className="border-b">
      <nav className="container flex gap-4 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors',
              tab.active
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
