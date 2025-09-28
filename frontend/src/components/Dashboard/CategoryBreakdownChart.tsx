import React, { useEffect, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';

export interface CategoryDatum {
  name: string;
  value: number;
}

const COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#14b8a6',
  '#ec4899',
  '#0ea5e9',
];

interface CategoryBreakdownChartProps {
  data: CategoryDatum[];
  loading?: boolean;
}

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  data,
  loading,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [radius, setRadius] = useState(90);
  const [legendLayout, setLegendLayout] = useState<'horizontal' | 'vertical'>(
    'horizontal'
  );
  const [legendAlignRight, setLegendAlignRight] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    function recalc() {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      const usableH = h - 70;
      const base = Math.min(w, usableH);
      const r = Math.max(50, Math.floor(base / 2.8));
      setRadius(r);
      setShowLabels(data.length <= 6 && r >= 70);
      if (w > 560) {
        setLegendLayout('vertical');
        setLegendAlignRight(true);
      } else {
        setLegendLayout('horizontal');
        setLegendAlignRight(false);
      }
    }
    recalc();
    const obs = new ResizeObserver(recalc);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [data]);

  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');
  const sliceStroke = isDark ? 'rgba(96,165,250,0.6)' : 'rgba(59,130,246,0.6)';

  return (
    <div
      ref={containerRef}
      className="rounded-lg border border-blue-500/60 dark:border-blue-400/60 bg-blue-50/60 dark:bg-blue-500/10 backdrop-blur-sm p-4 h-[28rem] shadow-sm overflow-hidden flex flex-col"
    >
      <div className="font-medium mb-2 text-blue-800 dark:text-blue-200 shrink-0">
        Distribuição por Colaborador
      </div>
      {loading ? (
        <div className="animate-pulse text-sm text-zinc-500">Carregando...</div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                outerRadius={radius}
                stroke={sliceStroke}
                strokeWidth={1}
                label={
                  showLabels
                    ? ({
                        name,
                        percent,
                      }: {
                        name?: string;
                        percent?: number;
                      }) => {
                        const n = name || '';
                        const short = n.length > 14 ? n.slice(0, 12) + '…' : n;
                        return `${short} (${((percent || 0) * 100).toFixed(0)}%)`;
                      }
                    : false
                }
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) =>
                  value.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })
                }
              />
              <Legend
                layout={legendLayout}
                verticalAlign={
                  legendLayout === 'vertical' ? 'middle' : 'bottom'
                }
                align={legendAlignRight ? 'right' : 'center'}
                wrapperStyle={{
                  paddingTop: 4,
                  maxHeight: legendLayout === 'horizontal' ? 68 : '100%',
                  overflow: 'auto',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
