import { parcelaLabel, brl, isAccountPaidInMonth } from '../lib/format';
import { markAccountPaid } from '../lib/api';
import type { Account } from '../lib/types';
import {
  Trash2,
  Pencil,
  Ban,
  CheckCircle,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { deleteCollab } from '../lib/api';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Estados para seleção múltipla
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Funções para seleção múltipla
  const toggleItemSelection = (itemId: string) => {
    console.log('toggleItemSelection chamado:', { itemId });
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        console.log('Item desmarcado:', itemId);
      } else {
        newSet.add(itemId);
        console.log('Item marcado:', itemId);
      }
      console.log('Nova seleção:', Array.from(newSet));
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    console.log('toggleSelectAll chamado');
    if (selectedItems.size === localItems.length) {
      console.log('Desmarcando todos');
      setSelectedItems(new Set());
    } else {
      console.log('Marcando todos');
      setSelectedItems(new Set(localItems.map((item) => item.id)));
    }
  };

  const clearSelection = () => {
    console.log('clearSelection chamado');
    setSelectedItems(new Set());
  };

  const handleBulkPaidToggle = async (markAsPaid: boolean) => {
    console.log('handleBulkPaidToggle chamado:', {
      markAsPaid,
      selectedItemsCount: selectedItems.size,
    });

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
    console.log('handleBulkDelete chamado:', {
      selectedItemsCount: selectedItems.size,
    });

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
    console.log('handleBulkDelete concluído:', {
      successCount: accountIds.length,
    });
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
      items.forEach((item) => {
        console.log('[FinanceTable] Conta:', {
          id: item.id,
          description: item.description,
          dtPaid: item.dtPaid,
          parcelasTotal: item.parcelasTotal,
        });
      });
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

      await markAccountPaid([account.id], newPaid);

      setLocalItems((prev) =>
        prev.map((item) =>
          item.id === account.id
            ? {
                ...item,
                paid: newPaid,
                dtPaid: newPaid ? new Date().toISOString() : undefined,
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

  return (
    <section className="relative">
      {/* Cabeçalho DESKTOP minimalista */}
      <div
        className="hidden md:flex items-center justify-between px-6 py-2 border border-b-0 border-slate-300 dark:border-slate-700 rounded-t-md cursor-grab"
        {...(dragHandleProps || {})}
        style={{ ...(dragHandleProps?.style || {}), userSelect: 'none' }}
      >
        {/* Área esquerda: grip + título + seta */}
        <div className="flex items-center gap-2 flex-1">
          <GripVertical
            size={16}
            className="text-slate-400 dark:text-slate-500"
          />
          <h3 className="text-base font-semibold">{title}</h3>
          {/* Botão colapsar - impede propagação do drag */}
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

        {/* Direita: totais + excluir */}
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {selectedItems.size} selecionado(s)
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Botão "Marcar Pago" clicado');
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
                  console.log('Botão "Marcar Pendente" clicado');
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
                  console.log('Botão "Excluir" clicado');
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
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Cabeçalho MOBILE */}
      <div className="md:hidden p-4 pb-2">
        {selectedItems.size > 0 && (
          <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {selectedItems.size} selecionado(s)
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Botão mobile "Marcar Pago" clicado');
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
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
                Marcar Pago
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Botão mobile "Pendente" clicado');
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
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
                Pendente
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Botão mobile "Excluir" clicado');
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
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  selectedItems.size === localItems.length &&
                  localItems.length > 0
                }
                onChange={toggleSelectAll}
                className="custom-checkbox"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Selecionar todos
              </span>
            </div>
          </div>
        )}
        <div
          className="flex items-center justify-between cursor-grab"
          {...(dragHandleProps || {})}
          style={{ ...(dragHandleProps?.style || {}), userSelect: 'none' }}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            {/* Botão colapsar - impede propagação do drag */}
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
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
            >
              <Trash2 size={16} />
              Excluir
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP - Tabela estilo Jenkins */}
      <div className="hidden md:block overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm rounded-b-md">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium text-center w-[5%]">
                <input
                  type="checkbox"
                  checked={
                    selectedItems.size === localItems.length &&
                    localItems.length > 0
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
                Status{' '}
                {sortKey === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 font-medium text-center w-[8%]">Pago</th>
              <th className="px-4 py-3 font-medium text-center w-[12%]">
                Cancelado em
              </th>
              <th className="px-2 py-3 font-medium text-center w-[8%]">
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
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(f.id)}
                    onChange={() => toggleItemSelection(f.id)}
                    className="custom-checkbox"
                  />
                </td>
                <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-100">
                  {f.description}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {brl(Number(f.value))}
                </td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                  {parcelaLabel(f, currentComp)}
                </td>
                <td className="px-4 py-3 text-center">{getStatusBadge(f)}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAccountPaidInMonth(f, currentComp)}
                    onChange={() => handlePaidToggle(f)}
                    aria-label="Marcar como pago"
                    className="custom-checkbox"
                  />
                </td>
                <td className="px-4 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
                  {f.cancelledAt
                    ? new Date(f.cancelledAt).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: '2-digit',
                      })
                    : ''}
                </td>

                {/* COLUNA AÇÕES - agora garantida no desktop */}
                <td className="px-2 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {/* Editar */}
                    <button
                      className="p-2 text-slate-500 hover:text-yellow-500"
                      onClick={() => onEdit(f)}
                      aria-label="Editar"
                    >
                      <Pencil size={16} />
                    </button>

                    {/* Cancelar / Reabrir */}
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

                    {/* Excluir */}
                    <button
                      className="p-2 text-slate-500 hover:text-red-600"
                      onClick={() => setFinancaToDelete(f)}
                      aria-label="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {displayData.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-6 text-center text-slate-500 dark:text-slate-400"
                >
                  Sem lançamentos
                </td>
              </tr>
            )}
            {isCollapsed && sortedData.length > 1 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-2 text-center text-slate-500 dark:text-slate-400 text-sm italic"
                >
                  ... e mais {sortedData.length - 1} item(ns)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE - Cards */}
      <div className="block md:hidden space-y-3">
        {displayData.map((f) => (
          <div
            key={f.id}
            className={`border border-slate-300 dark:border-slate-700 rounded p-4 bg-white dark:bg-slate-800 shadow-sm ${
              selectedItems.has(f.id)
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : ''
            }`}
          >
            {/* Header: checkbox + título + status */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedItems.has(f.id)}
                  onChange={() => toggleItemSelection(f.id)}
                  className="custom-checkbox"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {f.description}
                </span>
              </div>

              {/* Status + data cancelamento */}
              <div className="flex flex-col items-end">
                {getStatusBadge(f)}
                {f.cancelledAt && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(f.cancelledAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Informações principais */}
            <div className="text-slate-600 dark:text-slate-400 text-sm">
              Valor: {brl(Number(f.value))}
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm">
              Parcela: {parcelaLabel(f, currentComp)}
            </div>

            {/* Pago + Ações */}
            <div className="flex items-center justify-between mt-3">
              {/* Pago */}
              <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={isAccountPaidInMonth(f, currentComp)}
                  onChange={() => handlePaidToggle(f)}
                  className="custom-checkbox"
                />
                Pago
              </label>

              {/* Botões de ação */}
              <div className="flex gap-2">
                <button onClick={() => onEdit(f)}>
                  <Pencil
                    size={16}
                    className="text-slate-400 hover:text-yellow-500"
                  />
                </button>
                <button onClick={() => onCancelToggle(f.id)}>
                  {f.status === 'Pendente' || f.status === 'ativo' ? (
                    <Ban
                      size={16}
                      className="text-slate-400 hover:text-red-600"
                    />
                  ) : (
                    <CheckCircle
                      size={16}
                      className="text-slate-400 hover:text-green-600"
                    />
                  )}
                </button>
                <button onClick={() => setFinancaToDelete(f)}>
                  <Trash2
                    size={16}
                    className="text-slate-400 hover:text-red-600"
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
        {isCollapsed && sortedData.length > 1 && (
          <div className="text-center text-slate-500 dark:text-slate-400 text-sm italic py-2">
            ... e mais {sortedData.length - 1} item(ns)
          </div>
        )}
      </div>

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
            <h2 className="text-lg font-semibold mb-4">Excluir colaborador</h2>
            <p className="mb-6">
              Tem certeza que deseja excluir <b>{title}</b>? Essa ação não pode
              ser desfeita.
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
  );
}
