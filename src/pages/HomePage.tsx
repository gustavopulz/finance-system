// src/pages/HomePage.tsx
import { useEffect, useMemo, useState } from 'react';
import FinanceTable from '../components/FinanceTable';
import FinanceDialog from '../components/AddFinanceDialog';
import {
  loadFinances,
  saveFinances,
  isVisibleInMonth,
  willCountInMonth,
} from '../lib/storage';
import type { Finance } from '../lib/types';
import { brl, MONTHS_PT } from '../lib/format';
import { todayComp } from '../lib/date';
import { Plus, Filter } from 'lucide-react';

type DialogState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; finance: Finance };

export default function HomePage() {
  const [items, setItems] = useState<Finance[]>(() => loadFinances());
  const [dlg, setDlg] = useState<DialogState>({ mode: 'closed' });

  // Filtro por mês/ano
  const now = todayComp();
  const [month, setMonth] = useState<number>(now.month);
  const [year, setYear] = useState<number>(now.year);
  const currentComp = { month, year };

  useEffect(() => {
    saveFinances(items);
  }, [items]);

  // aplica visibilidade correta
  const visible = useMemo(
    () => items.filter((i) => isVisibleInMonth(i, currentComp)),
    [items, currentComp]
  );

  const group = (p: string) => visible.filter((i) => i.pessoa === p);
  const byAmanda = group('Amanda');
  const byGustavo = group('Gustavo');
  const byMae = group('CartaoMae');
  const byOutros = group('Outros');

  const totalGeral = visible
    .filter((f) => willCountInMonth(f, currentComp))
    .reduce((a, b) => a + b.valor, 0);

  function addOrUpdate(fin: Omit<Finance, 'id'> & { id?: string }) {
    setItems((prev) =>
      fin.id
        ? prev.map((p) => (p.id === fin.id ? { ...p, ...fin } : p))
        : [{ id: crypto.randomUUID(), ...fin }, ...prev]
    );
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id)); // exclui do histórico
  }

  // TOGGLE cancelado/ativo
  function cancelToggle(id: string) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const nextStatus = i.status === 'cancelado' ? 'ativo' : 'cancelado';
        return { ...i, status: nextStatus };
      })
    );
  }

  return (
    <div className="grid gap-6">
      <div className="card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-xl font-bold">Resumo</h1>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 text-slate-600">
              <Filter size={16} />
              Filtros:
            </span>
            <select
              className="select w-44"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS_PT.map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <input
              className="input w-28"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
            <button
              className="btn btn-primary"
              onClick={() => setDlg({ mode: 'add' })}
            >
              <Plus size={18} /> Adicionar finança
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <FinanceTable
          title="Contas Amanda"
          items={byAmanda}
          currentComp={currentComp}
          onDelete={remove}
          onEdit={(f) => setDlg({ mode: 'edit', finance: f })}
          onCancelToggle={cancelToggle}
        />
        <FinanceTable
          title="Contas Gustavo"
          items={byGustavo}
          currentComp={currentComp}
          onDelete={remove}
          onEdit={(f) => setDlg({ mode: 'edit', finance: f })}
          onCancelToggle={cancelToggle}
        />
        <FinanceTable
          title="Cartão Família"
          items={byMae}
          currentComp={currentComp}
          onDelete={remove}
          onEdit={(f) => setDlg({ mode: 'edit', finance: f })}
          onCancelToggle={cancelToggle}
        />
        <FinanceTable
          title="Outros"
          items={byOutros}
          currentComp={currentComp}
          onDelete={remove}
          onEdit={(f) => setDlg({ mode: 'edit', finance: f })}
          onCancelToggle={cancelToggle}
        />
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <strong>Total (filtrado)</strong>
          <span className="text-lg font-semibold">{brl(totalGeral)}</span>
        </div>
      </div>

      {dlg.mode !== 'closed' && (
        <FinanceDialog
          initial={dlg.mode === 'edit' ? dlg.finance : undefined}
          onSave={addOrUpdate}
          onClose={() => setDlg({ mode: 'closed' })}
        />
      )}
    </div>
  );
}
