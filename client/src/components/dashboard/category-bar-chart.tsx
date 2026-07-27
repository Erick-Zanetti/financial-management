'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/providers/settings-provider';
import { buildCategoryColorMap } from '@/lib/category-colors';

interface CategoryBarChartProps {
  chartData: Record<string, unknown>[];
  categories: string[];
  title: string;
  height?: number;
}

export function CategoryBarChart({ chartData, categories, title, height = 300 }: CategoryBarChartProps) {
  const { formatCurrency } = useSettings();
  const colorMap = buildCategoryColorMap(categories);

  if (categories.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatCurrency(v)} width={110} />
              <Tooltip
                wrapperStyle={{ pointerEvents: 'auto' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const nonZero = payload
                    .filter(p => Number(p.value) > 0)
                    .sort((a, b) => Number(b.value) - Number(a.value));
                  if (nonZero.length === 0) return null;
                  return (
                    <div
                      className="rounded-lg border px-3 py-2 text-sm overflow-y-auto"
                      style={{
                        maxHeight: Math.max(200, height - 80),
                        backgroundColor: 'hsl(var(--background) / 0.95)',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                      }}
                    >
                      <p className="font-medium mb-1">{label}</p>
                      {nonZero.map((entry) => {
                        const monthTotal = nonZero.reduce((s, p) => s + Number(p.value), 0);
                        const pct = monthTotal > 0 ? ((Number(entry.value) / monthTotal) * 100).toFixed(1) : '0';
                        return (
                          <div key={entry.dataKey as string} className="mb-0.5">
                            <span style={{ color: entry.color }}>{entry.name}:</span>{' '}
                            {formatCurrency(Number(entry.value))} ({pct}%)
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {categories.map((cat) => (
                <Bar
                  key={cat}
                  dataKey={cat}
                  name={cat}
                  fill={colorMap[cat]}
                  stackId="stack"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
