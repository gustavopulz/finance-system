// src/components/FinanceTable.tsx
import { parcelaLabel, brl } from '../lib/format';
import type { Finance } from '../lib/types';
import { Pencil, Trash2, Ban } from 'lucide-react';
import { willCountInMonth } from '../lib/storage';

type Props = {
  title: string;
  items: Finance[];
  currentComp: { year: number; month: number };
  onDelete: (id: string) => void;
  onEdit: (f: Finance) => void;
  onCancelToggle: (id: string) => void; // toggle cancelado/ativo
};

export default function FinanceTable({
  title,
  items,
  currentComp,
  onDelete,
  onEdit,
  onCancelToggle,
}: Props) {
  const total = items
    .filter((f) => willCountInMonth(f, currentComp))
    .reduce((acc, f) => acc + f.valor, 0);

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="badge">Total: {brl(total)}</div>
      </div>

      <div className="overflow-x-auto mt-3">
        <table className="table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th className="w-28">Valor</th>
              <th className="w-28">Parcela</th>
              <th className="w-24">Status</th>
              <th className="w-36"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((f, idx) => (
              <tr
                key={f.id}
                className={
                  'align-middle ' +
                  (idx % 2 === 0
                    ? 'bg-slate-50 dark:bg-slate-900/40'
                    : 'bg-white dark:bg-slate-800/40')
                }
              >
                <td className="font-medium px-3 py-3">{f.descricao}</td>
                <td className="px-3 py-3">{brl(f.valor)}</td>
                <td className="px-3 py-3">{parcelaLabel(f, currentComp)}</td>
                <td className="px-3 py-3">
                  <span
                    className={
                      'px-2 py-1 rounded-full text-xs font-semibold ' +
                      (f.status === 'ativo'
                        ? 'bg-green-100 text-green-700 dark:bg-green-500/30 dark:text-green-300'
                        : f.status === 'cancelado'
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/30 dark:text-red-300'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300')
                    }
                  >
                    {f.status ?? 'ativo'}
                  </span>
                </td>

                <td className="flex gap-1 px-3 py-3">
                  <button
                    className="btn btn-ghost"
                    title="Editar"
                    onClick={() => onEdit(f)}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    className="btn btn-ghost"
                    title={
                      f.status === 'cancelado'
                        ? 'Ativar novamente'
                        : 'Cancelar (não soma)'
                    }
                    onClick={() => onCancelToggle(f.id)}
                  >
                    <Ban size={18} />
                  </button>
                  <button
                    className="btn btn-ghost"
                    title="Excluir (remove do histórico)"
                    onClick={() => onDelete(f.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">
                  Sem lançamentos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
