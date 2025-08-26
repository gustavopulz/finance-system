import { useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Account, Collaborator } from '../lib/types';
import { MONTHS_PT, brl } from '../lib/format';
import { todayComp, monthsDiff } from '../lib/date';
import FinanceTable from '../components/FinanceTable';
import FinanceDialog from '../components/AddFinanceDialog';
import AddCollaboratorDialog from '../components/AddCollaboratorDialog';
import { Plus, Filter, UserPlus } from 'lucide-react';
import { isVisibleInMonth } from '../lib/storage';
import { willCountInMonth } from '../lib/storage';
import * as api from '../lib/api';

type DialogState =
  | { mode: 'closed' }
  | { mode: 'addAccount' }
  | { mode: 'editAccount'; account: Account }
  | { mode: 'addCollab' };

// Normaliza o que vem do backend (evita “8”/“2025” como string)
// Normaliza o que vem do backend (tolerante a '', null e strings)
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
    status: (a.status as Account['status']) ?? 'ativo',
    createdAt: a.createdAt ?? '',
    updatedAt: a.updatedAt ?? '',
    cancelledAt: a.cancelledAt ?? undefined,
  };
}

export default function HomePage() {
  const now = todayComp();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  // Salva a ordem dos colaboradores no backend
  async function saveCollabOrder(newOrder: string[]) {
    try {
      await api.saveCollabOrder(newOrder);
    } catch (err) {
      console.error('Erro ao salvar ordem dos colaboradores:', err);
    }
  }

  // Componente Sortable para cada colaborador
  function SortableCollab({
    id,
    children,
  }: {
    id: string;
    children: React.ReactNode;
  }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id });
    return (
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        {...attributes}
        {...listeners}
      >
        {children}
      </div>
    );
  }
  const [showAll, setShowAll] = useState(false);
  const [showCancelled, setShowCancelled] = useState(true);

  const [dlg, setDlg] = useState<DialogState>({ mode: 'closed' });
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  // Ordem dos IDs dos colaboradores
  const [collabOrder, setCollabOrder] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  // Mantém um snapshot das contas visíveis para evitar “piscar” enquanto carrega
  const visibleSnapshotRef = useRef<Account[]>([]);

  async function load() {
    setLoading(true);
    try {
      // Busca dados mesclados (colaboradores e contas)
      const data = await api.getMergedFinances();
      // Normaliza contas
      const normalizedAccounts = (data.accounts as any[]).map(normalizeAccount);
      setAccounts(normalizedAccounts);
      // Normaliza colaboradores
      const collabList = (data.collabs as Collaborator[]) || [];
      setCollabs(collabList);
      // Busca ordem salva
      try {
        const orderResp = await api.getCollabOrder();
        if (orderResp && Array.isArray(orderResp.order)) {
          // Garante que só IDs válidos entram
          const validOrder = orderResp.order.filter((id: string) =>
            collabList.some((c) => c.id === id)
          );
          // Adiciona IDs novos ao final
          const missing = collabList
            .map((c) => c.id)
            .filter((id) => !validOrder.includes(id));
          setCollabOrder([...validOrder, ...missing]);
        } else {
          setCollabOrder(collabList.map((c) => c.id));
        }
      } catch {
        setCollabOrder(collabList.map((c) => c.id));
      }
      // Salva a ordem dos colaboradores no backend
      async function saveCollabOrder(newOrder: string[]) {
        try {
          await api.saveCollabOrder(newOrder);
        } catch (err) {
          console.error('Erro ao salvar ordem dos colaboradores:', err);
        }
      }

      // Componente Sortable para cada colaborador
      function SortableCollab({
        id,
        children,
      }: {
        id: string;
        children: React.ReactNode;
      }) {
        const { attributes, listeners, setNodeRef, transform, transition } =
          useSortable({ id });
        return (
          <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            {...attributes}
            {...listeners}
          >
            {children}
          </div>
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  // Gera uma linha para cada parcela ativa de cada conta, criando múltiplas linhas por conta se necessário
  const visibleAccounts = useMemo(() => {
    let result: Account[] = [];
    if (showAll) {
      // Exibe todas as contas, todas as parcelas
      accounts.forEach((acc) => {
        if (acc.parcelasTotal === null || acc.parcelasTotal === undefined) {
          result.push(acc);
        } else if (
          typeof acc.parcelasTotal === 'number' &&
          acc.parcelasTotal > 1
        ) {
          for (let i = 0; i < acc.parcelasTotal; i++) {
            // Cria uma cópia do objeto com info da parcela
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
    // Filtro de cancelados
    if (!showCancelled) {
      result = result.filter((acc) => acc.status !== 'cancelado');
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

  // Soma apenas contas que devem entrar no total do mês
  const totalGeral = stableVisible
    .filter((f) => {
      const comp = { year, month };
      return willCountInMonth(f, comp);
    })
    .reduce((s, a) => s + Number(a.value), 0);

  // CRUD handlers
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
    // Chama o endpoint PATCH (toggleCancel), enviando mês/ano do filtro atual
    await api.toggleCancel(id, month, year);
    await load();
    // Após carregar, loga os dados recebidos
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

  return (
    <div className="grid gap-6">
      <div className="card p-4">
        <div className="flex flex-row items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">Resumo</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-2 text-slate-600">
              <Filter size={16} /> Filtros:
            </span>
            <select
              className="select w-44"
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
              className="input w-28"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              disabled={showAll}
            />
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
              />
              Ver cancelados
            </label>
            <button
              className="btn btn-ghost"
              onClick={() => setDlg({ mode: 'addCollab' })}
            >
              <UserPlus size={18} /> Adicionar colaborador
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setDlg({ mode: 'addAccount' })}
            >
              <Plus size={18} /> Adicionar finança
            </button>
          </div>
        </div>
      </div>

      {/* Cards dinâmicos por colaborador com drag-and-drop */}
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={(e) => {
          const { active, over } = e;
          if (active.id !== over?.id) {
            const oldIndex = collabOrder.indexOf(String(active.id));
            const newIndex = collabOrder.indexOf(String(over?.id));
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
                <SortableCollab key={c.id} id={c.id}>
                  <FinanceTable
                    collaboratorId={c.id}
                    title={c.name}
                    items={byCollab(c.id)}
                    currentComp={{ year, month }}
                    onDelete={(id) => {
                      removeAccount(id);
                    }}
                    onEdit={(account) =>
                      setDlg({ mode: 'editAccount', account })
                    }
                    onCancelToggle={(id) => {
                      toggleCancel(id);
                    }}
                    onCollabDeleted={(id) => {
                      setCollabs((prev) => prev.filter((cc) => cc.id !== id));
                      setCollabOrder((prev) =>
                        prev.filter((cid) => cid !== id)
                      );
                    }}
                  />
                </SortableCollab>
              );
            })}
            {collabs.length === 0 && (
              <div className="card p-6 text-center text-slate-500 dark:text-slate-400 dark:bg-slate-800">
                Nenhum colaborador. Clique em{' '}
                <strong>Adicionar colaborador</strong> para começar.
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <strong>Total (filtrado)</strong>
          <span className="text-lg font-semibold">{brl(totalGeral)}</span>
        </div>
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
