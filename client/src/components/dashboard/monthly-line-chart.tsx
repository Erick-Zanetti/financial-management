'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/providers/settings-provider';
import { MonthlyTotal } from '@/lib/dashboard-utils';

interface MonthlyLineChartProps {
  data: MonthlyTotal[];
}

export function MonthlyLineChart({ data }: MonthlyLineChartProps) {
  const { t, formatCurrency } = useSettings();

  const receiptsLabel = t('receipts');
  const expensesLabel = t('expenses');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          {t('receiptsVsExpenses')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatCurrency(v)} width={110} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div
                      className="rounded-lg border px-3 py-2 text-sm backdrop-blur-lg"
                      style={{
                        backgroundColor: 'hsl(var(--background) / 0.95)',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                      }}
                    >
                      <p className="font-medium mb-1">{label}</p>
                      {payload.map((entry) => (
                        <div key={entry.dataKey as string} className="mb-0.5">
                          <span style={{ color: entry.color }}>
                            {entry.dataKey === 'income' ? receiptsLabel : expensesLabel}:
                          </span>{' '}
                          {formatCurrency(Number(entry.value))}
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend />
              <Line
                name={receiptsLabel}
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                name={expensesLabel}
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
