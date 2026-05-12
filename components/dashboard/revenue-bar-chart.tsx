'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MonthlyRevenuePoint } from '@/types';
import { formatCurrency } from '@/lib/utils';

export function RevenueBarChart({ data }: { data: MonthlyRevenuePoint[] }) {
  return (
    <div className="space-y-2">
      <div className="h-80 w-full" role="img" aria-label="Monthly revenue bar chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `₹${Number(value) / 1000}k`}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="sr-only">
        {data.map((point) => (
          <li key={point.month}>
            {point.month}: {formatCurrency(point.amount)}
          </li>
        ))}
      </ul>
    </div>
  );
}
