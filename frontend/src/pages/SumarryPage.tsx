import { useEffect, useMemo, useRef, useState } from 'react';
import SidebarTotalColabs from '../components/SidebarTotalColabs';
import SkeletonCard from '../components/SkeletonCard';
import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Account, Collaborator } from '../lib/types';
import { MONTHS_PT, isAccountPaidInMonth } from '../lib/format';
import { todayComp, monthsDiff } from '../lib/date';
import type { ReactElement } from 'react';
import type { FinanceTableProps } from '../components/FinanceTable';
import FinanceTable from '../components/FinanceTable';
import FinanceDialog from '../components/AddFinanceDialog';
import AddCollaboratorDialog from '../components/AddCollaboratorDialog';
import { Plus, Filter, UserPlus } from 'lucide-react';
import { isVisibleInMonth } from '../lib/storage';
import * as api from '../lib/api';

type DialogState =
  | { mode: 'closed' }
  | { mode: 'addAccount' }
  | { mode: 'editAccount'; account: Account }
  | { mode: 'addCollab' };

function normalizeAccount(a: any): Account {
  return {
    id: String(a.id),
    collaboratorId: String(a.collaboratorId),
    collaboratorName: a.collaboratorName ?? '',
    description: String(a.description ?? ''),
    value: Number(a.value),
    parcelasTotal:
      a.parcelasTotal === '' ||
      a.parcelasTotal === null ||
      a.parcelasTotal === undefined
        ? null
        : Number(a.parcelasTotal),
    month: Math.min(12, Math.max(1, Number(a.month ?? 1))),
    year: Math.max(1900, Number(a.year ?? new Date().getFullYear())),
    status: (a.status as Account['status']) ?? 'Pendente',
    paid: Boolean(a.paid),
    dtPaid: a.dtPaid ?? undefined,
    createdAt: a.createdAt ?? '',
    updatedAt: a.updatedAt ?? '',
    cancelledAt: a.cancelledAt ?? undefined,
    // paidByMonth removido
  };
}

export default function HomePage() {
  const collabRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const [selectedCollab, setSelectedCollab] = useState<string | null>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const sidebar = document.getElementById('sidebar-total-colabs');
      const mainContent = document.getElementById('main-content');
      if (!sidebar || !mainContent) return;
      if (
        !sidebar.contains(e.target as Node) &&
        !mainContent.contains(e.target as Node)
      ) {
        setSelectedCollab(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [selectedCollab]);
  const now = todayComp();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  async function saveCollabOrder(newOrder: string[]) {
    try {
      await api.saveCollabOrder(newOrder);
    } catch (err) {
      console.error('Erro ao salvar ordem dos colaboradores:', err);
    }
  }

  function SortableCollab({
    id,
    children,
  }: {
    id: string;
    children: ReactElement<FinanceTableProps>;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    return (
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.5 : 1,
        }}
      >
        {React.cloneElement(children, {
          dragHandleProps: {
            ...attributes,
            ...listeners,
            style: { cursor: isDragging ? 'grabbing' : 'grab' },
          },
        })}
      </div>
    );
  }
  const [showAll, setShowAll] = useState(false);
  const [showCancelled, setShowCancelled] = useState(true);
  const [showFloatingButton, setShowFloatingButton] = useState(false);

  const [dlg, setDlg] = useState<DialogState>({ mode: 'closed' });
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [collabOrder, setCollabOrder] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  const visibleSnapshotRef = useRef<Account[]>([]);
  const resumoRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getMergedFinances(year, month);
      const normalizedAccounts = (data.accounts as any[]).map(normalizeAccount);
      setAccounts(normalizedAccounts);
      let collabList = (data.collabs as Collaborator[]) || [];
      if (collabList.length && 'orderId' in collabList[0]) {
        collabList = [...collabList].sort((a, b) => {
          const va =
            typeof a.orderId === 'number' ? a.orderId : Number(a.orderId ?? 0);
          const vb =
            typeof b.orderId === 'number' ? b.orderId : Number(b.orderId ?? 0);
          return va - vb;
        });
      }
      setCollabs(collabList);
      setCollabOrder(collabList.map((c) => c.id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [month, year]);

  // Atalho de teclado para adicionar finança (Alt+N)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        setDlg({ mode: 'addAccount' });
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Detecta quando o resumo sair da tela para mostrar botão flutuante
  useEffect(() => {
    const handleScroll = () => {
      if (resumoRef.current) {
        const rect = resumoRef.current.getBoundingClientRect();
        // Se o resumo saiu completamente da tela (top + height < 0)
        const isResumoVisible = rect.bottom > 0;
        setShowFloatingButton(!isResumoVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const visibleAccounts = useMemo(() => {
    let result: Account[] = [];
    if (showAll) {
      accounts.forEach((acc) => {
        if (acc.parcelasTotal === null || acc.parcelasTotal === undefined) {
          result.push(acc);
        } else if (
          typeof acc.parcelasTotal === 'number' &&
          acc.parcelasTotal > 1
        ) {
          for (let i = 0; i < acc.parcelasTotal; i++) {
            result.push({ ...(acc as any), parcelaAtual: i + 1 });
          }
        } else {
          result.push(acc);
        }
      });
    } else {
      const comp = { year, month };
      accounts.forEach((acc) => {
        if (acc.parcelasTotal === null || acc.parcelasTotal === undefined) {
          if (isVisibleInMonth(acc, comp)) {
            result.push(acc);
          }
        } else if (
          typeof acc.parcelasTotal === 'number' &&
          acc.parcelasTotal > 1
        ) {
          const start = { year: acc.year, month: acc.month };
          for (let i = 0; i < acc.parcelasTotal; i++) {
            const parcelaComp = monthsDiff(start, comp);
            if (parcelaComp === i && isVisibleInMonth(acc, comp)) {
              result.push({ ...(acc as any), parcelaAtual: i + 1 });
            }
          }
        } else {
          if (isVisibleInMonth(acc, comp)) {
            result.push(acc);
          }
        }
      });
    }
    if (!showCancelled) {
      result = result.filter((acc) => acc.status !== 'Cancelado');
    }
    return result;
  }, [accounts, year, month, showAll, showCancelled]);

  useEffect(() => {
    if (!loading) {
      visibleSnapshotRef.current = visibleAccounts;
    }
  }, [loading, visibleAccounts]);

  const stableVisible = loading ? visibleSnapshotRef.current : visibleAccounts;

  const byCollab = (id: string) =>
    stableVisible.filter((a) => a.collaboratorId === id);

  const total = stableVisible.reduce((s, a) => s + Number(a.value), 0);
  const totalPendente = stableVisible
    .filter(
      (a) =>
        !isAccountPaidInMonth(a, { year, month }) && a.status !== 'Cancelado'
    ) // Exclui itens cancelados
    .reduce((s, a) => s + Number(a.value), 0);
  const totalPago = stableVisible
    .filter((a) => isAccountPaidInMonth(a, { year, month }))
    .reduce((s, a) => s + Number(a.value), 0);

  async function addOrUpdateAccount(
    payload: Omit<
      Account,
      'id' | 'createdAt' | 'updatedAt' | 'collaboratorName' | 'cancelledAt'
    >,
    idToUpdate?: string
  ) {
    try {
      if (idToUpdate) {
        await api.updateAccount(idToUpdate, payload);
      } else {
        await api.addAccount(payload);
      }
      setDlg({ mode: 'closed' });
      await load();
    } catch (err) {
      console.error('Erro ao salvar conta:', err);
    }
  }

  async function removeAccount(id: string) {
    await api.deleteAccount(id);
    await load();
  }

  async function toggleCancel(id: string) {
    await api.toggleCancel(id, month, year);
    await load();
    const updated = accounts.find((a) => a.id === id);
    if (updated) {
      console.log('Recebido do backend:', {
        id,
        status: updated.status,
        cancelledAt: updated.cancelledAt,
      });
    }
  }

  async function createCollab(name: string) {
    if (collabs.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      alert('Já existe um colaborador com esse nome!');
      return;
    }
    await api.addCollab(name);
    setDlg({ mode: 'closed' });
    await load();
  }
  function handlePaidUpdate(accountId: string, paid: boolean) {
    setAccounts((prev) =>
      prev.map((account) => {
        if (account.id === accountId) {
          // Atualiza o campo dtPaid para contas não-recorrentes
          return {
            ...account,
            dtPaid: paid ? new Date().toISOString() : undefined,
            paid: paid,
          };
        }
        return account;
      })
    );
  }

  return (
    <div className="flex px-4 sm:px-6 lg:px-20 2xl:px-40 gap-6 mx-auto">
      <div id="sidebar-total-colabs" className="hidden md:block">
        <SidebarTotalColabs
          total={total}
          totalPendente={totalPendente}
          totalPago={totalPago}
          collaborators={collabs}
          selectedId={selectedCollab}
          onSelect={(id) => {
            if (selectedCollab === id) {
              setSelectedCollab(null);
              return;
            }
            setSelectedCollab(id);
            setTimeout(() => {
              if (id !== null) {
                const el = collabRefs.current[id];
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }, 100);
          }}
        />
      </div>
      <div id="main-content" className="flex-1 grid gap-6">
        <div
          ref={resumoRef}
          className="border border-slate-300 dark:border-slate-700 shadow-sm rounded-lg bg-white dark:bg-slate-900 p-4"
        >
          <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Filter size={18} className="text-slate-500" /> Resumo
          </h1>

          {/* Filtros + Botões */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2">
              <select
                className="select w-full rounded sm:w-44"
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
                <option value="all">Ver todos os meses</option>
                {MONTHS_PT.map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>

              <input
                className="input w-full sm:w-28"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                disabled={showAll}
              />

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

            {/* Botões (desktop: lado direito) */}
            <div className="flex flex-col sm:flex-row gap-2 md:ml-auto">
              <button
                className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 text-white px-4 py-2 rounded-md transition"
                onClick={() => setDlg({ mode: 'addCollab' })}
              >
                <UserPlus size={18} /> Adicionar colaborador
              </button>
              <button
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
                onClick={() => setDlg({ mode: 'addAccount' })}
                title="Adicionar finança (Alt+N)"
              >
                <Plus size={18} />
                <span>Adicionar finança</span>
              </button>
            </div>
          </div>

          {/* Totais: só no mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 md:hidden">
            <div className="p-3 rounded bg-slate-100 dark:bg-slate-800 text-center">
              <span className="block text-xs uppercase text-slate-500">
                Total
              </span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
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
              <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalPendente)}
              </span>
            </div>
            <div className="p-3 rounded bg-green-100 dark:bg-green-500/20 text-center">
              <span className="block text-xs uppercase text-green-700">
                Pago
              </span>
              <span className="text-lg font-bold text-green-700 dark:text-green-300">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalPago)}
              </span>
            </div>
          </div>
        </div>

        {loading && <SkeletonCard className="mb-4" />}

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={(e) => {
            const { active, over } = e;

            if (!over) return;

            if (active.id !== over.id) {
              const oldIndex = collabOrder.indexOf(String(active.id));
              const newIndex = collabOrder.indexOf(String(over.id));

              if (oldIndex === -1 || newIndex === -1) return;

              const newOrder = arrayMove(collabOrder, oldIndex, newIndex);
              setCollabOrder(newOrder);
              saveCollabOrder(newOrder);
            }
          }}
        >
          <SortableContext
            items={collabOrder}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-6">
              {collabOrder.map((id) => {
                const c = collabs.find((cc) => cc.id === id);
                if (!c) return null;
                return (
                  <div
                    key={c.id}
                    ref={(el) => {
                      collabRefs.current[c.id] = el;
                    }}
                    className={
                      selectedCollab === c.id
                        ? 'border-2 border-blue-500 rounded transition-all'
                        : 'rounded'
                    }
                  >
                    <SortableCollab id={c.id}>
                      <FinanceTable
                        collaboratorId={c.id}
                        title={c.name}
                        items={byCollab(c.id)}
                        currentComp={{ year, month }}
                        onDelete={(id) => removeAccount(id)}
                        onEdit={(account) =>
                          setDlg({ mode: 'editAccount', account })
                        }
                        onCancelToggle={(id) => toggleCancel(id)}
                        onCollabDeleted={async () => {
                          await load();
                        }}
                        onPaidUpdate={handlePaidUpdate}
                      />
                    </SortableCollab>
                  </div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Botão flutuante para adicionar finança */}
      {showFloatingButton && (
        <button
          onClick={() => setDlg({ mode: 'addAccount' })}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50"
          title="Adicionar finança (Alt+N)"
        >
          <Plus size={24} />
        </button>
      )}

      {dlg.mode === 'addCollab' && (
        <AddCollaboratorDialog
          onClose={() => setDlg({ mode: 'closed' })}
          onSave={createCollab}
        />
      )}
      {(dlg.mode === 'addAccount' || dlg.mode === 'editAccount') && (
        <FinanceDialog
          initial={dlg.mode === 'editAccount' ? dlg.account : undefined}
          collaborators={collabs.map((c) => ({ id: c.id, name: c.name }))}
          onSave={addOrUpdateAccount}
          onClose={() => setDlg({ mode: 'closed' })}
        />
      )}
    </div>
  );
}
