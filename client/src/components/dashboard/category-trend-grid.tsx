'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/providers/settings-provider';
import { buildCategoryColorMap } from '@/lib/category-colors';
import {
  DashboardSummaryItem,
  FinancialReleaseType,
  Month,
} from '@/types/financial-release';

interface CategoryTrendGridProps {
  data: DashboardSummaryItem[];
  months: Month[];
  title: string;
}

interface TrendPoint {
  label: string;
  value: number;
}

interface CategorySeries {
  name: string;
  color: string;
  points: TrendPoint[];
  total: number;
  max: number;
  average: number;
}

export function CategoryTrendGrid({ data, months, title }: CategoryTrendGridProps) {
  const { formatCurrency, getMonthLabel, t } = useSettings();

  const series = useMemo<CategorySeries[]>(() => {
    const expenses = data.filter(
      (d) => d.type === FinancialReleaseType.Expense,
    );
    const names = Array.from(new Set(expenses.map((d) => d.categoryName)));
    const colorMap = buildCategoryColorMap(names);

    const byKey = new Map<string, number>();
    expenses.forEach((d) => {
      const key = `${d.categoryName}|${d.year}|${d.month}`;
      byKey.set(key, (byKey.get(key) ?? 0) + d.total);
    });

    return names
      .map((name) => {
        const points: TrendPoint[] = months.map((m) => ({
          label: `${getMonthLabel(m.month)}/${String(m.year).slice(2)}`,
          value: byKey.get(`${name}|${m.year}|${m.month}`) ?? 0,
        }));
        const values = points.map((p) => p.value);
        const total = values.reduce((s, v) => s + v, 0);
        // Média só sobre meses com movimento: mês sem lançamento não é
        // "gastei zero", é ausência de dado.
        const activeMonths = values.filter((v) => v > 0);
        return {
          name,
          color: colorMap[name],
          points,
          total,
          max: Math.max(...values),
          average: activeMonths.length > 0 ? total / activeMonths.length : 0,
        };
      })
      .filter((s) => s.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [data, months, getMonthLabel]);

  if (series.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{t('trendCaption')}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {series.map((s) => (
            <div key={s.name} className="rounded-lg border p-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span
                  className="truncate text-sm font-medium"
                  style={{ color: s.color }}
                >
                  {s.name}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  max {formatCurrency(s.max)}
                </span>
              </div>
              <p className="mb-1 text-xs text-muted-foreground">
                {t('avgPrefix')} {formatCurrency(s.average)}
              </p>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={s.points}
                    margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
                  >
                    <XAxis dataKey="label" hide />
                    <YAxis hide domain={[0, Math.max(s.max, 1) * 1.05]} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p = payload[0].payload as TrendPoint;
                        return (
                          <div
                            className="rounded-md border px-2 py-1 text-xs"
                            style={{
                              backgroundColor: 'hsl(var(--background) / 0.95)',
                              borderColor: 'hsl(var(--border))',
                              color: 'hsl(var(--foreground))',
                            }}
                          >
                            <span className="font-medium">{p.label}</span>{' '}
                            {formatCurrency(p.value)}
                          </div>
                        );
                      }}
                    />
                    {s.average > 0 && (
                      <ReferenceLine
                        y={s.average}
                        stroke="hsl(var(--muted-foreground) / 0.6)"
                        strokeDasharray="4 3"
                        strokeWidth={1}
                      />
                    )}
                    <Bar dataKey="value" radius={[2, 2, 0, 0]} minPointSize={2}>
                      {s.points.map((p) => (
                        <Cell key={p.label} fill={s.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
