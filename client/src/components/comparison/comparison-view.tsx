'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { ReleaseList } from '@/components/releases/release-list';
import { useExpenses, useMonthSnapshot, useReceipts } from '@/hooks/use-releases';
import { useSettings } from '@/providers/settings-provider';
import { FinancialReleaseType } from '@/types/financial-release';
import {
  diffReleases,
  formatCapturedAt,
  noSnapshotMessage,
  snapshotToReleases,
} from '@/lib/snapshot-diff';

interface ComparisonViewProps {
  month: number;
  year: number;
}

const round2 = (x: number): number => Math.round(x * 100) / 100;

function ColumnTitle({ left, right }: { left: string; right?: string }) {
  return (
    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <span>{left}</span>
      {right && <span className="normal-case font-normal">{right}</span>}
    </div>
  );
}

export function ComparisonView({ month, year }: ComparisonViewProps) {
  const { t } = useSettings();
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses(month, year);
  const { data: receipts = [], isLoading: loadingReceipts } = useReceipts(month, year);
  const { data: snapshot, isLoading: loadingSnapshot, isError } = useMonthSnapshot(month, year);

  const view = useMemo(() => {
    if (!snapshot) return null;
    const snapshotReceipts = snapshotToReleases(snapshot, FinancialReleaseType.Receipt);
    const snapshotExpenses = snapshotToReleases(snapshot, FinancialReleaseType.Expense);
    const receiptDiff = diffReleases(snapshotReceipts, receipts);
    const expenseDiff = diffReleases(snapshotExpenses, expenses);
    const currentBalance = round2(receiptDiff.currentTotal - expenseDiff.currentTotal);
    const snapshotBalance = round2(receiptDiff.snapshotTotal - expenseDiff.snapshotTotal);
    return {
      snapshotReceipts,
      snapshotExpenses,
      receiptDiff,
      expenseDiff,
      currentBalance,
      snapshotBalance,
      balanceDelta: round2(currentBalance - snapshotBalance),
    };
  }, [snapshot, receipts, expenses]);

  const isLoading = loadingExpenses || loadingReceipts || loadingSnapshot;

  if (!isLoading && (isError || !view)) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {isError ? t('snapshotLoadFailed') : noSnapshotMessage(year, month)}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
      <div className="space-y-4 min-w-0">
        <ColumnTitle left={t('comparisonCurrent')} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard title={t('totalIncome')} value={view?.receiptDiff.currentTotal ?? 0}
            snapshotDelta={view?.receiptDiff.delta} isLoading={isLoading} variant="income" />
          <SummaryCard title={t('totalExpenses')} value={view?.expenseDiff.currentTotal ?? 0}
            snapshotDelta={view?.expenseDiff.delta} isLoading={isLoading} variant="expense" />
          <SummaryCard title={t('totalBalance')} value={view?.currentBalance ?? 0}
            snapshotDelta={view?.balanceDelta} isLoading={isLoading} variant="balance" />
        </div>
        <ReleaseList title={t('receipts')} type={FinancialReleaseType.Receipt} releases={receipts}
          month={month} year={year} isLoading={isLoading} variant="receipt"
          comparison={{ marks: view?.receiptDiff.currentMarks ?? new Map(), readOnly: false }} />
        <ReleaseList title={t('expenses')} type={FinancialReleaseType.Expense} releases={expenses}
          month={month} year={year} isLoading={isLoading} variant="expense"
          comparison={{ marks: view?.expenseDiff.currentMarks ?? new Map(), readOnly: false }} />
      </div>

      <div className="space-y-4 min-w-0">
        <ColumnTitle
          left={snapshot ? `${t('comparisonSnapshot')} · ${formatCapturedAt(snapshot.capturedAt)}` : t('comparisonSnapshot')}
          right={t('readOnly')}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard title={t('totalIncome')} value={view?.receiptDiff.snapshotTotal ?? 0}
            isLoading={isLoading} variant="income" />
          <SummaryCard title={t('totalExpenses')} value={view?.expenseDiff.snapshotTotal ?? 0}
            isLoading={isLoading} variant="expense" />
          <SummaryCard title={t('totalBalance')} value={view?.snapshotBalance ?? 0}
            isLoading={isLoading} variant="balance" />
        </div>
        <ReleaseList title={t('receipts')} type={FinancialReleaseType.Receipt} releases={view?.snapshotReceipts ?? []}
          month={month} year={year} isLoading={isLoading} variant="receipt"
          comparison={{ marks: view?.receiptDiff.snapshotMarks ?? new Map(), readOnly: true }} />
        <ReleaseList title={t('expenses')} type={FinancialReleaseType.Expense} releases={view?.snapshotExpenses ?? []}
          month={month} year={year} isLoading={isLoading} variant="expense"
          comparison={{ marks: view?.expenseDiff.snapshotMarks ?? new Map(), readOnly: true }} />
      </div>
    </div>
  );
}
