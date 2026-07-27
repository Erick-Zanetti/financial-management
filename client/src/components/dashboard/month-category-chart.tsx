'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/providers/settings-provider';
import { useCategories } from '@/hooks/use-categories';
import { FinancialRelease } from '@/types/financial-release';
import { Category } from '@/types/category';

const EXPENSE_COLOR = '#ef4444';

interface MonthCategoryChartProps {
  expenses: FinancialRelease[];
}

interface CategoryRow {
  name: string;
  value: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function groupExpenses(
  expenses: FinancialRelease[],
  categoriesById: Map<string, Category>,
  detailed: boolean,
): CategoryRow[] {
  const totals = new Map<string, number>();
  const addTo = (name: string, value: number) => {
    totals.set(name, round2((totals.get(name) ?? 0) + value));
  };

  for (const release of expenses) {
    const ownName = release.category?.name ?? '—';
    const category = release.category
      ? categoriesById.get(release.category.id)
      : undefined;
    const splitEnabled =
      detailed &&
      category?.dashboardSplitBySubcategories === true &&
      category?.allowSubcategories === true;

    if (!splitEnabled) {
      addTo(ownName, release.value);
      continue;
    }

    const fallback = category?.dashboardFallbackCategory
      ? categoriesById.get(category.dashboardFallbackCategory)
      : undefined;
    const fallbackName = fallback?.name ?? ownName;

    const subs = release.subcategories ?? [];
    let subsSum = 0;
    for (const sub of subs) {
      subsSum = round2(subsSum + sub.value);
      addTo(sub.category?.name ?? fallbackName, sub.value);
    }
    const remainder = round2(release.value - subsSum);
    if (Math.abs(remainder) >= 0.01) {
      addTo(fallbackName, remainder);
    }
  }

  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function MonthCategoryChart({ expenses }: MonthCategoryChartProps) {
  const { t, formatCurrency } = useSettings();
  const { data: categories = [] } = useCategories();
  const [detailed, setDetailed] = useState(true);

  const rows = useMemo(() => {
    const categoriesById = new Map(categories.map((c) => [c.id, c]));
    return groupExpenses(expenses, categoriesById, detailed);
  }, [expenses, categories, detailed]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-medium">{t('monthCategoryTotals')}</CardTitle>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={detailed}
            onChange={(e) => setDetailed(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
          {t('detailedView')}
        </label>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t('noData')}
          </div>
        ) : (
          <div style={{ height: Math.max(250, rows.length * 28) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatCurrency(v)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload as CategoryRow;
                    return (
                      <div
                        className="rounded-lg border px-3 py-2 text-sm"
                        style={{
                          backgroundColor: 'hsl(var(--background) / 0.95)',
                          borderColor: 'hsl(var(--border))',
                          color: 'hsl(var(--foreground))',
                        }}
                      >
                        <p className="font-medium">{row.name}</p>
                        <span style={{ color: EXPENSE_COLOR }}>
                          {formatCurrency(row.value)}
                        </span>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" fill={EXPENSE_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
