'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useExpenses, useReceipts } from '@/hooks/use-releases';
import { useSettings } from '@/providers/settings-provider';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { ReleaseList } from '@/components/releases/release-list';
import { BarChart } from '@/components/charts/bar-chart';
import { FinancialReleaseType } from '@/types/financial-release';
import { SubNavigation, SubTab } from '@/components/layout/sub-navigation';
import { TimelineView } from '@/components/timeline/timeline-view';

export default function DashboardPage() {
  const params = useParams();
  const year = Number(params.year);
  const month = Number(params.month);
  const { t } = useSettings();

  const [activeTab, setActiveTab] = useState<SubTab>('releases');

  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses(month, year);
  const { data: receipts = [], isLoading: loadingReceipts } = useReceipts(month, year);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const { data: prevExpenses = [] } = useExpenses(prevMonth, prevYear);
  const { data: prevReceipts = [] } = useReceipts(prevMonth, prevYear);

  const totalReceipts = receipts.reduce((sum, r) => sum + r.value, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.value, 0);
  const balance = totalReceipts - totalExpenses;

  const prevTotalReceipts = prevReceipts.reduce((sum, r) => sum + r.value, 0);
  const prevTotalExpenses = prevExpenses.reduce((sum, e) => sum + e.value, 0);
  const prevBalance = prevTotalReceipts - prevTotalExpenses;

  const hasTransactions = expenses.length > 0 || receipts.length > 0;
  const allMonthSettled = hasTransactions &&
    expenses.every((e) => e.settled) &&
    receipts.every((r) => r.settled);

  const isLoading = loadingExpenses || loadingReceipts;

  return (
    <div className="space-y-0">
      <div className="-mx-4 -mt-6">
        <SubNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {activeTab === 'releases' ? (
        <div className="space-y-6 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SummaryCard
              title={t('totalBalance')}
              value={balance}
              previousValue={prevBalance}
              isLoading={isLoading}
              variant="balance"
              className="sm:col-span-2 lg:col-span-1"
            />
            <SummaryCard
              title={t('totalIncome')}
              value={totalReceipts}
              previousValue={prevTotalReceipts}
              isLoading={isLoading}
              variant="income"
            />
            <SummaryCard
              title={t('totalExpenses')}
              value={totalExpenses}
              previousValue={prevTotalExpenses}
              isLoading={isLoading}
              variant="expense"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReleaseList
              title={t('receipts')}
              type={FinancialReleaseType.Receipt}
              releases={receipts}
              month={month}
              year={year}
              isLoading={loadingReceipts}
              variant="receipt"
              allMonthSettled={allMonthSettled}
            />

            <ReleaseList
              title={t('expenses')}
              type={FinancialReleaseType.Expense}
              releases={expenses}
              month={month}
              year={year}
              isLoading={loadingExpenses}
              variant="expense"
              allMonthSettled={allMonthSettled}
            />
          </div>

          <BarChart receipts={totalReceipts} expenses={totalExpenses} />
        </div>
      ) : (
        <div className="pt-6">
          <TimelineView month={month} year={year} />
        </div>
      )}
    </div>
  );
}
