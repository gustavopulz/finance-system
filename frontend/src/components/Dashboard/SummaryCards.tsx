import React from 'react';

interface SummaryCardsProps {
  monthTotal: number; // Total do mês filtrado (após filtro de colaboradores)
  pending: number;    // Pendentes mês filtrado
  paid: number;       // Pagos mês filtrado
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ monthTotal, pending, paid }) => {
  const pct = monthTotal > 0 ? (paid / monthTotal) * 100 : 0;
  const cards = [
    { label: 'Total', value: formatCurrency(monthTotal), accent: '💰' },
    { label: 'Total Pendente', value: formatCurrency(pending), accent: '⏳' },
    { label: 'Total Pago', value: `${formatCurrency(paid)} (${pct.toFixed(1)}%)`, accent: '✅' },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
      {cards.map(c => (
        <div
          key={c.label}
          className="group relative overflow-hidden rounded-lg border border-blue-500/50 dark:border-blue-400/40 bg-gradient-to-br from-blue-50/80 via-blue-100/40 to-blue-200/20 dark:from-blue-500/20 dark:via-blue-500/10 dark:to-blue-400/5 backdrop-blur p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[120px]"
        >
          <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(59,130,246,0.25), transparent 60%)' }} />
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11px] font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300/90">
              {c.label}
            </div>
            <div className="text-base opacity-60 select-none">
              {c.accent}
            </div>
          </div>
          <div className="text-lg font-semibold text-blue-900 dark:text-blue-50 flex items-baseline gap-2">
            {c.value}
          </div>
          <div className="mt-3 h-1.5 w-full rounded bg-blue-200/40 dark:bg-blue-400/20 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500/70 via-blue-400/70 to-blue-300/60 group-hover:from-blue-600 group-hover:via-blue-500 group-hover:to-blue-400 transition-all" style={{ width: '100%' }} />
          </div>
        </div>
      ))}
    </div>
  );
};
