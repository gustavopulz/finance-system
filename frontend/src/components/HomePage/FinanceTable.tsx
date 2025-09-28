import { parcelaLabel, brl, isAccountPaidInMonth } from '../../lib/format';
import { markAccountPaid } from '../../lib/api';
import type { Account } from '../../lib/types';
import { Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { deleteCollab } from '../../lib/api';
import {
  CheckCircle,
  Ban,
  Pencil,
  MoreVertical,
  PlayCircle,
  Clock,
} from 'lucide-react';
import React from 'react';

const getSortState = (collaboratorId: string) => {
  const saved = localStorage.getItem(`sort_${collaboratorId}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return { sortKey: 'description', sortOrder: 'asc' };
    }
  }
  return { sortKey: 'description', sortOrder: 'asc' };
};

const setSortState = (
  collaboratorId: string,
  sortKey: string,
  sortOrder: string
) => {
  localStorage.setItem(
    `sort_${collaboratorId}`,
    JSON.stringify({ sortKey, sortOrder })
  );
};

export interface FinanceTableProps {
  collaboratorId: string;
  title: string;
  items: Account[];
  currentComp: { year: number; month: number };
  onDelete: (id: string | string[]) => void;
  onEdit: (a: Account) => void;
  onCancelToggle: (id: string) => void;
  onCollabDeleted: (id: string) => void;
  onPaidUpdate?: (id: string, paid: boolean) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}

type SortKey = 'description' | 'value' | 'parcelas' | 'status';

export default function FinanceTable({
  collaboratorId,
  title,
  items,
  currentComp,
  onDelete,
  onEdit,
  onCancelToggle,
  onCollabDeleted,
  onPaidUpdate,
  dragHandleProps,
}: FinanceTableProps) {
  const [localItems, setLocalItems] = useState<Account[]>(items);

  // Inicializa a ordenação com os valores salvos para este colaborador
  const savedSort = getSortState(collaboratorId);
  const [sortKey, setSortKey] = useState<SortKey>(savedSort.sortKey as SortKey);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    savedSort.sortOrder
  );

  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [financaToDelete, setFinancaToDelete] = useState<Account | null>(null);

  // Função helper para atualizar ordenação e salvar no localStorage
  const handleSortChange = (newSortKey: SortKey) => {
    let newSortOrder: 'asc' | 'desc' = 'asc';

    if (sortKey === newSortKey) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }

    setSortKey(newSortKey);
    setSortOrder(newSortOrder);
    setSortState(collaboratorId, newSortKey, newSortOrder);
  };
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    financa: Account | null;
  }>({ open: false, financa: null });

  // Estado de colapso persistido no localStorage
  const getCollapseState = (collaboratorId: string) => {
    const saved = localStorage.getItem(`collapse_${collaboratorId}`);
    if (saved === 'true') return true;
    if (saved === 'false') return false;
    return false;
  };
  const [isCollapsed, _setIsCollapsed] = useState(
    getCollapseState(collaboratorId)
  );
  const setIsCollapsed = (value: boolean) => {
    localStorage.setItem(
      `collapse_${collaboratorId}`,
      value ? 'true' : 'false'
    );
    _setIsCollapsed(value);
  };

  // Estados para seleção múltipla
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Estado para ação selecionada (mobile menu)
  const [selectedAction, setSelectedAction] = useState<Account | null>(null);

  // Estado para expandir/collapse do cancelado em (mobile)
  const [expandedCancel, setExpandedCancel] = useState<string | null>(null);

  // Seleção múltipla
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === localItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(localItems.map((item) => item.id)));
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleBulkPaidToggle = async (markAsPaid: boolean) => {
    const selectedAccounts = localItems.filter((item) =>
      selectedItems.has(item.id)
    );
    const accountIds = selectedAccounts.map((a) => a.id);
    try {
      await markAccountPaid(accountIds, markAsPaid);
      setLocalItems((prev) =>
        prev.map((item) =>
          accountIds.includes(item.id)
            ? {
                ...item,
                paid: markAsPaid,
                dtPaid: markAsPaid ? new Date().toISOString() : undefined,
              }
            : item
        )
      );
      accountIds.forEach((id) => onPaidUpdate?.(id, markAsPaid));
      setToast(
        `${accountIds.length} finança(s) marcada(s) como ${markAsPaid ? 'paga(s)' : 'não paga(s)'} ✅`
      );
    } catch (error) {
      setToast('Erro ao marcar contas');
    }
    clearSelection();
    setTimeout(() => setToast(null), 3000);
  };

  const handleBulkDelete = async () => {
    const selectedAccounts = localItems.filter((item) =>
      selectedItems.has(item.id)
    );
    const accountIds = selectedAccounts.map((a) => a.id);
    try {
      await onDelete(accountIds);
      setToast(`${accountIds.length} finança(s) excluída(s) com sucesso ✅`);
    } catch (error) {
      setToast('Erro ao excluir contas');
    }
    clearSelection();
    setShowBulkDeleteConfirm(false);
    setTimeout(() => setToast(null), 3000);
  };

  // Atualiza localItems quando items mudar
  useEffect(() => {
    setLocalItems((prev) => {
      // Se é a primeira vez ou o número de itens mudou significativamente, usa items diretamente
      if (prev.length === 0 || Math.abs(prev.length - items.length) > 1) {
        return items;
      }

      // Caso contrário, atualiza item por item preservando mudanças locais importantes
      const updatedItems = items.map((newItem) => {
        const existingItem = prev.find(
          (prevItem) => prevItem && prevItem.id === newItem.id
        );
        if (
          existingItem &&
          typeof existingItem === 'object' &&
          typeof newItem === 'object'
        ) {
          // Preserva campos que podem ter sido modificados localmente
          return {
            ...newItem,
            paid: existingItem.paid,
            dtPaid: existingItem.dtPaid,
          };
        }
        return newItem;
      });

      return updatedItems;
    });

    // Limpa seleções que não existem mais
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      const itemIds = new Set(items.map((item) => item.id));
      prev.forEach((id) => {
        if (!itemIds.has(id)) {
          newSet.delete(id);
        }
      });
      return newSet;
    });
  }, [items]);

  // Adicionado para inspecionar os dados das contas renderizadas
  useEffect(() => {
    if (items && items.length > 0) {
    }
  }, [items]);

  // Totais considerando o campo paid por competência
  const total = localItems.reduce((acc, f) => acc + Number(f.value), 0);
  const totalPendente = localItems
    .filter(
      (f) => !isAccountPaidInMonth(f, currentComp) && f.status !== 'Cancelado'
    ) // Exclui itens cancelados
    .reduce((acc, f) => acc + Number(f.value), 0);
  const totalPago = localItems
    .filter((f) => isAccountPaidInMonth(f, currentComp))
    .reduce((acc, f) => acc + Number(f.value), 0);

  async function handlePaidToggle(account: Account) {
    try {
      const currentPaid = isAccountPaidInMonth(account, currentComp);
      const newPaid = !currentPaid;
      const dtPaidStr = newPaid
        ? new Date(currentComp.year, currentComp.month - 1, 1).toISOString()
        : undefined;

      await markAccountPaid([account.id], newPaid, dtPaidStr);

      setLocalItems((prev) =>
        prev.map((item) =>
          item.id === account.id
            ? {
                ...item,
                paid: newPaid,
                dtPaid: dtPaidStr,
              }
            : item
        )
      );

      onPaidUpdate?.(account.id, newPaid);
      setToast(`Finança marcada como ${newPaid ? 'paga' : 'não paga'} ✅`);
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      setToast('Erro ao marcar como pago');
      setTimeout(() => setToast(null), 2000);
    }
  }

  async function confirmDeleteCollab() {
    await deleteCollab(collaboratorId);
    onCollabDeleted(collaboratorId);
    setShowConfirm(false);
    setToast(`Colaborador "${title}" excluído com sucesso ✅`);
    setTimeout(() => setToast(null), 3000);
  }

  async function confirmDeleteFinanca() {
    if (!financaToDelete) return;
    await onDelete(financaToDelete.id);
    setFinancaToDelete(null);
    setToast(`Finança excluída com sucesso ✅`);
    setTimeout(() => setToast(null), 3000);
  }

  function getStatusBadge(account: Account): React.JSX.Element {
    // Verifica se está pago
    if (isAccountPaidInMonth(account, currentComp)) {
      return (
        <span className="badge bg-green-500 text-white dark:bg-green-500/30 dark:text-green-300">
          Pago
        </span>
      );
    }

    if (account.dtPaid) {
      const paidDate = new Date(account.dtPaid);
      const paidYear = paidDate.getFullYear();
      const paidMonth = paidDate.getMonth() + 1;

      if (
        paidYear > currentComp.year ||
        (paidYear === currentComp.year && paidMonth > currentComp.month)
      ) {
        return (
          <span className="badge bg-blue-500 text-white dark:bg-blue-500/30 dark:text-blue-300">
            Pago Futuramente
          </span>
        );
      }
    }

    if (account.status === 'Cancelado') {
      return (
        <span className="badge bg-red-500 text-white dark:bg-red-500/30 dark:text-red-300">
          Cancelado
        </span>
      );
    }

    // Se não está pago e não está cancelado, está pendente
    return (
      <span className="badge bg-yellow-400 text-yellow-900 dark:bg-yellow-500/30 dark:text-yellow-300">
        Pendente
      </span>
    );
  }

  const sortedData = useMemo(() => {
    const copy = [...localItems];
    copy.sort((a: Account, b: Account) => {
      let va: any, vb: any;
      switch (sortKey) {
        case 'value':
          va = a.value;
          vb = b.value;
          break;
        case 'status':
          va = a.paid ? 1 : 0;
          vb = b.paid ? 1 : 0;
          break;
        case 'parcelas': {
          // Fixas primeiro, depois avulsas, depois parceladas
          const getTypeOrder = (acc: Account) => {
            if (acc.parcelasTotal === null || acc.parcelasTotal === undefined)
              return 0; // fixa
            if (acc.parcelasTotal === 0 || acc.parcelasTotal === 1) return 1; // avulsa
            return 2; // parcelada
          };
          const typeA = getTypeOrder(a);
          const typeB = getTypeOrder(b);
          if (typeA !== typeB)
            return sortOrder === 'asc' ? typeA - typeB : typeB - typeA;
          // Se mesmo tipo, ordena pelo número da parcela (se parcelada)
          if (typeA === 2) {
            // Parcelada: ordena pelo número da parcela atual
            const la = parcelaLabel(a, currentComp);
            const lb = parcelaLabel(b, currentComp);
            va = Number(la.split('/')[0]) || 0;
            vb = Number(lb.split('/')[0]) || 0;
            if (va < vb) return sortOrder === 'asc' ? -1 : 1;
            if (va > vb) return sortOrder === 'asc' ? 1 : -1;
            return 0;
          }
          // Se fixa ou avulsa, ordena por descrição
          va = a.description.toLowerCase();
          vb = b.description.toLowerCase();
          if (va < vb) return sortOrder === 'asc' ? -1 : 1;
          if (va > vb) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        }
        default:
          va = a.description.toLowerCase();
          vb = b.description.toLowerCase();
      }
      if (va < vb) return sortOrder === 'asc' ? -1 : 1;
      if (va > vb) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [localItems, sortKey, sortOrder, currentComp]);

  // Dados a serem exibidos (considerando colapso)
  const displayData = useMemo(() => {
    return isCollapsed ? sortedData.slice(0, 1) : sortedData;
  }, [sortedData, isCollapsed]);

  // Bloqueia qualquer drag/pointer/mouse quando colapsado
  const blockEventsIfCollapsed = isCollapsed
    ? {
        onDragStart: (e: any) => {
          e.preventDefault();
          e.stopPropagation();
        },
        onPointerDown: (e: any) => {
          e.preventDefault();
          e.stopPropagation();
        },
        onMouseDown: (e: any) => {
          e.preventDefault();
          e.stopPropagation();
        },
        onTouchStart: (e: any) => {
          e.preventDefault();
          e.stopPropagation();
        },
      }
    : {};
  // dragHandleProps nunca é passado para o DOM quando colapsado
  const dragProps = isCollapsed ? {} : dragHandleProps || {};
  const dragStyle = isCollapsed ? {} : dragHandleProps?.style || {};

  return (
    <>
      <section className="relative">
        {/* Cabeçalho DESKTOP */}
        <div
          className="hidden md:flex items-center justify-between px-6 py-2 border border-b-0 border-slate-300 dark:border-slate-700 rounded-t-md cursor-grab"
          {...dragProps}
          {...blockEventsIfCollapsed}
          style={{ ...dragStyle, userSelect: 'none' }}
        >
          <div className="flex items-center gap-2 flex-1">
            <GripVertical
              size={16}
              className="text-slate-400 dark:text-slate-500"
            />
            <h3 className="text-base font-semibold">{title}</h3>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors relative z-10"
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              title={isCollapsed ? 'Expandir tabela' : 'Colapsar tabela'}
            >
              {isCollapsed ? (
                <ChevronDown
                  size={18}
                  className="text-slate-600 dark:text-slate-300"
                />
              ) : (
                <ChevronUp
                  size={18}
                  className="text-slate-600 dark:text-slate-300"
                />
              )}
            </button>
          </div>

          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {selectedItems.size} selecionado(s)
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBulkPaidToggle(true);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                title="Marcar selecionados como pagos"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
                Marcar Pago
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBulkPaidToggle(false);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                title="Marcar selecionados como não pagos"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
                Marcar Pendente
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowBulkDeleteConfirm(true);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                title="Excluir selecionados"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
                Excluir
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearSelection();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                title="Limpar seleção"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="badge bg-slate-500 text-white dark:bg-slate-800 dark:text-slate-100 font-semibold">
              Total: {brl(Number(total))}
            </div>
            <div className="badge bg-yellow-400 text-yellow-900 dark:bg-yellow-500/30 dark:text-yellow-300 font-semibold">
              Total pendente: {brl(Number(totalPendente))}
            </div>
            <div className="badge bg-green-500 text-white dark:bg-green-500/30 dark:text-green-300 font-semibold">
              Total pago: {brl(Number(totalPago))}
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Cabeçalho MOBILE */}
        <div className="md:hidden p-4 pb-2 border border-slate-300 dark:border-slate-700 border-b-0 rounded-t-md">
          <div
            className="flex items-center justify-between mb-2 cursor-grab"
            {...dragProps}
            {...blockEventsIfCollapsed}
            style={{ ...dragStyle, userSelect: 'none' }}
          >
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
              title={isCollapsed ? 'Expandir tabela' : 'Colapsar tabela'}
            >
              {isCollapsed ? (
                <ChevronDown
                  size={18}
                  className="text-slate-600 dark:text-slate-300"
                />
              ) : (
                <ChevronUp
                  size={18}
                  className="text-slate-600 dark:text-slate-300"
                />
              )}
            </button>
          </div>

          <div className="flex flex-col gap-2 items-start w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              <div className="badge bg-slate-500 text-white dark:bg-slate-800 dark:text-slate-100 w-full text-center font-semibold">
                Total: {brl(Number(total))}
              </div>
              <div className="badge bg-yellow-400 text-yellow-900 dark:bg-yellow-500/30 dark:text-yellow-300 w-full text-center font-semibold">
                Total pendente: {brl(Number(totalPendente))}
              </div>
              <div className="badge bg-green-500 text-white dark:bg-green-500/30 dark:text-green-300 w-full text-center font-semibold">
                Total pago: {brl(Number(totalPago))}
              </div>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
            >
              <Trash2 size={16} />
              Excluir
            </button>
          </div>
        </div>

        <div className="border border-slate-300 dark:border-slate-700 shadow-sm rounded-b-md">
          <div className="w-full px-0">
            <table className="text-xs sm:text-sm text-left border-collapse w-full table-auto">
              <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                <tr>
                  {/* Checkbox oculto no mobile */}
                  <th className="px-2 sm:px-6 py-3 sm:py-4 font-medium text-center hidden sm:table-cell">
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
                    className="px-2 sm:px-6 py-3 sm:py-4 font-medium text-left cursor-pointer break-words"
                    onClick={() => handleSortChange('description')}
                  >
                    Descrição{' '}
                    {sortKey === 'description' &&
                      (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-2 sm:px-6 py-3 sm:py-4 font-medium text-left cursor-pointer break-words"
                    onClick={() => handleSortChange('value')}
                  >
                    Valor{' '}
                    {sortKey === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-2 sm:px-6 py-3 sm:py-4 font-medium text-center cursor-pointer break-words"
                    onClick={() => handleSortChange('parcelas')}
                  >
                    Parcela{' '}
                    {sortKey === 'parcelas' &&
                      (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-2 sm:px-6 py-3 sm:py-4 font-medium text-center cursor-pointer break-words"
                    onClick={() => handleSortChange('status')}
                  >
                    Status{' '}
                    {sortKey === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-2 sm:px-6 py-3 sm:py-4 font-medium text-center hidden sm:table-cell">
                    Pago
                  </th>
                  <th className="px-2 sm:px-6 py-3 sm:py-4 font-medium text-center break-words">
                    Ações
                  </th>
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
                    <td className="px-2 sm:px-6 py-3 sm:py-4 text-center hidden sm:table-cell">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(f.id)}
                        onChange={() => toggleItemSelection(f.id)}
                        className="custom-checkbox"
                      />
                    </td>
                    <td className="break-words px-2 sm:px-6 py-3 sm:py-4 font-medium text-slate-800 dark:text-slate-100">
                      {f.description}
                    </td>
                    <td className="break-words px-2 sm:px-6 py-3 sm:py-4 text-slate-600 dark:text-slate-400">
                      {brl(Number(f.value))}
                    </td>
                    <td className="break-words px-2 sm:px-6 py-3 sm:py-4 text-center text-slate-600 dark:text-slate-400">
                      {parcelaLabel(f, currentComp)}
                    </td>

                    <td className="break-words px-2 sm:px-6 py-3 sm:py-4 text-center">
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
                                {new Date(f.cancelledAt).toLocaleDateString(
                                  'pt-BR',
                                  {
                                    year: 'numeric',
                                    month: '2-digit',
                                  }
                                )}
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
                              setExpandedCancel(
                                expandedCancel === f.id ? null : f.id
                              )
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
                    <td className="px-2 sm:px-6 py-3 sm:py-4 text-center hidden sm:table-cell">
                      <input
                        type="checkbox"
                        checked={isAccountPaidInMonth(f, currentComp)}
                        onChange={() => handlePaidToggle(f)}
                        aria-label="Marcar como pago"
                        className="custom-checkbox"
                      />
                    </td>

                    <td className="px-2 sm:px-6 py-3 sm:py-4 text-center">
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
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de ações - Mobile */}
        {selectedAction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-80 p-0 relative">
              <button
                onClick={() => setSelectedAction(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-400 z-10"
                aria-label="Fechar modal"
              >
                <svg
                  width="22"
                  height="22"
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
              <div className="p-6 pb-4">
                <h3 className="text-lg font-normal mb-6 text-slate-800 dark:text-slate-100 text-center">
                  Ações para{' '}
                  <b className="text-primary font-bold">
                    {selectedAction.description}
                  </b>
                </h3>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handlePaidToggle(selectedAction)}
                    className="w-full py-2 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white shadow-sm transition-colors"
                  >
                    Pagar
                  </button>
                  <button
                    onClick={() => onEdit(selectedAction)}
                    className="w-full py-2 rounded-lg font-semibold bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onCancelToggle(selectedAction.id)}
                    className="w-full py-2 rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white shadow-sm transition-colors"
                  >
                    {selectedAction.status === 'Pendente'
                      ? 'Cancelar'
                      : 'Reabrir'}
                  </button>
                  <button
                    onClick={() => setFinancaToDelete(selectedAction)}
                    className="w-full py-2 rounded-lg font-semibold bg-red-700 hover:bg-red-800 text-white shadow-sm transition-colors"
                  >
                    Excluir
                  </button>
                </div>
                <button
                  onClick={() => setSelectedAction(null)}
                  className="mt-6 w-full py-2 rounded-lg font-semibold border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shadow-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modais */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded p-6 shadow-lg max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4">
                Excluir finanças selecionadas
              </h2>
              <p className="mb-6">
                Tem certeza que deseja excluir{' '}
                <b>{selectedItems.size} finança(s)</b> selecionada(s)? Essa ação
                não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 rounded bg-red-600 text-white"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded p-6 shadow-lg max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4">
                Excluir colaborador
              </h2>
              <p className="mb-6">
                Tem certeza que deseja excluir <b>{title}</b>? Essa ação não
                pode ser desfeita.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteCollab}
                  className="px-4 py-2 rounded bg-red-600 text-white"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {actionModal.open && actionModal.financa && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded p-6 shadow-lg max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4">Ações</h2>
              <p className="mb-6">
                Selecione uma ação para o lançamento{' '}
                <b>{actionModal.financa.description}</b>:
              </p>
              <div className="flex flex-col gap-2">
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white"
                  onClick={() => {
                    if (actionModal.financa) {
                      onEdit(actionModal.financa);
                    }
                    setActionModal({ open: false, financa: null });
                  }}
                >
                  Editar
                </button>
                <button
                  className={`px-4 py-2 rounded text-white font-semibold capitalize ${
                    actionModal.financa.status === 'Pendente' ||
                    actionModal.financa.status === 'ativo'
                      ? 'bg-red-600'
                      : 'bg-yellow-500'
                  }`}
                  onClick={() => {
                    if (actionModal.financa) {
                      onCancelToggle(actionModal.financa.id);
                    }
                    setActionModal({ open: false, financa: null });
                  }}
                >
                  {actionModal.financa.status === 'Pendente' ||
                  actionModal.financa.status === 'ativo'
                    ? 'Cancelar'
                    : 'Pendente'}
                </button>
                <button
                  className="px-4 py-2 rounded bg-red-600 text-white"
                  onClick={() => {
                    if (actionModal.financa) {
                      setFinancaToDelete(actionModal.financa);
                    }
                    setActionModal({ open: false, financa: null });
                  }}
                >
                  Excluir lançamento
                </button>
                <button
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-slate-700 text-black dark:text-white"
                  onClick={() => setActionModal({ open: false, financa: null })}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {financaToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded p-6 shadow-lg max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4">Excluir finança</h2>
              <p className="mb-6">
                Tem certeza que deseja excluir o lançamento{' '}
                <b>{financaToDelete.description}</b>? Essa ação não pode ser
                desfeita.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setFinancaToDelete(null)}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteFinanca}
                  className="px-4 py-2 rounded bg-red-600 text-white"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
            {toast}
          </div>
        )}
      </section>
    </>
  );
}
