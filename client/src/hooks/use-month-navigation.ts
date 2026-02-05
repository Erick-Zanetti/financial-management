'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { generateMonths, getCurrentMonthIndex } from '@/lib/months';

export function useMonthNavigation() {
  const params = useParams();
  const router = useRouter();

  const months = useMemo(() => generateMonths(14), []);

  const currentYear = params.year ? Number(params.year) : new Date().getFullYear();
  const currentMonth = params.month ? Number(params.month) : new Date().getMonth() + 1;

  const currentIndex = useMemo(() => {
    const index = months.findIndex(
      m => m.year === currentYear && m.month === currentMonth
    );
    return index >= 0 ? index : getCurrentMonthIndex(months);
  }, [months, currentYear, currentMonth]);

  const navigateToMonth = (year: number, month: number, tab?: string) => {
    const path = tab ? `/${year}/${month}/${tab}` : `/${year}/${month}`;
    router.push(path);
  };

  return {
    months,
    currentYear,
    currentMonth,
    currentIndex,
    navigateToMonth,
  };
}
