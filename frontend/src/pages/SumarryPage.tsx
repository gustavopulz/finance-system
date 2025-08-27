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
import { MONTHS_PT } from '../lib/format';
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
    createdAt: a.createdAt ?? '',
    updatedAt: a.updatedAt ?? '',
    cancelledAt: a.cancelledAt ?? undefined,
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

  const [dlg, setDlg] = useState<DialogState>({ mode: 'closed' });
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [collabOrder, setCollabOrder] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  const visibleSnapshotRef = useRef<Account[]>([]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getMergedFinances();
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
    .filter((a) => !a.paid && a.status !== 'Cancelado') // Exclui itens cancelados
    .reduce((s, a) => s + Number(a.value), 0);
  const totalPago = stableVisible
    .filter((a) => a.paid)
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
      prev.map((account) =>
        account.id === accountId ? { ...account, paid } : account
      )
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
        <div className="border border-slate-300 dark:border-slate-700 shadow-sm rounded p-4">
          <h1 className="text-xl font-bold mb-4">Resumo</h1>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 text-slate-600">
                <Filter size={16} /> Filtros:
              </span>
              <select
                className="select w-full sm:w-44"
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCancelled}
                  onChange={(e) => setShowCancelled(e.target.checked)}
                  className="custom-checkbox"
                />
                <span className="text-slate-300">Ver Cancelados</span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                className="btn btn-ghost justify-center"
                onClick={() => setDlg({ mode: 'addCollab' })}
              >
                <UserPlus size={18} /> Adicionar colaborador
              </button>
              <button
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                onClick={() => setDlg({ mode: 'addAccount' })}
              >
                <Plus size={18} />
                <span>Adicionar finança</span>
              </button>
            </div>
          </div>
        </div>

        {loading && <SkeletonCard className="mb-4" />}

        <div className="md:hidden card p-4">
          <h2 className="text-lg font-bold mb-3">Totais</h2>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(total)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-600">Pendente:</span>
              <span className="font-semibold text-yellow-700 dark:text-yellow-300">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalPendente)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-600">Pago:</span>
              <span className="font-semibold text-green-700 dark:text-green-300">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalPago)}
              </span>
            </div>
          </div>
        </div>

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
                        ? 'border-2 border-blue-500 rounded-xl transition-all'
                        : 'rounded-xl'
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
