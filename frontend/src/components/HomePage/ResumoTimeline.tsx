import type { Account } from '../../lib/types';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

interface Props {
  accounts: Account[];
  className?: string;
}

type Group = {
  label: string; // Exibido no card (ex.: 01/08/2025)
  saidas: number;
  entradas: number;
  items: Account[];
};

function keyAndLabel(a: Account): { key: string; label: string } {
  // Tenta usar createdAt
  const d =
    a.createdAt && !isNaN(Date.parse(a.createdAt))
      ? new Date(a.createdAt)
      : null;

  if (d) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR'); // DD/MM/YYYY
    return { key, label };
  }

  // Fallback: usa mês/ano
  const key = `${String(a.year).padStart(4, '0')}-${String(a.month).padStart(2, '0')}-01`;
  const label = `01/${String(a.month).padStart(2, '0')}/${a.year}`;
  return { key, label };
}

export default function ResumoTimeline({ accounts, className = '' }: Props) {
  const map = new Map<string, Group>();

  for (const a of accounts) {
    const { key, label } = keyAndLabel(a);
    if (!map.has(key))
      map.set(key, { label, saidas: 0, entradas: 0, items: [] });
    const g = map.get(key)!;

    g.items.push(a);
    const v = Number(a.value) || 0;
    // Convenção: valores positivos = Saídas (despesas), valores negativos = entradas (receitas)
    if (v > 0) {
      g.saidas += v;
    } else if (v < 0) {
      g.entradas += Math.abs(v);
    }
  }

  const nodes = Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1));

  return (
    <div
      className={`border border-slate-200 dark:border-slate-700 rounded-lg p-6 bg-white dark:bg-slate-900 ${className}`}
    >
      <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
        Resumo
      </h2>

      <div className="space-y-8 relative">
        {nodes.map(([key, g], idx) => (
          <div key={key} className="relative pl-8">
            {/* Linha vertical */}
            {idx !== nodes.length - 1 && (
              <span className="absolute left-3 top-6 w-0.5 h-[calc(100%-0.75rem)] bg-slate-700/40" />
            )}

            <div className="pt-4 absolute left-0 -top-6 font-semibold text-slate-900 dark:text-slate-100">
              {g.label}
            </div>

            {/* Entradas (exibidas acima das Saídas) */}
            <div className="flex pt-6 items-center gap-2 mt-4">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md ${
                  g.entradas === 0 ? 'bg-blue-600' : 'bg-green-600'
                }`}
              >
                <ArrowUpRight size={16} />
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                Entradas:
              </span>
              <b className="text-slate-900 dark:text-slate-100">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(g.entradas)}
              </b>
            </div>

            {/* Saídas */}
            <div className="flex items-center gap-2 mt-2">
              <span className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                <ArrowRight size={16} />
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                Saídas:
              </span>
              <b className="text-slate-900 dark:text-slate-100">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(Math.abs(g.saidas))}
              </b>
            </div>

            {/* Itens: renderiza todos os itens */}
            <div className="mt-3 text-sm space-y-2">
              {g.items.map((it) => (
                <div
                  key={it.id}
                  className="flex justify-between text-slate-700 dark:text-slate-300"
                >
                  <span className="truncate pr-4">{it.description}</span>
                  <span className="tabular-nums">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(Number(it.value))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
