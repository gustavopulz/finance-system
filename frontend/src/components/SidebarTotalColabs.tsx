import React from 'react';
import { brl } from '../lib/format';
import type { Collaborator } from '../lib/types';
import { Eye, EyeOff } from 'lucide-react';

interface SidebarProps {
  total: number;
  totalPendente: number;
  totalPago: number;
  collaborators: Collaborator[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  hiddenCollabs: string[];
  onToggleCollabVisibility: (id: string) => void;
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
}: SidebarProps) {
  // Handler para limpar seleção ao clicar na sidebar fora dos botões
  function handleSidebarClick(
    e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>
  ) {
    // Se for botão de colaborador, não limpa
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    onSelect(null);
  }

  function isCollabHidden(id: string) {
    return hiddenCollabs.includes(id);
  }

  return (
    <aside
      className="w-64 bg-slate-50 dark:bg-slate-900 pr-4 flex flex-col gap-3 border-r border-slate-200 dark:border-slate-800 pt-3 pb-3"
      style={{ height: 'auto', alignSelf: 'flex-start' }}
      onClick={handleSidebarClick}
    >
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
        <div className="text-slate-500 text-sm font-bold mb-2">
          Colaboradores
        </div>
        <ul className="flex flex-col gap-1">
          {collaborators.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <button
                className={`w-full text-left px-2 py-1.5 rounded border transition-all text-sm
                  ${
                    selectedId === c.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 font-bold'
                      : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }
                `}
                onClick={() => onSelect(c.id)}
              >
                {c.name}
              </button>
              <button
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                title={
                  isCollabHidden(c.id) ? 'Exibir tabela' : 'Ocultar tabela'
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
