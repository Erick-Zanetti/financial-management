'use client';

import { useMemo } from 'react';
import { FinancialRelease } from '@/types/financial-release';
import { useSettings } from '@/providers/settings-provider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const COLORS = [
  '#10b981',
  '#06b6d4',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#14b8a6',
  '#6366f1',
  '#f97316',
  '#22d3ee',
  '#a855f7',
  '#84cc16',
  '#e879f9',
  '#2dd4bf',
  '#fb923c',
  '#818cf8',
  '#34d399',
];

interface PieChartProps {
  data: FinancialRelease[];
}

export function PieChart({ data }: PieChartProps) {
  const { formatCurrency } = useSettings();

  const { items, total } = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const t = sorted.reduce((sum, item) => sum + item.value, 0);
    return { items: sorted, total: t };
  }, [data]);

  if (items.length === 0 || total === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="pt-4 space-y-3">
        {/* Stacked bar */}
        <div className="flex w-full h-8 rounded-lg overflow-hidden shadow-inner">
          {items.map((item, index) => {
            const pct = (item.value / total) * 100;
            return (
              <Tooltip key={item.id || index}>
                <TooltipTrigger asChild>
                  <div
                    style={{
                      width: `${pct}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                      minWidth: pct > 0 ? '2px' : '0',
                    }}
                    className="h-full transition-opacity hover:opacity-80 cursor-default"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{item.name}</p>
                  <p>{formatCurrency(item.value)} ({pct.toFixed(1)}%)</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {items.map((item, index) => (
            <div key={item.id || index} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div
                className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="truncate max-w-[120px]">{item.name}</span>
              <span className="tabular-nums font-medium">{((item.value / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
