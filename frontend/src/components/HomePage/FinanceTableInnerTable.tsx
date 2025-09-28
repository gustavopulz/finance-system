import {
  CheckCircle,
  Ban,
  Pencil,
  Trash2,
  GripVertical,
  PlayCircle,
  Clock,
} from 'lucide-react';
import type { Account } from '../../lib/types';
import React from 'react';

interface FinanceTableInnerTableProps {
  displayData: Account[];
  selectedItems: Set<string>;
  toggleSelectAll: () => void;
  handleSortChange: (key: any) => void;
  sortKey: string;
  sortOrder: string;
  onEdit: (a: Account) => void;
  onCancelToggle: (id: string) => void;
  setFinancaToDelete: (a: Account) => void;
  setSelectedAction: (a: Account) => void;
  expandedCancel: string | null;
  setExpandedCancel: (id: string | null) => void;
  currentComp: { year: number; month: number };
  getStatusBadge: (a: Account) => React.JSX.Element;
  isAccountPaidInMonth: (
    a: Account,
    comp: { year: number; month: number }
  ) => boolean;
  handlePaidToggle: (a: Account) => void;
  parcelaLabel: (a: Account, comp: { year: number; month: number }) => string;
  brl: (v: number) => string;
}

const FinanceTableInnerTable: React.FC<FinanceTableInnerTableProps> = ({
  displayData,
  selectedItems,
  toggleSelectAll,
  handleSortChange,
  sortKey,
  sortOrder,
  onEdit,
  onCancelToggle,
  setFinancaToDelete,
  setSelectedAction,
  expandedCancel,
  setExpandedCancel,
  currentComp,
  getStatusBadge,
  isAccountPaidInMonth,
  handlePaidToggle,
  parcelaLabel,
  brl,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="text-sm text-left border-collapse">
        <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
          <tr>
            {/* Checkbox oculto no mobile */}
            <th className="px-4 py-3 font-medium text-center w-[5%] hidden sm:table-cell">
              <input
                type="checkbox"
                checked={
                  selectedItems.size === displayData.length &&
                  displayData.length > 0
                }
                onChange={toggleSelectAll}
                className="custom-checkbox"
                title="Selecionar todos"
              />
            </th>
            <th
              className="px-6 py-3 font-medium text-left w-[28%] cursor-pointer"
              onClick={() => handleSortChange('description')}
            >
              Descrição{' '}
              {sortKey === 'description' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="px-4 py-3 font-medium text-left w-[10%] cursor-pointer"
              onClick={() => handleSortChange('value')}
            >
              Valor {sortKey === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="px-4 py-3 font-medium text-center w-[10%] cursor-pointer"
              onClick={() => handleSortChange('parcelas')}
            >
              Parcela{' '}
              {sortKey === 'parcelas' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="px-4 py-3 font-medium text-center w-[12%] cursor-pointer"
              onClick={() => handleSortChange('status')}
            >
              Status {sortKey === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-3 font-medium text-center w-[8%] hidden sm:table-cell">
              Pago
            </th>
            <th className="px-2 py-3 font-medium text-center w-[8%]">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {displayData.map((f: Account, idx: number) => (
            <tr
              key={f.id}
              className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition ${
                idx % 2 === 0
                  ? 'bg-white dark:bg-slate-800/40'
                  : 'bg-slate-50 dark:bg-slate-900/40'
              }`}
            >
              {/* Checkbox oculto no mobile */}
              <td className="px-4 py-3 text-center hidden sm:table-cell">
                <input
                  type="checkbox"
                  checked={selectedItems.has(f.id)}
                  onChange={() => {}}
                  className="custom-checkbox"
                  readOnly
                />
              </td>
              <td className="break-words px-6 py-3 font-medium text-slate-800 dark:text-slate-100">
                {f.description}
              </td>
              <td className="break-words px-4 py-3 text-slate-600 dark:text-slate-400">
                {brl(Number(f.value))}
              </td>
              <td className="break-words px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                {parcelaLabel(f, currentComp)}
              </td>

              {/* STATUS */}
              <td className="break-words px-4 py-3 text-center">
                <div className="hidden sm:block">
                  {f.status === 'Cancelado' ? (
                    <>
                      <button
                        onClick={() =>
                          setExpandedCancel(
                            expandedCancel === f.id ? null : f.id
                          )
                        }
                        className="text-red-500 underline"
                      >
                        {getStatusBadge(f)}
                      </button>
                      {f.cancelledAt && expandedCancel === f.id && (
                        <div className="text-xs text-slate-400 mt-1">
                          Cancelado em:{' '}
                          {new Date(f.cancelledAt).toLocaleDateString('pt-BR', {
                            year: 'numeric',
                            month: '2-digit',
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    getStatusBadge(f)
                  )}
                </div>

                <div className="sm:hidden flex items-center justify-center">
                  {isAccountPaidInMonth(f, currentComp) ? (
                    <CheckCircle className="text-green-500" size={18} />
                  ) : f.status === 'Pendente' ? (
                    <Clock className="text-yellow-500" size={18} />
                  ) : f.status === 'Cancelado' ? (
                    <button
                      onClick={() =>
                        setExpandedCancel(expandedCancel === f.id ? null : f.id)
                      }
                      className="text-red-500"
                    >
                      <Ban size={18} />
                    </button>
                  ) : f.status === 'ativo' ? (
                    <PlayCircle className="text-blue-500" size={18} />
                  ) : null}
                </div>

                {f.cancelledAt && expandedCancel === f.id && (
                  <div className="sm:hidden text-xs text-slate-400 mt-1">
                    Cancelado em:{' '}
                    {new Date(f.cancelledAt).toLocaleDateString('pt-BR', {
                      year: 'numeric',
                      month: '2-digit',
                    })}
                  </div>
                )}
              </td>

              {/* pago - escondido no mobile */}
              <td className="px-4 py-3 text-center hidden sm:table-cell">
                <input
                  type="checkbox"
                  checked={isAccountPaidInMonth(f, currentComp)}
                  onChange={() => handlePaidToggle(f)}
                  aria-label="Marcar como pago"
                  className="custom-checkbox"
                />
              </td>

              {/* AÇÕES */}
              <td className="px-2 py-3 text-center">
                <div className="flex items-center justify-center">
                  <div className="hidden sm:flex items-center gap-2">
                    <button
                      className="p-2 text-slate-500 hover:text-yellow-500"
                      onClick={() => onEdit(f)}
                      aria-label="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="p-2 text-slate-500 hover:text-red-400"
                      onClick={() => onCancelToggle(f.id)}
                      aria-label={
                        f.status === 'Pendente' || f.status === 'ativo'
                          ? 'Cancelar lançamento'
                          : 'Reabrir como pendente'
                      }
                    >
                      {f.status === 'Pendente' || f.status === 'ativo' ? (
                        <Ban size={16} />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                    </button>
                    <button
                      className="p-2 text-slate-500 hover:text-red-600"
                      onClick={() => setFinancaToDelete(f)}
                      aria-label="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Mobile: menu */}
                  <div className="sm:hidden">
                    <button
                      className="p-2 text-slate-500 hover:text-slate-300"
                      onClick={() => setSelectedAction(f)}
                    >
                      <GripVertical size={18} />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FinanceTableInnerTable;
