'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import { FinancialRelease } from '@/types/financial-release';
import { useSettings } from '@/providers/settings-provider';

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

  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.value - a.value)
      .map((item) => ({
        name: item.name,
        value: item.value,
      }));
  }, [data]);

  if (data.length === 0) {
    return null;
  }

  const barHeight = 32;
  const chartHeight = Math.max(120, chartData.length * barHeight + 20);

  return (
    <div className="pt-4" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            cursor={{ fill: 'hsl(var(--muted))' }}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            barSize={20}
            label={{
              position: 'right',
              formatter: (value: unknown) => formatCurrency(Number(value)),
              style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' },
            }}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
