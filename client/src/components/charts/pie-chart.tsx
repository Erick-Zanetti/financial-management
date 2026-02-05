'use client';

import { useMemo } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { FinancialRelease } from '@/types/financial-release';
import { formatCurrency } from '@/lib/format';

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
  const chartData = useMemo(() => {
    return data.map((item) => ({
      name: item.name,
      value: item.value,
    }));
  }, [data]);

  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend
                layout="vertical"
                align="left"
                verticalAlign="middle"
                formatter={(value) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
