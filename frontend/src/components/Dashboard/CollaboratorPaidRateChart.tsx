import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Rectangle,
  LabelList,
} from 'recharts';

export interface CollaboratorPaidRatePoint {
  collaboratorId: string;
  name: string;
  paid: number;
  pending: number;
  total: number;
  paidPct: number;
}

interface CollaboratorPaidRateChartProps {
  data: CollaboratorPaidRatePoint[];
  loading?: boolean;
}

const COLORS = { bar: '#6366f1' };

export const CollaboratorPaidRateChart: React.FC<
  CollaboratorPaidRateChartProps
> = ({ data, loading }) => {
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');
  const axisTickColor = isDark
    ? 'rgba(255,255,255,0.85)'
    : 'rgba(30,41,59,0.85)';
  const axisStrokeColor = isDark
    ? 'rgba(255,255,255,0.25)'
    : 'rgba(30,41,59,0.25)';

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.paidPct - a.paidPct || b.total - a.total),
    [data]
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0];
    const d = p?.payload;
    if (!d) return null;
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
          {d.name}
        </div>
        <ul className="space-y-0.5">
          <li className="flex items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400">Pago</span>
            <span className="ml-auto font-medium tabular-nums">
              {d.paid.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400">Pendente</span>
            <span className="ml-auto font-medium tabular-nums">
              {d.pending.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400">Total</span>
            <span className="ml-auto font-medium tabular-nums">
              {d.total.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400">% Pago</span>
            <span className="ml-auto font-medium tabular-nums">
              {d.paidPct.toFixed(d.paidPct < 10 ? 1 : 0)}%
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
        % Pago por Colaborador
      </div>
      {loading ? (
        <div className="animate-pulse text-sm text-zinc-500">Carregando...</div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sorted}
              layout="vertical"
              margin={{ left: 60, right: 16, top: 8, bottom: 8 }}
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={60}
                tick={{ fontSize: 11, fill: axisTickColor }}
                stroke={axisStrokeColor}
              />
              <Tooltip content={<CustomTooltip />} cursor={<CustomCursor />} />
              <Bar dataKey="paidPct" fill={COLORS.bar} radius={4} name="% Pago">
                <LabelList
                  dataKey="paidPct"
                  position="right"
                  formatter={(v: number) => `${v.toFixed(v < 10 ? 1 : 0)}%`}
                  className="text-[10px] fill-current"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
