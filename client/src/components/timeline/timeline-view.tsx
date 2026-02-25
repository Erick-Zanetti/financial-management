'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useExpenses, useReceipts } from '@/hooks/use-releases';
import { FinancialRelease, FinancialReleaseType } from '@/types/financial-release';
import { useSettings } from '@/providers/settings-provider';
import { cn } from '@/lib/utils';

const CURRENT_BALANCE_KEY = 'financial-management-current-balance';

interface TimelineViewProps {
  month: number;
  year: number;
}

export function TimelineView({ month, year }: TimelineViewProps) {
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses(month, year);
  const { data: receipts = [], isLoading: loadingReceipts } = useReceipts(month, year);
  const { t, formatCurrency } = useSettings();

  const isLoading = loadingExpenses || loadingReceipts;

  const now = new Date();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  const [initialBalance, setInitialBalance] = useState(0);

  useEffect(() => {
    if (!isCurrentMonth) {
      setInitialBalance(0);
      return;
    }
    try {
      const stored = localStorage.getItem(CURRENT_BALANCE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.month === month && parsed.year === year) {
          setInitialBalance(parsed.value);
        }
      }
    } catch {}
  }, [isCurrentMonth, month, year]);

  const sortedReleases = useMemo(() => {
    const all = [...expenses, ...receipts];
    return all.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      if (a.type === b.type) return 0;
      return a.type === FinancialReleaseType.Receipt ? -1 : 1;
    });
  }, [expenses, receipts]);

  const allSettled = sortedReleases.length > 0 && sortedReleases.every((r) => r.settled);

  const getRunningBalance = (index: number) => {
    let balance = initialBalance;
    for (let i = 0; i <= index; i++) {
      const release = sortedReleases[i];
      if (!allSettled && release.settled) continue;
      if (release.type === FinancialReleaseType.Receipt) {
        balance += release.value;
      } else {
        balance -= release.value;
      }
    }
    return balance;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">{t('timeline')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedReleases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">{t('timeline')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {t('noReleasesThisMonth')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{t('timeline')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {isCurrentMonth && initialBalance !== 0 && (
              <div className="relative pl-10">
                <div className="absolute left-2 top-2 h-4 w-4 rounded-full border-2 bg-background border-blue-500" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-4 bg-card border-blue-500/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {t('currentBalance')}
                      </span>
                    </div>
                    <div className={cn(
                      'text-lg font-semibold',
                      initialBalance >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    )}>
                      {formatCurrency(initialBalance)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{t('balance')}</div>
                    <div className={cn(
                      'text-lg font-bold',
                      initialBalance >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    )}>
                      {formatCurrency(initialBalance)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {sortedReleases.map((release, index) => {
              const isReceipt = release.type === FinancialReleaseType.Receipt;
              const balance = getRunningBalance(index);
              const isSettled = !!release.settled;

              return (
                <TimelineItem
                  key={release.id}
                  release={release}
                  isReceipt={isReceipt}
                  isSettled={isSettled}
                  balance={balance}
                  formatCurrencyFn={formatCurrency}
                  dayLabel={t('day')}
                  balanceLabel={t('balance')}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TimelineItemProps {
  release: FinancialRelease;
  isReceipt: boolean;
  isSettled: boolean;
  balance: number;
  formatCurrencyFn: (value: number) => string;
  dayLabel: string;
  balanceLabel: string;
}

function TimelineItem({ release, isReceipt, isSettled, balance, formatCurrencyFn, dayLabel, balanceLabel }: TimelineItemProps) {
  return (
    <div className={cn('relative pl-10', isSettled && 'opacity-60')}>
      <div
        className={cn(
          'absolute left-2 top-2 h-4 w-4 rounded-full border-2 bg-background',
          isReceipt ? 'border-emerald-500' : 'border-red-500'
        )}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-4 bg-card">
        <div className="flex-1">
          <div className={cn('flex items-center gap-2', isSettled && 'line-through')}>
            <span className="text-sm text-muted-foreground">
              {dayLabel} {release.day}
            </span>
            <span className="font-medium">{release.name}</span>
          </div>
          <div
            className={cn(
              'text-lg font-semibold',
              isSettled && 'line-through',
              isReceipt
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            {isReceipt ? '+ ' : '- '}
            {formatCurrencyFn(release.value)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-muted-foreground">{balanceLabel}</div>
          <div
            className={cn(
              'text-lg font-bold',
              balance >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            {formatCurrencyFn(balance)}
          </div>
        </div>
      </div>
    </div>
  );
}
