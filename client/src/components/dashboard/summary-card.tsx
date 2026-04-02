'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/providers/settings-provider';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: number;
  previousValue?: number;
  comparisonValue?: number;
  comparisonPreviousValue?: number;
  isLoading?: boolean;
  variant: 'balance' | 'income' | 'expense';
  className?: string;
}

export function SummaryCard({
  title,
  value,
  previousValue,
  comparisonValue,
  comparisonPreviousValue,
  isLoading,
  variant,
  className,
}: SummaryCardProps) {
  const { t, formatCurrency } = useSettings();

  const valueColor =
    variant === 'income'
      ? 'text-emerald-600 dark:text-emerald-400'
      : variant === 'expense'
        ? 'text-red-600 dark:text-red-400'
        : value >= 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400';

  const gradientClass =
    variant === 'income'
      ? 'gradient-emerald-subtle'
      : variant === 'expense'
        ? 'bg-gradient-to-br from-red-500/5 to-red-600/[0.03]'
        : 'bg-gradient-to-br from-primary/5 to-cyan-500/[0.03]';

  const cmpValue = comparisonValue ?? value;
  const cmpPrevious = comparisonPreviousValue ?? previousValue;

  const showComparison =
    cmpPrevious !== undefined && cmpPrevious !== 0;

  let percentChange = 0;
  if (showComparison) {
    percentChange = ((cmpValue - cmpPrevious!) / Math.abs(cmpPrevious!)) * 100;
  }

  const isPositiveChange =
    variant === 'expense' ? percentChange < 0 : percentChange > 0;

  const badgeColor = isPositiveChange
    ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950'
    : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950';

  return (
    <Card className={cn(gradientClass, className)}>
      <CardContent className="pt-5">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">{title}</div>
        {isLoading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <>
            <div className={cn('text-3xl font-bold tracking-tight tabular-nums', valueColor)}>
              {formatCurrency(Math.abs(value))}
            </div>
            {showComparison && (
              <div
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold mt-2',
                  badgeColor
                )}
              >
                {percentChange > 0 ? '+' : ''}
                {percentChange.toFixed(1)}% {t('vsPreviousMonth')}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
