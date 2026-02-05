'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getMonthLabel } from '@/lib/months';
import { useMonthNavigation } from '@/hooks/use-month-navigation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export function MonthNavigation() {
  const { months, currentYear, currentMonth, navigateToMonth } = useMonthNavigation();
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
  }, [currentYear, currentMonth]);

  return (
    <div className="border-b bg-muted/30">
      <ScrollArea className="w-full">
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
    </div>
  );
}
