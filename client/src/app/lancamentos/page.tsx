'use client';

import { useMonth } from '@/providers/month-provider';
import { useExpenses, useReceipts } from '@/hooks/use-releases';
import { useSettings } from '@/providers/settings-provider';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { ReleaseList } from '@/components/releases/release-list';
import { CumulativeLineChart } from '@/components/charts/bar-chart';
import { FinancialReleaseType } from '@/types/financial-release';
import { TimelineView } from '@/components/timeline/timeline-view';

export default function LancamentosPage() {
  const { currentYear: year, currentMonth: month, activeTab, currentBalance } = useMonth();
  const { t } = useSettings();

  const now = new Date();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses(month, year);
  const { data: receipts = [], isLoading: loadingReceipts } = useReceipts(month, year);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const { data: prevExpenses = [] } = useExpenses(prevMonth, prevYear);
  const { data: prevReceipts = [] } = useReceipts(prevMonth, prevYear);

  const hasTransactions = expenses.length > 0 || receipts.length > 0;
  const allMonthSettled = hasTransactions &&
    expenses.every((e) => e.settled) &&
    receipts.every((r) => r.settled);

  const shouldFilterBySettled = isCurrentMonth && !allMonthSettled;

  const totalReceipts = shouldFilterBySettled
    ? receipts.filter((r) => !r.settled).reduce((sum, r) => sum + r.value, 0)
    : receipts.reduce((sum, r) => sum + r.value, 0);
  const totalExpenses = shouldFilterBySettled
    ? expenses.filter((e) => !e.settled).reduce((sum, e) => sum + e.value, 0)
    : expenses.reduce((sum, e) => sum + e.value, 0);
  const monthBalance = totalReceipts - totalExpenses;
  const balance = isCurrentMonth ? currentBalance + monthBalance : monthBalance;

  const prevTotalReceipts = prevReceipts.reduce((sum, r) => sum + r.value, 0);
  const prevTotalExpenses = prevExpenses.reduce((sum, e) => sum + e.value, 0);
  const prevBalance = prevTotalReceipts - prevTotalExpenses;

  const isLoading = loadingExpenses || loadingReceipts;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 md:px-6">
      {activeTab === 'releases' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
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
            <SummaryCard
              title={t('totalBalance')}
              value={balance}
              previousValue={prevBalance}
              isLoading={isLoading}
              variant="balance"
              className="sm:col-span-2 lg:col-span-1"
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

          <CumulativeLineChart receipts={receipts} expenses={expenses} />
        </div>
      ) : (
        <TimelineView month={month} year={year} currentBalance={isCurrentMonth ? currentBalance : undefined} />
      )}
    </div>
  );
}
