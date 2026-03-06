'use client';

import { useMemo } from 'react';
import { useDashboardSummary } from '@/hooks/use-releases';
import { useSettings } from '@/providers/settings-provider';
import { FinancialReleaseType } from '@/types/financial-release';
import {
  getDateRange,
  computeMonthlyTotals,
  computeSavingsTrend,
  computeCategoryDistribution,
  computeCategoryPerMonth,
} from '@/lib/dashboard-utils';
import { MonthlyLineChart } from '@/components/dashboard/monthly-line-chart';
import { SavingsTrendChart } from '@/components/dashboard/savings-trend-chart';
import { CategoryDonutChart } from '@/components/dashboard/category-donut-chart';
import { CategoryBarChart } from '@/components/dashboard/category-bar-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const { getMonthLabel, t } = useSettings();
  const range = useMemo(() => getDateRange(), []);

  const { data = [], isLoading } = useDashboardSummary(
    range.fromMonth, range.fromYear,
    range.toMonth, range.toYear
  );

  const monthlyTotals = useMemo(
    () => computeMonthlyTotals(data, range.months, getMonthLabel),
    [data, range.months, getMonthLabel]
  );

  const savingsTrend = useMemo(
    () => computeSavingsTrend(monthlyTotals),
    [monthlyTotals]
  );

  const incomeDistribution = useMemo(
    () => computeCategoryDistribution(data, FinancialReleaseType.Receipt),
    [data]
  );

  const expenseDistribution = useMemo(
    () => computeCategoryDistribution(data, FinancialReleaseType.Expense),
    [data]
  );

  const expenseCategoryPerMonth = useMemo(
    () => computeCategoryPerMonth(data, range.months, getMonthLabel, FinancialReleaseType.Expense),
    [data, range.months, getMonthLabel]
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 md:px-6">
        <p className="text-center text-muted-foreground py-12">{t('dashboardNoData')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 md:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyLineChart data={monthlyTotals} />
        <SavingsTrendChart data={savingsTrend} />
        <CategoryDonutChart
          incomeData={incomeDistribution}
          expenseData={expenseDistribution}
        />
        <CategoryBarChart
          chartData={expenseCategoryPerMonth.chartData}
          categories={expenseCategoryPerMonth.categories}
          title={t('dashboardCategoryBreakdown')}
        />
      </div>
    </div>
  );
}
