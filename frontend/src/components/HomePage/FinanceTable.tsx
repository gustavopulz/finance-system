import { parcelaLabel, brl, isAccountPaidInMonth } from '../../lib/format';
import { markAccountPaid } from '../../lib/api';
import type { Account } from '../../lib/types';
import { Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { deleteCollab } from '../../lib/api';
import FinanceTableInnerTable from './FinanceTableInnerTable';

// Funções para persistir a ordenação no localStorage
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
  onPaidUpdate?: (id: string, paid: boolean) => void; // Nova callback
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
      // Se clicou na mesma coluna, inverte a ordem
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
    // Verifica se está pago com base na nova lógica
    if (isAccountPaidInMonth(account, currentComp)) {
      return (
        <span className="badge bg-green-100 dark:bg-green-500/30 text-green-700 dark:text-green-300">
          Pago
        </span>
      );
    }

    // Se tem dtPaid mas não está pago na competência atual, significa que foi pago em mês futuro
    if (account.dtPaid) {
      const paidDate = new Date(account.dtPaid);
      const paidYear = paidDate.getFullYear();
      const paidMonth = paidDate.getMonth() + 1;

      if (
        paidYear > currentComp.year ||
        (paidYear === currentComp.year && paidMonth > currentComp.month)
      ) {
        return (
          <span className="badge bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300">
            Pago Futuramente
          </span>
        );
      }
    }

    if (account.status === 'Cancelado') {
      return (
        <span className="badge bg-red-100 dark:bg-red-500/30 text-red-700 dark:text-red-300">
          Cancelado
        </span>
      );
    }

    // Se não está pago e não está cancelado, está pendente
    return (
      <span className="badge bg-yellow-100 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300">
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

  // Drag só é permitido se não estiver colapsado

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
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors relative z-10"
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

          <div className="flex items-center gap-2">
            <div className="badge bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-100">
              Total: {brl(Number(total))}
            </div>
            <div className="badge bg-yellow-100 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300">
              Total pendente: {brl(Number(totalPendente))}
            </div>
            <div className="badge bg-green-100 dark:bg-green-500/30 text-green-700 dark:text-green-300">
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
        <div className="md:hidden p-4 pb-2">
          {/* Linha 1: Nome + Collapse */}
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

          {/* Linha 2: Totais + Excluir */}
          <div className="flex flex-col gap-2 items-start w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              <div className="badge bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-100 w-full text-center">
                Total: {brl(Number(total))}
              </div>
              <div className="badge bg-yellow-100 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300 w-full text-center">
                Total pendente: {brl(Number(totalPendente))}
              </div>
              <div className="badge bg-green-100 dark:bg-green-500/30 text-green-700 dark:text-green-300 w-full text-center">
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
          <FinanceTableInnerTable
            displayData={displayData}
            selectedItems={selectedItems}
            toggleSelectAll={toggleSelectAll}
            handleSortChange={handleSortChange}
            sortKey={sortKey}
            sortOrder={sortOrder}
            onEdit={onEdit}
            onCancelToggle={onCancelToggle}
            setFinancaToDelete={setFinancaToDelete}
            setSelectedAction={setSelectedAction}
            expandedCancel={expandedCancel}
            setExpandedCancel={setExpandedCancel}
            currentComp={currentComp}
            getStatusBadge={getStatusBadge}
            isAccountPaidInMonth={isAccountPaidInMonth}
            handlePaidToggle={handlePaidToggle}
            parcelaLabel={parcelaLabel}
            brl={brl}
          />
        </div>

        {/* Modal de ações - Mobile */}
        {selectedAction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-72 p-4">
              <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100">
                Ações para {selectedAction.description}
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handlePaidToggle(selectedAction)}
                  className="w-full py-2 rounded bg-green-600 text-white"
                >
                  Pagar
                </button>
                <button
                  onClick={() => onEdit(selectedAction)}
                  className="w-full py-2 rounded bg-yellow-500 text-white"
                >
                  Editar
                </button>
                <button
                  onClick={() => onCancelToggle(selectedAction.id)}
                  className="w-full py-2 rounded bg-red-500 text-white"
                >
                  {selectedAction.status === 'Pendente'
                    ? 'Cancelar'
                    : 'Reabrir'}
                </button>
                <button
                  onClick={() => setFinancaToDelete(selectedAction)}
                  className="w-full py-2 rounded bg-red-700 text-white"
                >
                  Excluir
                </button>
              </div>
              <button
                onClick={() => setSelectedAction(null)}
                className="mt-4 text-sm text-slate-500 hover:text-slate-700"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Modais permanecem iguais abaixo */}
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
