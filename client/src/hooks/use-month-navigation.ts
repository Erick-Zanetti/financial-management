'use client';

import { useMemo } from 'react';
import { buildDynamicMonths, getCurrentMonthIndex } from '@/lib/months';
import { useAvailableMonths } from '@/hooks/use-releases';
import { useMonth } from '@/providers/month-provider';

export function useMonthNavigation() {
  const { currentYear, currentMonth, setMonth } = useMonth();

  const { data: availableMonths, isLoading } = useAvailableMonths();

  const months = useMemo(
    () => buildDynamicMonths(availableMonths ?? []),
    [availableMonths]
  );

  const currentIndex = useMemo(() => {
    const index = months.findIndex(
      m => m.year === currentYear && m.month === currentMonth
    );
    return index >= 0 ? index : getCurrentMonthIndex(months);
  }, [months, currentYear, currentMonth]);

  const navigateToMonth = (year: number, month: number) => {
    setMonth(year, month);
  };

  return {
    months,
    currentYear,
    currentMonth,
    currentIndex,
    navigateToMonth,
    isLoading,
  };
}
