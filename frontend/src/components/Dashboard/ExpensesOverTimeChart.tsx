import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export interface ExpensesOverTimePoint {
  date: string; // YYYY-MM-DD
  total: number;
}

interface ExpensesOverTimeChartProps {
  data: ExpensesOverTimePoint[];
  loading?: boolean;
}

export const ExpensesOverTimeChart: React.FC<ExpensesOverTimeChartProps> = ({ data, loading }) => {
  return (
    <div className="rounded-lg border border-blue-500/60 dark:border-blue-400/60 bg-blue-50/60 dark:bg-blue-500/10 backdrop-blur-sm p-4 h-80 shadow-sm">
      <div className="font-medium mb-2 text-blue-800 dark:text-blue-200">Gasto diário (últimos 30 dias)</div>
      {loading ? (
        <div className="animate-pulse text-sm text-zinc-500">Carregando...</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#555" opacity={0.2} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} hide={data.length > 25} />
            <YAxis tickFormatter={(v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace('R$','')} width={70} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value: any) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} labelFormatter={(l: string) => l} />
            <Area type="monotone" dataKey="total" stroke="#6366f1" fillOpacity={1} fill="url(#colorTotal)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
