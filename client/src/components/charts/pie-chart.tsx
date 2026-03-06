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
  '#7986cb',
  '#4fc3f7',
  '#e57373',
  '#4db6ac',
  '#ba68c8',
  '#f06292',
  '#9575cd',
  '#4dd0e1',
  '#81c784',
  '#dce775',
  '#aed581',
  '#fff176',
  '#ffb74d',
  '#ffd54f',
  '#64b5f6',
  '#ff8a65',
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
      <div className="pt-4 space-y-2">
        {/* Stacked bar */}
        <div className="flex w-full h-8 rounded-md overflow-hidden">
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
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {items.map((item, index) => (
            <div key={item.id || index} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div
                className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="truncate max-w-[120px]">{item.name}</span>
              <span className="tabular-nums">{((item.value / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
