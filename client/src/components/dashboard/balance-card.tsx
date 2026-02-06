'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/providers/settings-provider';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  balance: number;
  isLoading?: boolean;
}

export function BalanceCard({ balance, isLoading }: BalanceCardProps) {
  const { t, formatCurrency } = useSettings();

  return (
    <Card className="w-full sm:w-auto">
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground mb-1">{t('balance')}</div>
        {isLoading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <div
            className={cn(
              'text-2xl font-bold',
              balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {formatCurrency(balance)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
