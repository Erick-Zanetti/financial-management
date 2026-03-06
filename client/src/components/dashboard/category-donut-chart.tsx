'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/providers/settings-provider';
import { CategorySlice } from '@/lib/dashboard-utils';

const COLORS = [
  '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b',
  '#ec4899', '#14b8a6', '#6366f1', '#f97316',
  '#22d3ee', '#a855f7', '#84cc16', '#e879f9',
  '#2dd4bf', '#fb923c', '#818cf8', '#34d399',
];

interface CategoryDonutChartProps {
  incomeData: CategorySlice[];
  expenseData: CategorySlice[];
}

function DonutHalf({ data, title }: { data: CategorySlice[]; title: string }) {
  const { formatCurrency } = useSettings();

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground text-sm">
        <p className="font-medium mb-2">{title}</p>
        <p>---</p>
      </div>
    );
  }

  return (
    <div className="h-[250px]">
      <p className="text-sm font-medium text-center text-muted-foreground mb-1">{title}</p>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const entry = payload[0];
              const total = data.reduce((s, d) => s + d.value, 0);
              const pct = total > 0 ? ((Number(entry.value) / total) * 100).toFixed(1) : '0';
              return (
                <div
                  className="rounded-lg border px-3 py-2 text-sm backdrop-blur-lg"
                  style={{
                    backgroundColor: 'hsl(var(--background) / 0.95)',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  <p className="font-medium">{entry.name}</p>
                  <p>{formatCurrency(Number(entry.value))} ({pct}%)</p>
                </div>
              );
            }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryDonutChart({ incomeData, expenseData }: CategoryDonutChartProps) {
  const { t } = useSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          {t('dashboardCategoryDistribution')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DonutHalf data={incomeData} title={t('dashboardIncomeDistribution')} />
          <DonutHalf data={expenseData} title={t('dashboardExpenseDistribution')} />
        </div>
      </CardContent>
    </Card>
  );
}
