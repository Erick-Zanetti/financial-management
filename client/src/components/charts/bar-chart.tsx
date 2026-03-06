'use client';

import { useMemo } from 'react';
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
import { FinancialRelease } from '@/types/financial-release';

interface CumulativeLineChartProps {
  receipts: FinancialRelease[];
  expenses: FinancialRelease[];
}

interface DayData {
  day: number;
  receipts: number;
  expenses: number;
  receiptsLabel: string;
  expensesLabel: string;
}

export function CumulativeLineChart({ receipts, expenses }: CumulativeLineChartProps) {
  const { t, formatCurrency } = useSettings();

  const data = useMemo(() => {
    const receiptsByDay: Record<number, { total: number; names: string[] }> = {};
    const expensesByDay: Record<number, { total: number; names: string[] }> = {};

    for (const r of receipts) {
      if (!receiptsByDay[r.day]) receiptsByDay[r.day] = { total: 0, names: [] };
      receiptsByDay[r.day].total += r.value;
      receiptsByDay[r.day].names.push(r.name);
    }

    for (const e of expenses) {
      if (!expensesByDay[e.day]) expensesByDay[e.day] = { total: 0, names: [] };
      expensesByDay[e.day].total += e.value;
      expensesByDay[e.day].names.push(e.name);
    }

    const allDays = new Set<number>();
    Object.keys(receiptsByDay).forEach((d) => allDays.add(Number(d)));
    Object.keys(expensesByDay).forEach((d) => allDays.add(Number(d)));

    const sortedDays = Array.from(allDays).sort((a, b) => a - b);

    let cumReceipts = 0;
    let cumExpenses = 0;
    const result: DayData[] = [];

    for (const day of sortedDays) {
      const rDay = receiptsByDay[day];
      const eDay = expensesByDay[day];

      if (rDay) cumReceipts += rDay.total;
      if (eDay) cumExpenses += eDay.total;

      result.push({
        day,
        receipts: cumReceipts,
        expenses: cumExpenses,
        receiptsLabel: rDay ? rDay.names.join(', ') : '',
        expensesLabel: eDay ? eDay.names.join(', ') : '',
      });
    }

    return result;
  }, [receipts, expenses]);

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
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <XAxis
                dataKey="day"
                tickFormatter={(v) => `${v}`}
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v)}
                width={80}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div
                      className="rounded-md border px-3 py-2 text-sm"
                      style={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                      }}
                    >
                      <p className="font-medium mb-1">{t('day')} {label}</p>
                      {payload.map((entry) => {
                        const isReceipt = entry.dataKey === 'receipts';
                        const labelKey = isReceipt ? 'receiptsLabel' : 'expensesLabel';
                        const names = entry.payload[labelKey];
                        return (
                          <div key={entry.dataKey as string} className="mb-1">
                            <span style={{ color: entry.color }}>
                              {isReceipt ? receiptsLabel : expensesLabel}:
                            </span>{' '}
                            {formatCurrency(Number(entry.value))}
                            {names && (
                              <p className="text-xs text-muted-foreground ml-2">
                                {names}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
              <Legend />
              <Line
                name={receiptsLabel}
                type="monotone"
                dataKey="receipts"
                stroke="#4caf50"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                name={expensesLabel}
                type="monotone"
                dataKey="expenses"
                stroke="#f44336"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
