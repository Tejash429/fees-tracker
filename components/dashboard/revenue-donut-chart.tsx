'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DonutPoint } from '@/types';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function RevenueDonutChart({ data }: { data: DonutPoint[] }) {
  return (
    <div className="space-y-3">
      <div className="h-72 w-full" role="img" aria-label="Revenue split donut chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={64} outerRadius={100} paddingAngle={4}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="space-y-1 text-sm">
        {data.map((point, index) => (
          <li key={point.name} className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-2 py-1.5">
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span>{point.name}</span>
            </span>
            <span className="font-medium tabular-nums">{formatCurrency(point.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
