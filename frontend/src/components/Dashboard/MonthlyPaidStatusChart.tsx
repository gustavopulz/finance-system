import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Rectangle,
} from 'recharts';

export interface MonthlyPaidStatusPoint {
  month: string;
  paid: number;
  pending: number;
  total: number;
}

interface MonthlyPaidStatusChartProps {
  data: MonthlyPaidStatusPoint[];
  loading?: boolean;
}

const COLORS = { paid: '#10b981', pending: '#f59e0b' };

export const MonthlyPaidStatusChart: React.FC<MonthlyPaidStatusChartProps> = ({
  data,
  loading,
}) => {
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');
  const axisTickColor = isDark
    ? 'rgba(255,255,255,0.85)'
    : 'rgba(30,41,59,0.85)';
  const axisStrokeColor = isDark
    ? 'rgba(255,255,255,0.25)'
    : 'rgba(30,41,59,0.25)';

  const percentData = data.map((d) => {
    const total = d.total || 1;
    return {
      month: d.month,
      paidPct: (d.paid / total) * 100,
      pendingPct: (d.pending / total) * 100,
      paidValue: d.paid,
      pendingValue: d.pending,
      total: d.total,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const paid = payload.find((p: any) => p.dataKey === 'paidPct');
    const pending = payload.find((p: any) => p.dataKey === 'pendingPct');
    return (
      <div
        className={
          'rounded-md shadow-lg px-4 py-3 text-xs border ' +
          (isDark
            ? 'bg-slate-900/90 border-slate-700 text-slate-200 backdrop-blur'
            : 'bg-white/95 border-slate-200 text-slate-800')
        }
      >
        <div className="font-semibold text-[11px] mb-1 opacity-80">
          Mês {label}
        </div>
        <ul className="space-y-0.5">
          <li className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-sm"
              style={{ background: COLORS.paid }}
            />
            <span>Pago</span>
            <span className="ml-auto font-medium tabular-nums">
              {(paid?.value || 0).toFixed(0)}%{' '}
              <span className="opacity-60">
                (
                {(paid?.payload?.paidValue || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
                )
              </span>
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-sm"
              style={{ background: COLORS.pending }}
            />
            <span>Pendente</span>
            <span className="ml-auto font-medium tabular-nums">
              {(pending?.value || 0).toFixed(0)}%{' '}
              <span className="opacity-60">
                (
                {(pending?.payload?.pendingValue || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
                )
              </span>
            </span>
          </li>
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
    <div className="rounded-lg border border-blue-500/60 dark:border-blue-400/60 bg-blue-50/60 dark:bg-blue-500/10 backdrop-blur-sm p-4 h-[24rem] shadow-sm flex flex-col">
      <div className="font-medium mb-2 text-blue-800 dark:text-blue-200">
        % Pago vs Pendente por Mês
      </div>
      {loading ? (
        <div className="animate-pulse text-sm text-zinc-500">Carregando...</div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={percentData} stackOffset="expand">
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: axisTickColor }}
                stroke={axisStrokeColor}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={<CustomCursor />} />
              <Bar
                dataKey="paidPct"
                stackId="a"
                fill={COLORS.paid}
                name="Pago"
              />
              <Bar
                dataKey="pendingPct"
                stackId="a"
                fill={COLORS.pending}
                name="Pendente"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
