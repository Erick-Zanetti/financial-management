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

export function generateMonths(count: number = 14): { year: number; month: number }[] {
  const today = new Date();
  today.setMonth(today.getMonth() - 1);

  const months = [];
  for (let i = 0; i < count; i++) {
    months.push({
      year: today.getFullYear(),
      month: today.getMonth() + 1,
    });
    today.setMonth(today.getMonth() + 1);
  }

  return months;
}

export function getCurrentMonthIndex(months: { year: number; month: number }[]): number {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  return months.findIndex(m => m.year === currentYear && m.month === currentMonth);
}
