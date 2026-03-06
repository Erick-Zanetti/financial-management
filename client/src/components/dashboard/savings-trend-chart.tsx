'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/providers/settings-provider';
import { SavingsPoint } from '@/lib/dashboard-utils';

interface SavingsTrendChartProps {
  data: SavingsPoint[];
}

export function SavingsTrendChart({ data }: SavingsTrendChartProps) {
  const { t, formatCurrency } = useSettings();

  const max = Math.max(...data.map(d => d.savings), 0);
  const min = Math.min(...data.map(d => d.savings), 0);
  const range = max - min || 1;
  const gradientOffset = max / range;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          {t('dashboardSavingsTrend')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={0} stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset={gradientOffset} stopColor="#10b981" stopOpacity={0.05} />
                  <stop offset={gradientOffset} stopColor="#ef4444" stopOpacity={0.05} />
                  <stop offset={1} stopColor="#ef4444" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatCurrency(v)} width={110} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const value = Number(payload[0].value);
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
                      <span style={{ color: value >= 0 ? '#10b981' : '#ef4444' }}>
                        {t('savings')}:
                      </span>{' '}
                      {formatCurrency(value)}
                    </div>
                  );
                }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="savings"
                stroke="#10b981"
                fill="url(#savingsGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
