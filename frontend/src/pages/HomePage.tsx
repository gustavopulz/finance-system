import { useEffect, useMemo, useRef, useState } from 'react';
import SidebarTotalColabs from '../components/HomePage/SidebarTotalColabs';
import SkeletonCard from '../components/SkeletonCard';
import React from 'react';
import { useNotification } from '../context/NotificationContext';
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
import type { FinanceTableProps } from '../components/HomePage/FinanceTable';
import FinanceTable from '../components/HomePage/FinanceTable';
import FinanceDialog from '../components/HomePage/AddFinanceDialog';
import AddCollaboratorDialog from '../components/HomePage/AddCollaboratorDialog';
import { Plus } from 'lucide-react';
import Summary from '../components/HomePage/Summary';
import { isVisibleInMonth } from '../lib/storage';
import * as api from '../lib/api';

type DialogState =
  | { mode: 'closed' }
  | { mode: 'addAccount'; initialCollaboratorId?: string }
  | { mode: 'editAccount'; account: Account }
  | { mode: 'addCollab' };

function normalizeAccount(a: any): Account {
  // parcelasTotal: normaliza 'X', 'null', vazio e NaN como fixo (null)
  const rawPt = a.parcelasTotal;
  let parcelasTotal: number | null;
  if (
    rawPt === '' ||
    rawPt === null ||
    rawPt === undefined ||
    (typeof rawPt === 'string' &&
      rawPt.toString().trim().toUpperCase() === 'X') ||
    (typeof rawPt === 'string' &&
      rawPt.toString().trim().toLowerCase() === 'null')
  ) {
    parcelasTotal = null;
  } else {
    const n = Number(rawPt);
    parcelasTotal = Number.isFinite(n) ? n : null;
  }

  // dtPaid: garante string ISO quando vier como Timestamp/Date/objeto
  let dtPaid: string | undefined = undefined;
  const v = (a as any).dtPaid;
  if (v) {
    if (typeof v === 'string') {
      dtPaid = v;
    } else if (v instanceof Date) {
      try {
        dtPaid = v.toISOString();
      } catch {}
    } else if (v && typeof (v as any).toDate === 'function') {
      try {
        dtPaid = (v as any).toDate().toISOString();
      } catch {}
    } else if (typeof v === 'object') {
      const secs = (v as any)._seconds ?? (v as any).seconds;
      const nanos = (v as any)._nanoseconds ?? (v as any).nanoseconds;
      if (typeof secs === 'number') {
        const ms =
          secs * 1000 +
          (typeof nanos === 'number' ? Math.floor(nanos / 1e6) : 0);
        try {
          dtPaid = new Date(ms).toISOString();
        } catch {}
      }
    }
  }

  return {
    id: String(a.id),
    collaboratorId: String(a.collaboratorId),
    collaboratorName: a.collaboratorName ?? '',
    description: String(a.description ?? ''),
    value: Number(a.value),
    parcelasTotal,
    month: Math.min(12, Math.max(1, Number(a.month ?? 1))),
    year: Math.max(1900, Number(a.year ?? new Date().getFullYear())),
    status: (a.status as Account['status']) ?? 'Pendente',
    paid: Boolean(a.paid),
    dtPaid,
    createdAt: a.createdAt ?? '',
    updatedAt: a.updatedAt ?? '',
    cancelledAt: a.cancelledAt ?? undefined,
    // paidByMonth removido
  };
}
export default function HomePage() {
  const { notify } = useNotification();
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

  const [filterDesc, setFilterDesc] = useState('');
  const [filterValor, setFilterValor] = useState('');
  const [filterParcela, setFilterParcela] = useState('');

  const visibleSnapshotRef = useRef<Account[]>([]);
  const resumoRef = useRef<HTMLDivElement>(null);

  // Colaboradores ocultos (centralizado)
  const [hiddenCollabs, setHiddenCollabs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hiddenCollabs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  function toggleCollabVisibility(id: string) {
    setHiddenCollabs((prev) => {
      let updated: string[];
      if (prev.includes(id)) {
        updated = prev.filter((cid) => cid !== id);
      } else {
        updated = [...prev, id];
      }
      localStorage.setItem('hiddenCollabs', JSON.stringify(updated));
      return updated;
    });
  }

  // Atualiza ao mudar no localStorage
  useEffect(() => {
    function syncHiddenCollabs() {
      try {
        const saved = localStorage.getItem('hiddenCollabs');
        setHiddenCollabs(saved ? JSON.parse(saved) : []);
      } catch {}
    }
    window.addEventListener('storage', syncHiddenCollabs);
    window.addEventListener('hiddenCollabsChanged', syncHiddenCollabs);
    return () => {
      window.removeEventListener('storage', syncHiddenCollabs);
      window.removeEventListener('hiddenCollabsChanged', syncHiddenCollabs);
    };
  }, []);

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
    // Filtro de descrição
    if (filterDesc.trim()) {
      result = result.filter((acc) =>
        acc.description.toLowerCase().includes(filterDesc.trim().toLowerCase())
      );
    }
    // Filtro de valor
    if (filterValor.trim()) {
      result = result.filter(
        (acc) => Number(acc.value) === Number(filterValor)
      );
    }
    // Filtro de parcela
    if (filterParcela) {
      if (filterParcela === 'avulso') {
        result = result.filter(
          (acc) => acc.parcelasTotal === 0 || acc.parcelasTotal === 1
        );
      } else if (filterParcela === 'fixo') {
        result = result.filter(
          (acc) => acc.parcelasTotal === null || acc.parcelasTotal === undefined
        );
      } else {
        result = result.filter(
          (acc) =>
            typeof (acc as any).parcelaAtual !== 'undefined' &&
            (acc as any).parcelaAtual === Number(filterParcela)
        );
      }
    }
    return result;
  }, [
    accounts,
    year,
    month,
    showAll,
    showCancelled,
    filterDesc,
    filterValor,
    filterParcela,
  ]);

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

  // Filtra contas dos colaboradores visíveis
  const visibleCollabIds = collabs
    .map((c) => c.id)
    .filter((id) => !hiddenCollabs.includes(id));
  const visibleAccountsForSidebar = stableVisible.filter((acc) =>
    visibleCollabIds.includes(acc.collaboratorId)
  );
  const totalSidebar = visibleAccountsForSidebar.reduce(
    (s, a) => s + Number(a.value),
    0
  );
  const totalPendenteSidebar = visibleAccountsForSidebar
    .filter(
      (a) =>
        !isAccountPaidInMonth(a, { year, month }) && a.status !== 'Cancelado'
    )
    .reduce((s, a) => s + Number(a.value), 0);
  const totalPagoSidebar = visibleAccountsForSidebar
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

  async function removeAccount(id: string | string[]) {
    const ids = Array.isArray(id) ? id : [id];
    // Busca descrição da(s) finança(s)
    let desc = '';
    if (ids.length === 1) {
      const acc = accounts.find((a) => a.id === ids[0]);
      if (acc) desc = acc.description;
    }
    await api.deleteAccount(ids);
    notify(
      ids.length === 1 && desc
        ? `Finança "${desc}" removida com sucesso!`
        : `Finanças removidas com sucesso!`,
      'success'
    );
    await load();
  }

  async function toggleCancel(id: string) {
    await api.toggleCancel(id, month, year);
    await load();
    const updated = accounts.find((a) => a.id === id);
    if (updated) {
    }
  }

  async function createCollab(name: string) {
    if (collabs.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      notify('Já existe um colaborador com esse nome!', 'error');
      return;
    }
    await api.addCollab(name);
    notify(`Colaborador "${name}" criado com sucesso!`, 'success');
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

  // Notificação melhorada para colaborador removido
  async function handleCollabDeleted(collabId: string) {
    const collab = collabs.find((c) => c.id === collabId);
    notify(
      collab
        ? `Colaborador "${collab.name}" removido com sucesso!`
        : 'Colaborador removido com sucesso!',
      'success'
    );
    await load();
  }

  return (
    <div className="flex items-start px-4 sm:px-6 lg:px-20 2xl:px-40 gap-6 mx-auto">
      <div
        id="sidebar-total-colabs"
        className="hidden md:block sticky top-6 h-screen"
      >
        <SidebarTotalColabs
          total={totalSidebar}
          totalPendente={totalPendenteSidebar}
          totalPago={totalPagoSidebar}
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
          hiddenCollabs={hiddenCollabs}
          onToggleCollabVisibility={toggleCollabVisibility}
          onAddFinance={(collabId) => {
            setDlg({ mode: 'addAccount', initialCollaboratorId: collabId });
          }}
        />
      </div>
      <div className="w-px bg-slate-300 dark:bg-slate-700 mx-2 self-stretch hidden md:block" />
      <div id="main-content" className="flex-1 grid gap-6">
        <div ref={resumoRef}>
          <Summary
            total={total}
            totalPendente={totalPendente}
            totalPago={totalPago}
            showCancelled={showCancelled}
            setShowCancelled={setShowCancelled}
            setDlg={setDlg}
            setMonth={setMonth}
            setShowAll={setShowAll}
            showAll={showAll}
            month={month}
            year={year}
            setYear={setYear}
            filterDesc={filterDesc}
            setFilterDesc={setFilterDesc}
            filterValor={filterValor}
            setFilterValor={setFilterValor}
            filterParcela={filterParcela}
            setFilterParcela={setFilterParcela}
            MONTHS_PT={MONTHS_PT}
          />
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
                if (hiddenCollabs.includes(c.id)) return null;
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
                        onCollabDeleted={async (collabId) => {
                          await handleCollabDeleted(collabId);
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

      {/* Botões flutuantes */}
      {showFloatingButton && (
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-50">
          {/* Wrapper para posicionar o up na diagonal */}
          <div className="relative">
            {/* Botão de adicionar finança */}
            <button
              onClick={() => setDlg({ mode: 'addAccount' })}
              className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
              title="Adicionar finança (Alt+N)"
            >
              <Plus size={24} />
            </button>

            {/* Botão de voltar ao topo (menor e na diagonal) */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="absolute -top-3 -left-3 w-8 h-8 bg-slate-200 hover:bg-slate-300 text-blue-700 rounded-full shadow-md transition-all duration-300 flex items-center justify-center border border-blue-400"
              title="Voltar ao topo"
              aria-label="Voltar ao topo"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
          </div>
        </div>
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
          filteredMonth={month}
          filteredYear={year}
          initialCollaboratorId={
            dlg.mode === 'addAccount' ? dlg.initialCollaboratorId : undefined
          }
          onSave={addOrUpdateAccount}
          onClose={() => setDlg({ mode: 'closed' })}
        />
      )}
    </div>
  );
}
