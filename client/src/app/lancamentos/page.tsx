'use client';

import { useState, useEffect } from 'react';
import { useMonth } from '@/providers/month-provider';
import { useExpenses, useReceipts } from '@/hooks/use-releases';
import { useSettings } from '@/providers/settings-provider';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { ReleaseList } from '@/components/releases/release-list';
import { CumulativeLineChart } from '@/components/charts/bar-chart';
import { FinancialReleaseType } from '@/types/financial-release';
import { TimelineView } from '@/components/timeline/timeline-view';
import { Input } from '@/components/ui/input';

const CURRENT_BALANCE_KEY = 'financial-management-current-balance';

export default function LancamentosPage() {
  const { currentYear: year, currentMonth: month, activeTab } = useMonth();
  const { t, formatDisplayValue, parseCurrency } = useSettings();

  const now = new Date();
  const nowMonth = now.getMonth() + 1;
  const nowYear = now.getFullYear();
  const isCurrentMonth = month === nowMonth && year === nowYear;

  const [displayBalance, setDisplayBalance] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CURRENT_BALANCE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.month === nowMonth && parsed.year === nowYear) {
          setDisplayBalance(formatDisplayValue(parsed.value));
          setCurrentBalance(parsed.value);
        } else {
          localStorage.removeItem(CURRENT_BALANCE_KEY);
          setDisplayBalance('');
          setCurrentBalance(0);
        }
      }
    } catch {
      setDisplayBalance('');
      setCurrentBalance(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formatDisplayValue]);

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
  const balance = totalReceipts - totalExpenses;

  const prevTotalReceipts = prevReceipts.reduce((sum, r) => sum + r.value, 0);
  const prevTotalExpenses = prevExpenses.reduce((sum, e) => sum + e.value, 0);
  const prevBalance = prevTotalReceipts - prevTotalExpenses;

  const isLoading = loadingExpenses || loadingReceipts;

  return (
    <div className="container mx-auto py-6 px-4 space-y-0">
      {isCurrentMonth && (
        <div className="flex items-center gap-3 pb-4">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            {t('currentBalance')}
          </span>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="0,00"
            value={displayBalance}
            onChange={(e) => {
              const raw = e.target.value;
              setDisplayBalance(raw);
              const numeric = parseCurrency(raw);
              setCurrentBalance(numeric);
              localStorage.setItem(
                CURRENT_BALANCE_KEY,
                JSON.stringify({ month: nowMonth, year: nowYear, value: numeric })
              );
            }}
            className="text-lg font-bold w-40"
          />
        </div>
      )}

      {activeTab === 'releases' ? (
        <div className="space-y-6 pt-2">
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

          <CumulativeLineChart receipts={receipts} expenses={expenses} />
        </div>
      ) : (
        <div className="pt-2">
          <TimelineView month={month} year={year} currentBalance={isCurrentMonth ? currentBalance : undefined} />
        </div>
      )}
    </div>
  );
}
