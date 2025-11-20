import React, { useState } from "react";
import { Plus, UserPlus, X, BarChart2, SlidersHorizontal } from "lucide-react";

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
  filterStatus: string;
  setFilterStatus: (status: string) => void;
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
  filterStatus,
  setFilterStatus,
}) => {
  const [showFilterModal, setShowFilterModal] = useState(false);

  return (
    <div className="border border-slate-300 dark:border-slate-700 shadow-sm rounded-lg bg-white dark:bg-slate-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <BarChart2 size={18} className="text-slate-500" /> Resumo
        </h1>
        <div className="flex gap-2 flex-wrap">
          <button
            className="flex items-center gap-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-md transition"
            onClick={() => setShowFilterModal(true)}
            title="Filtros"
          >
            <SlidersHorizontal size={18} />{" "}
            <span className="hidden sm:inline">Filtros</span>
          </button>

          <button
            className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 hover:text-white text-slate-700 dark:text-slate-200 px-4 py-2 rounded-md transition"
            onClick={() => setDlg({ mode: "addCollab" })}
          >
            <UserPlus size={18} />{" "}
            <span className="hidden sm:inline">Adicionar colaborador</span>
          </button>
          <button
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
            onClick={() => setDlg({ mode: "addAccount" })}
            title="Adicionar finança (Alt+N)"
          >
            <Plus size={18} />{" "}
            <span className="hidden sm:inline">Adicionar finança</span>
          </button>
        </div>
      </div>

      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl p-6 relative animate-fade-in">
            <button
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-400 z-10"
              onClick={() => setShowFilterModal(false)}
              aria-label="Fechar modal"
            >
              <X size={22} />
            </button>
            <h2 className="text-lg font-semibold mb-6 text-slate-800 dark:text-slate-100">
              Filtros
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                value={showAll ? "all" : month}
                onChange={(e) => {
                  if (e.target.value === "all") {
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
              <select
                className="select rounded w-full"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
                <option value="Cancelado">Cancelado</option>
              </select>
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 mt-2">
                <input
                  type="checkbox"
                  checked={showCancelled}
                  onChange={(e) => setShowCancelled(e.target.checked)}
                  className="register-checkbox"
                />
                Ver Cancelados
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-slate-700 text-slate-700 dark:text-slate-100 hover:bg-gray-300 dark:hover:bg-slate-600"
                onClick={() => {
                  setFilterDesc("");
                  setFilterValor("");
                  setFilterParcela("");
                  setShowAll(false);
                  setMonth(new Date().getMonth() + 1);
                  setYear(new Date().getFullYear());
                  setShowCancelled(false);
                  setFilterStatus("");
                }}
              >
                Limpar filtros
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setShowFilterModal(false)}
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Totais apenas no mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:hidden mt-4">
        <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-center">
          <span className="block text-[10px] uppercase text-slate-500 leading-tight">
            Total
          </span>
          <span className="text-base font-semibold text-slate-800 dark:text-slate-200 leading-tight">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(total)}
          </span>
        </div>
        <div className="p-2 rounded bg-yellow-100 dark:bg-yellow-500/20 text-center">
          <span className="block text-[10px] uppercase text-yellow-700 leading-tight">
            Pendente
          </span>
          <span className="text-base font-semibold text-yellow-700 dark:text-yellow-300 leading-tight">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totalPendente)}
          </span>
        </div>
        <div className="p-2 rounded bg-green-100 dark:bg-green-500/20 text-center">
          <span className="block text-[10px] uppercase text-green-700 leading-tight">
            Pago
          </span>
          <span className="text-base font-semibold text-green-700 dark:text-green-300 leading-tight">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totalPago)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Summary;
