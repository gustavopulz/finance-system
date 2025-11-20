import React from "react";
import { brl } from "../../lib/format";
import type { Collaborator } from "../../lib/types";
import { Eye, EyeOff } from "lucide-react";

interface SidebarProps {
  total: number;
  totalPendente: number;
  totalPago: number;
  collaborators: Collaborator[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  hiddenCollabs: string[];
  onToggleCollabVisibility: (id: string) => void;
  onAddFinance?: (collabId: string) => void;
  month: number;
  year: number;
  onChangeMonthYear: (month: number, year: number) => void;
}

export default function SidebarTotalColabs({
  total,
  totalPendente,
  totalPago,
  collaborators,
  selectedId,
  onSelect,
  hiddenCollabs,
  onToggleCollabVisibility,
  onAddFinance,
  month,
  year,
  onChangeMonthYear,
}: SidebarProps) {
  // Handler para limpar seleção ao clicar na sidebar fora dos botões
  function handleSidebarClick(
    e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>
  ) {
    // Se for botão de colaborador, não limpa
    if ((e.target as HTMLElement).tagName === "BUTTON") return;
    onSelect(null);
  }

  function isCollabHidden(id: string) {
    return hiddenCollabs.includes(id);
  }

  const [editingDate, setEditingDate] = React.useState(false);
  const [inputMonth, setInputMonth] = React.useState(month);
  const [inputYear, setInputYear] = React.useState(year);

  React.useEffect(() => {
    setInputMonth(month);
    setInputYear(year);
  }, [month, year]);

  function handleDateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditingDate(false);
    onChangeMonthYear(Number(inputMonth), Number(inputYear));
  }

  return (
    <aside
      className="w-64 bg-slate-50 dark:bg-slate-900 pr-4 flex flex-col gap-3 pt-3 pb-3 sticky top-6"
      style={{ height: "auto", alignSelf: "flex-start" }}
      onClick={handleSidebarClick}
    >
      {/* Mês/Ano filtrado no topo */}
      <div className="mb-4">
        <div className="flex flex-col gap-1">
          <div className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-1">
            DATA FILTRADA
          </div>
          <span
            className="text-base font-semibold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded cursor-pointer w-fit border border-slate-300 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950 transition shadow-sm"
            onClick={() => setEditingDate(true)}
            title="Alterar mês/ano filtrado"
          >
            {month.toString().padStart(2, "0")}/{year}
          </span>
        </div>
        {editingDate && (
          <div className="flex gap-1 items-center mt-2">
            <input
              type="number"
              min={1}
              max={12}
              value={inputMonth}
              onChange={(e) => setInputMonth(Number(e.target.value))}
              className="input w-14 text-center font-semibold text-sm h-7"
              placeholder="Mês"
              style={{ minWidth: 50, padding: "4px 8px" }}
            />
            <span className="mx-1 text-slate-400">/</span>
            <input
              type="number"
              min={2000}
              max={2100}
              value={inputYear}
              onChange={(e) => setInputYear(Number(e.target.value))}
              className="input w-20 text-center font-semibold text-sm h-7"
              placeholder="Ano"
              style={{ minWidth: 70, padding: "4px 8px" }}
            />
            <button
              type="button"
              className="px-2 rounded bg-blue-600 text-white text-xs font-semibold shadow hover:bg-blue-700 transition flex items-center justify-center h-7"
              onClick={handleDateSubmit}
              style={{ minWidth: 28 }}
              title="OK"
            >
              OK
            </button>
            <button
              type="button"
              className="px-2 rounded bg-gray-200 dark:bg-slate-700 text-xs font-semibold shadow hover:bg-gray-300 dark:hover:bg-slate-600 transition flex items-center justify-center h-7"
              onClick={() => setEditingDate(false)}
              style={{ minWidth: 28 }}
              title="Fechar"
            >
              <span className="sr-only">Fechar</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 6L14 14M14 6L6 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
      <div>
        <div className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-1">
          Total
        </div>
        <div className="text-2xl font-bold text-slate-800 dark:text-white">
          {brl(total)}
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-sm font-bold mt-3 mb-1">
          Total Pendente
        </div>
        <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
          {brl(totalPendente)}
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-sm font-bold mt-3 mb-1">
          Total Pago
        </div>
        <div className="text-lg font-bold text-green-700 dark:text-green-300">
          {brl(totalPago)}
        </div>
      </div>
      <div>
        <div className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-1">
          Colaboradores
        </div>
        <ul className="flex flex-col gap-1">
          {collaborators.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <button
                className={`w-full text-left px-2 py-1.5 rounded border transition-all text-sm
                  ${
                    selectedId === c.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950 font-bold"
                      : "border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }
                `}
                onClick={() => onSelect(c.id)}
              >
                {c.name}
              </button>
              <button
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                title="Adicionar finança para este colaborador"
                onClick={() => onAddFinance && onAddFinance(c.id)}
                style={{ marginLeft: 0 }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 4V16M4 10H16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                title={
                  isCollabHidden(c.id) ? "Exibir tabela" : "Ocultar tabela"
                }
                onClick={() => onToggleCollabVisibility(c.id)}
              >
                {isCollabHidden(c.id) ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
