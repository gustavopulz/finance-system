import React from 'react';
import { Filter, Plus, UserPlus } from 'lucide-react';
// no types required here

interface SummaryProps {
  total: number;
  totalPendente: number;
  totalPago: number;
  showCancelled: boolean;
  setShowCancelled: (v: boolean) => void;
  setDlg: (dlg: any) => void;
  setMonth: (month: number) => void;
  setShowAll: (showAll: boolean) => void;
  showAll: boolean;
  month: number;
  year: number;
  setYear: (year: number) => void;
  filterDesc: string;
  setFilterDesc: (desc: string) => void;
  filterValor: string;
  setFilterValor: (valor: string) => void;
  filterParcela: string;
  setFilterParcela: (parcela: string) => void;
  MONTHS_PT: string[];
  activeView?: 'resumo' | 'entradas' | 'saidas';
}

const Summary: React.FC<SummaryProps> = ({
  total,
  totalPendente,
  totalPago,
  showCancelled,
  setShowCancelled,
  setDlg,
  setMonth,
  setShowAll,
  showAll,
  month,
  year,
  setYear,
  filterDesc,
  setFilterDesc,
  filterValor,
  setFilterValor,
  filterParcela,
  setFilterParcela,
  MONTHS_PT,
  activeView = 'saidas',
}) => {
  // (Resumo tree is rendered by the parent `HomePage`; keep this card for filters/totals only.)
  return (
    <div className="border border-slate-300 dark:border-slate-700 shadow-sm rounded-lg bg-white dark:bg-slate-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-medium flex items-center gap-2">
          <Filter size={18} className="text-slate-500" />
          {activeView === 'resumo'
            ? 'Resumo'
            : activeView === 'entradas'
              ? 'Entradas'
              : 'Saídas'}
        </h1>

        {/* Desktop actions */}
        <div className="hidden md:flex gap-2 items-center">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <input
              type="checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
              className="register-checkbox"
            />
            Ver Cancelados
          </label>
          <button
            className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 text-white px-4 py-2 rounded-md transition"
            onClick={() => setDlg({ mode: 'addCollab' })}
          >
            <UserPlus size={18} /> Adicionar Grupo
          </button>
          <button
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
            onClick={() =>
              setDlg({
                mode: 'addAccount',
                tipo: activeView === 'entradas' ? 'entrada' : 'saida',
              })
            }
            title={
              activeView === 'entradas'
                ? 'Adicionar entrada (Alt+N)'
                : 'Adicionar saída (Alt+N)'
            }
          >
            <Plus size={18} />
            <span>
              {activeView === 'entradas'
                ? 'Adicionar entrada'
                : 'Adicionar saída'}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs are rendered by the parent; this card only shows the current selected content */}

      {/* Mobile actions */}
      <div className="flex flex-col gap-2 md:hidden mb-4">
        <button
          className="border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 bg-transparent hover:bg-slate-700 text-white px-4 py-2 rounded-md transition"
          onClick={() => setDlg({ mode: 'addCollab' })}
        >
          <UserPlus size={18} /> Adicionar Grupo
        </button>
        <button
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
          onClick={() =>
            setDlg({
              mode: 'addAccount',
              tipo: activeView === 'entradas' ? 'entrada' : 'saida',
            })
          }
          title={
            activeView === 'entradas'
              ? 'Adicionar entrada (Alt+N)'
              : 'Adicionar saída (Alt+N)'
          }
        >
          <Plus size={18} />
          <span>
            {activeView === 'entradas'
              ? 'Adicionar entrada'
              : 'Adicionar saída'}
          </span>
        </button>
      </div>

      {/* Filters Desktop */}
      <div className="hidden md:flex flex-wrap gap-2 mb-4">
        <input
          className="input flex-1 min-w-[140px]"
          type="text"
          placeholder="Descrição"
          value={filterDesc}
          onChange={(e) => setFilterDesc(e.target.value)}
        />
        <input
          className="input flex-1 min-w-[100px]"
          type="number"
          placeholder="Valor"
          value={filterValor}
          onChange={(e) => setFilterValor(e.target.value)}
        />
        <select
          className="select rounded flex-1 min-w-[120px]"
          value={filterParcela}
          onChange={(e) => setFilterParcela(e.target.value)}
        >
          <option value="">Todas parcelas</option>
          <option value="avulso">Avulso</option>
          <option value="fixo">Fixo</option>
          {[...Array(48)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
        <select className="select rounded flex-1 min-w-[120px]" disabled>
          <option value="">Categoria (em breve)</option>
        </select>
        <select
          className="select rounded flex-1 min-w-[120px]"
          value={showAll ? 'all' : month}
          onChange={(e) => {
            if (e.target.value === 'all') {
              setShowAll(true);
            } else {
              setShowAll(false);
              setMonth(Number(e.target.value));
            }
          }}
        >
          <option value="all">Todos os meses</option>
          {MONTHS_PT.map((m, i) => (
            <option key={i + 1} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <input
          className="input flex-1 min-w-[80px]"
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          disabled={showAll}
          placeholder="Ano"
        />
      </div>

      {/* Filters Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 md:hidden">
        <input
          className="input w-full"
          type="text"
          placeholder="Descrição"
          value={filterDesc}
          onChange={(e) => setFilterDesc(e.target.value)}
        />
        <input
          className="input w-full"
          type="number"
          placeholder="Valor"
          value={filterValor}
          onChange={(e) => setFilterValor(e.target.value)}
        />
        <select
          className="select rounded w-full"
          value={filterParcela}
          onChange={(e) => setFilterParcela(e.target.value)}
        >
          <option value="">Todas parcelas</option>
          <option value="avulso">Avulso</option>
          <option value="fixo">Fixo</option>
          {[...Array(48)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
        <select className="select rounded w-full" disabled>
          <option value="">Categoria (em breve)</option>
        </select>
        <select
          className="select rounded w-full"
          value={showAll ? 'all' : month}
          onChange={(e) => {
            if (e.target.value === 'all') {
              setShowAll(true);
            } else {
              setShowAll(false);
              setMonth(Number(e.target.value));
            }
          }}
        >
          <option value="all">Todos os meses</option>
          {MONTHS_PT.map((m, i) => (
            <option key={i + 1} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <input
          className="input w-full"
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          disabled={showAll}
          placeholder="Ano"
        />
      </div>

      {/* Mobile: checkbox no final */}
      <div className="md:hidden mb-4">
        <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={showCancelled}
            onChange={(e) => setShowCancelled(e.target.checked)}
            className="register-checkbox"
          />
          Ver Cancelados
        </label>
      </div>

      {/* Totals (mobile only) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 md:hidden">
        <div className="p-3 rounded bg-slate-100 dark:bg-slate-800 text-center">
          <span className="block text-xs uppercase text-slate-500">Total</span>
          <span className="text-lg font-medium text-slate-800 dark:text-slate-200">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(total)}
          </span>
        </div>
        <div className="p-3 rounded bg-yellow-100 dark:bg-yellow-500/20 text-center">
          <span className="block text-xs uppercase text-yellow-700">
            Pendente
          </span>
          <span className="text-lg font-medium text-yellow-700 dark:text-yellow-300">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(totalPendente)}
          </span>
        </div>
        <div className="p-3 rounded bg-green-100 dark:bg-green-500/20 text-center">
          <span className="block text-xs uppercase text-green-700">Pago</span>
          <span className="text-lg font-medium text-green-700 dark:text-green-300">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(totalPago)}
          </span>
        </div>
      </div>

      {/* Resumo tree moved to parent (`HomePage`). This card keeps filters/totals only. */}
    </div>
  );
};

export default Summary;
