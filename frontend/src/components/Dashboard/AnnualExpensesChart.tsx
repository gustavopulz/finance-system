import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Rectangle } from 'recharts';

export interface AnnualStackPoint {
  month: string; // '01', '02', ... '12'
  total: number;
  // dynamic collaborator keys with values
  [collaboratorKey: string]: any;
}

interface AnnualExpensesChartProps {
  data: AnnualStackPoint[];
  collaborators: { id: string; name: string }[];
  loading?: boolean;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899', '#0ea5e9', '#6366f1AA', '#10b981AA'];

export const AnnualExpensesChart: React.FC<AnnualExpensesChartProps> = ({ data, collaborators, loading }) => {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const axisTickColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(30,41,59,0.85)';
  const axisStrokeColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(30,41,59,0.25)';

  // Pre-compute annual totals per collaborator and derive ordering (largest first => bottom of stack)
  const orderedCollaborators = useMemo(() => {
    if (!data || data.length === 0) return collaborators;
    const totals: Record<string, number> = {};
    collaborators.forEach(c => { totals[c.id] = 0; });
    data.forEach(point => {
      collaborators.forEach(c => {
        const v = Number(point[c.id] || 0);
        if (!isNaN(v)) totals[c.id] += v;
      });
    });
    return [...collaborators].sort((a,b) => (totals[b.id] || 0) - (totals[a.id] || 0));
  }, [data, collaborators]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    // Sort by value desc for readability
    const sorted = [...payload].sort((a,b) => (Number(b.value)||0) - (Number(a.value)||0));
    const monthTotal = sorted.reduce((acc, p) => acc + (Number(p.value)||0), 0) || 1; // avoid div by zero
    const monthLabel = label;
    return (
      <div className={
        'rounded-md shadow-lg px-4 py-3 text-xs border ' +
        (isDark
          ? 'bg-slate-900/90 border-slate-700 text-slate-200 backdrop-blur'
          : 'bg-white/95 border-slate-200 text-slate-800')
      }>
        <div className="font-semibold text-[11px] mb-1 opacity-80">{monthLabel}</div>
        <ul className="space-y-0.5">
          {sorted.map((p: any, idx: number) => {
            const val = Number(p.value || 0);
            const pct = (val / monthTotal) * 100;
            return (
              <li key={idx} className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-sm"
                  style={{ background: p.color }}
                />
                <span className="truncate max-w-[8rem]">{p.name}</span>
                <span className="ml-auto font-medium tabular-nums">
                  {val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  <span className="ml-1 opacity-70">({pct.toFixed(pct < 10 ? 1 : 0)}%)</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const CustomCursor = (props: any) => {
    const { x, y, width, height } = props;
    return (
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
        radius={2}
      />
    );
  };

  return (
  <div className="rounded-lg border border-blue-500/60 dark:border-blue-400/60 bg-blue-50/60 dark:bg-blue-500/10 backdrop-blur-sm p-4 h-[28rem] shadow-sm flex flex-col">
      <div className="font-medium mb-2 text-blue-800 dark:text-blue-200">Despesas por Mês (Empilhado por Colaborador)</div>
      {loading ? (
        <div className="animate-pulse text-sm text-zinc-500">Carregando...</div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} stackOffset="none">
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: axisTickColor }}
                stroke={axisStrokeColor}
              />
              <YAxis
                tickFormatter={(v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace('R$','')}
                width={70}
                tick={{ fontSize: 11, fill: axisTickColor }}
                stroke={axisStrokeColor}
              />
              <Tooltip content={<CustomTooltip />} cursor={<CustomCursor />} />
              <Legend wrapperStyle={{ paddingTop: 4 }} />
              {orderedCollaborators.map((c, idx) => (
                <Bar key={c.id} dataKey={c.id} stackId="a" fill={COLORS[idx % COLORS.length]} name={c.name} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
