'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMonthNavigation } from '@/hooks/use-month-navigation';
import { useMonth, ViewTab } from '@/providers/month-provider';
import { useSettings } from '@/providers/settings-provider';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';

export function MonthNavigation() {
  const { months, currentYear, currentMonth, navigateToMonth, isLoading } = useMonthNavigation();
  const { activeTab, setActiveTab } = useMonth();
  const { getMonthLabel, t } = useSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const activeButton = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      const scrollLeft =
        buttonRect.left -
        containerRect.left -
        containerRect.width / 2 +
        buttonRect.width / 2 +
        container.scrollLeft;

      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [currentYear, currentMonth, months]);

  if (isLoading && months.length <= 1) {
    return (
      <div className="border-b bg-muted/30">
        <div className="flex items-center">
          <div className="flex px-4 py-2 gap-1 flex-1">
            <Button variant="default" size="sm" className="flex-shrink-0 opacity-50" disabled>
              {getMonthLabel(currentMonth)}/{currentYear}
            </Button>
          </div>
          <div className="px-4 py-2 flex-shrink-0">
            <Select value={activeTab} onValueChange={(v) => setActiveTab(v as ViewTab)}>
              <SelectTrigger className="w-[160px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="releases">{t('releases')}</SelectItem>
                <SelectItem value="timeline">{t('timeline')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-muted/30">
      <div className="flex items-center">
        <ScrollArea className="flex-1">
          <div ref={scrollRef} className="flex px-4 py-2 gap-1">
            {months.map((month) => {
              const isActive = month.year === currentYear && month.month === currentMonth;
              return (
                <Button
                  key={`${month.year}-${month.month}`}
                  ref={isActive ? activeRef : null}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'flex-shrink-0 transition-all',
                    isActive && 'shadow-sm'
                  )}
                  onClick={() => navigateToMonth(month.year, month.month)}
                >
                  {getMonthLabel(month.month)}/{month.year}
                </Button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="px-4 py-2 flex-shrink-0">
          <Select value={activeTab} onValueChange={(v) => setActiveTab(v as ViewTab)}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="releases">{t('releases')}</SelectItem>
              <SelectItem value="timeline">{t('timeline')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
