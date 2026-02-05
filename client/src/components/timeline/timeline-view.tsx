'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useExpenses, useReceipts } from '@/hooks/use-releases';
import { FinancialRelease, FinancialReleaseType } from '@/types/financial-release';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

interface TimelineViewProps {
  month: number;
  year: number;
}

export function TimelineView({ month, year }: TimelineViewProps) {
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses(month, year);
  const { data: receipts = [], isLoading: loadingReceipts } = useReceipts(month, year);

  const isLoading = loadingExpenses || loadingReceipts;

  const sortedReleases = useMemo(() => {
    const all = [...expenses, ...receipts];
    return all.sort((a, b) => a.day - b.day);
  }, [expenses, receipts]);

  const getRunningBalance = (index: number) => {
    let balance = 0;
    for (let i = 0; i <= index; i++) {
      const release = sortedReleases[i];
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
          <CardTitle className="text-lg font-medium">Linha do tempo</CardTitle>
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
          <CardTitle className="text-lg font-medium">Linha do tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Nenhum lançamento para este mês
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Linha do tempo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {sortedReleases.map((release, index) => {
              const isReceipt = release.type === FinancialReleaseType.Receipt;
              const balance = getRunningBalance(index);

              return (
                <TimelineItem
                  key={release.id}
                  release={release}
                  isReceipt={isReceipt}
                  balance={balance}
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
  balance: number;
}

function TimelineItem({ release, isReceipt, balance }: TimelineItemProps) {
  return (
    <div className="relative pl-10">
      <div
        className={cn(
          'absolute left-2 top-2 h-4 w-4 rounded-full border-2 bg-background',
          isReceipt ? 'border-emerald-500' : 'border-red-500'
        )}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-4 bg-card">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Dia {release.day}
            </span>
            <span className="font-medium">{release.name}</span>
          </div>
          <div
            className={cn(
              'text-lg font-semibold',
              isReceipt
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            {isReceipt ? '+ ' : '- '}
            {formatCurrency(release.value)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-muted-foreground">Saldo</div>
          <div
            className={cn(
              'text-lg font-bold',
              balance >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            {formatCurrency(balance)}
          </div>
        </div>
      </div>
    </div>
  );
}
