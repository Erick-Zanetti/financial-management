'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { buildDynamicMonths, getCurrentMonthIndex } from '@/lib/months';
import { useAvailableMonths } from '@/hooks/use-releases';

export function useMonthNavigation() {
  const params = useParams();
  const router = useRouter();

  const { data: availableMonths, isLoading } = useAvailableMonths();

  const months = useMemo(
    () => buildDynamicMonths(availableMonths ?? []),
    [availableMonths]
  );

  const currentYear = params.year ? Number(params.year) : new Date().getFullYear();
  const currentMonth = params.month ? Number(params.month) : new Date().getMonth() + 1;

  const currentIndex = useMemo(() => {
    const index = months.findIndex(
      m => m.year === currentYear && m.month === currentMonth
    );
    return index >= 0 ? index : getCurrentMonthIndex(months);
  }, [months, currentYear, currentMonth]);

  const navigateToMonth = (year: number, month: number) => {
    router.push(`/lancamentos/${year}/${month}`);
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
