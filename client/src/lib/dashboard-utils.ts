import { DashboardSummaryItem, FinancialReleaseType } from '@/types/financial-release';

export interface DateRange {
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
  months: { year: number; month: number }[];
}

export interface MonthlyTotal {
  label: string;
  month: number;
  year: number;
  income: number;
  expenses: number;
}

export interface SavingsPoint {
  label: string;
  savings: number;
}

export interface CategorySlice {
  name: string;
  value: number;
}

export function getDateRange(): DateRange {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const months: { year: number; month: number }[] = [];

  // 5 months back
  for (let i = -5; i <= 6; i++) {
    let m = currentMonth + i;
    let y = currentYear;
    while (m < 1) { m += 12; y--; }
    while (m > 12) { m -= 12; y++; }
    months.push({ year: y, month: m });
  }

  return {
    fromMonth: months[0].month,
    fromYear: months[0].year,
    toMonth: months[months.length - 1].month,
    toYear: months[months.length - 1].year,
    months,
  };
}

export function computeMonthlyTotals(
  data: DashboardSummaryItem[],
  months: { year: number; month: number }[],
  getMonthLabel: (month: number) => string
): MonthlyTotal[] {
  return months.map(({ year, month }) => {
    const monthData = data.filter(d => d.year === year && d.month === month);
    const income = monthData
      .filter(d => d.type === FinancialReleaseType.Receipt)
      .reduce((sum, d) => sum + d.total, 0);
    const expenses = monthData
      .filter(d => d.type === FinancialReleaseType.Expense)
      .reduce((sum, d) => sum + d.total, 0);

    return {
      label: `${getMonthLabel(month)}/${year}`,
      month,
      year,
      income,
      expenses,
    };
  });
}

export function computeSavingsTrend(monthlyTotals: MonthlyTotal[]): SavingsPoint[] {
  return monthlyTotals.map(mt => ({
    label: mt.label,
    savings: mt.income - mt.expenses,
  }));
}

export function computeCategoryDistribution(
  data: DashboardSummaryItem[],
  type: FinancialReleaseType
): CategorySlice[] {
  const map = new Map<string, number>();

  for (const d of data) {
    if (d.type !== type) continue;
    map.set(d.categoryName, (map.get(d.categoryName) || 0) + d.total);
  }

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function computeCategoryPerMonth(
  data: DashboardSummaryItem[],
  months: { year: number; month: number }[],
  getMonthLabel: (month: number) => string,
  type: FinancialReleaseType
): { chartData: Record<string, unknown>[]; categories: string[] } {
  const categorySet = new Set<string>();

  for (const d of data) {
    if (d.type === type) categorySet.add(d.categoryName);
  }

  const categories = Array.from(categorySet).sort();

  const chartData = months.map(({ year, month }) => {
    const row: Record<string, unknown> = { label: `${getMonthLabel(month)}/${year}` };
    for (const cat of categories) {
      const match = data.find(
        d => d.year === year && d.month === month && d.type === type && d.categoryName === cat
      );
      row[cat] = match ? match.total : 0;
    }
    return row;
  });

  return { chartData, categories };
}
