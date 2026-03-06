export const monthLabels: Record<number, string> = {
  1: 'Jan',
  2: 'Fev',
  3: 'Mar',
  4: 'Abr',
  5: 'Mai',
  6: 'Jun',
  7: 'Jul',
  8: 'Ago',
  9: 'Set',
  10: 'Out',
  11: 'Nov',
  12: 'Dez',
};

export function getMonthLabel(month: number): string {
  return monthLabels[month] || '';
}

function nextMonth(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

export function buildDynamicMonths(
  availableMonths: { year: number; month: number }[]
): { year: number; month: number }[] {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const monthSet = new Set<string>();
  const result: { year: number; month: number }[] = [];

  const addMonth = (y: number, m: number) => {
    const key = `${y}-${m}`;
    if (!monthSet.has(key)) {
      monthSet.add(key);
      result.push({ year: y, month: m });
    }
  };

  // Add all months from the backend
  for (const m of availableMonths) {
    addMonth(m.year, m.month);
  }

  // Always include the current month
  addMonth(currentYear, currentMonth);

  // Add one month after the last available
  if (result.length > 0) {
    result.sort((a, b) => a.year - b.year || a.month - b.month);
    const last = result[result.length - 1];
    const extra = nextMonth(last.year, last.month);
    addMonth(extra.year, extra.month);
  }

  // Final sort
  result.sort((a, b) => a.year - b.year || a.month - b.month);

  return result;
}

export function getCurrentMonthIndex(months: { year: number; month: number }[]): number {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  return months.findIndex(m => m.year === currentYear && m.month === currentMonth);
}
