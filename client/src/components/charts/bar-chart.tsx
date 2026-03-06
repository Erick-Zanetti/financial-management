'use client';

import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/providers/settings-provider';
import { FinancialRelease } from '@/types/financial-release';

interface StackedBarChartProps {
  receipts: FinancialRelease[];
  expenses: FinancialRelease[];
}

export function CumulativeLineChart({ receipts, expenses }: StackedBarChartProps) {
  const { t, formatCurrency } = useSettings();

  const totalReceipts = receipts.reduce((sum, r) => sum + r.value, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.value, 0);
  const total = totalReceipts + totalExpenses;

  if (total === 0) {
    return null;
  }

  const receiptsPct = Math.round((totalReceipts / total) * 100);
  const expensesPct = 100 - receiptsPct;

  const data = [
    {
      name: t('receiptsVsExpenses'),
      receipts: receiptsPct,
      expenses: expensesPct,
      receiptsValue: totalReceipts,
      expensesValue: totalExpenses,
    },
  ];

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
        <div className="h-[60px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  if (!d) return null;
                  return (
                    <div
                      className="rounded-md border px-3 py-2 text-sm"
                      style={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                      }}
                    >
                      <div className="mb-1">
                        <span style={{ color: '#4caf50' }}>{receiptsLabel}:</span>{' '}
                        {formatCurrency(d.receiptsValue)} ({d.receipts}%)
                      </div>
                      <div>
                        <span style={{ color: '#f44336' }}>{expensesLabel}:</span>{' '}
                        {formatCurrency(d.expensesValue)} ({d.expenses}%)
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                formatter={(value) => {
                  const d = data[0];
                  if (value === receiptsLabel) return `${receiptsLabel} (${d.receipts}%)`;
                  return `${expensesLabel} (${d.expenses}%)`;
                }}
              />
              <Bar
                name={receiptsLabel}
                dataKey="receipts"
                stackId="a"
                fill="#4caf50"
                radius={[4, 0, 0, 4]}
                barSize={28}
              />
              <Bar
                name={expensesLabel}
                dataKey="expenses"
                stackId="a"
                fill="#f44336"
                radius={[0, 4, 4, 0]}
                barSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
