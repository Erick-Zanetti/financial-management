'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/providers/settings-provider';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: number;
  previousValue?: number;
  isLoading?: boolean;
  variant: 'balance' | 'income' | 'expense';
  className?: string;
}

export function SummaryCard({
  title,
  value,
  previousValue,
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

  const showComparison =
    previousValue !== undefined && previousValue !== 0;

  let percentChange = 0;
  if (showComparison) {
    percentChange = ((value - previousValue!) / Math.abs(previousValue!)) * 100;
  }

  const isPositiveChange =
    variant === 'expense' ? percentChange < 0 : percentChange > 0;

  const badgeColor = isPositiveChange
    ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950'
    : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950';

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground mb-1">{title}</div>
        {isLoading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <>
            <div className={cn('text-2xl font-bold', valueColor)}>
              {formatCurrency(Math.abs(value))}
            </div>
            {showComparison && (
              <div
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-2',
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
