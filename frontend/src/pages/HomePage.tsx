import { useEffect, useMemo, useRef, useState } from "react";
import SidebarTotalColabs from "../components/HomePage/SidebarTotalColabs";
import SkeletonCard from "../components/SkeletonCard";
import React from "react";
import { useNotification } from "../context/NotificationContext";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Account, Collaborator } from "../lib/types";
import { MONTHS_PT, isAccountPaidInMonth } from "../lib/format";
import { todayComp, monthsDiff } from "../lib/date";
import type { ReactElement } from "react";
import type { FinanceTableProps } from "../components/HomePage/FinanceTable";
import FinanceTable from "../components/HomePage/FinanceTable";
import FinanceDialog from "../components/HomePage/AddFinanceDialog";
import AddCollaboratorDialog from "../components/HomePage/AddCollaboratorDialog";
import { Plus } from "lucide-react";
import Summary from "../components/HomePage/Summary";
import { isVisibleInMonth } from "../lib/storage";
import * as api from "../lib/api";

type DialogState =
  | { mode: "closed" }
  | {
      mode: "addAccount";
      initialCollaboratorId?: string;
      account?: Partial<Account>;
    }
  | { mode: "editAccount"; account: Account }
  | { mode: "addCollab" };

function normalizeAccount(a: any): Account {
  const rawPt = a.parcelasTotal;
  let parcelasTotal: number | null;
  if (
    rawPt === "" ||
    rawPt === null ||
    rawPt === undefined ||
    (typeof rawPt === "string" &&
      rawPt.toString().trim().toUpperCase() === "X") ||
    (typeof rawPt === "string" &&
      rawPt.toString().trim().toLowerCase() === "null")
  ) {
    parcelasTotal = null;
  } else {
    const n = Number(rawPt);
    parcelasTotal = Number.isFinite(n) ? n : null;
  }

  let dtPaid: string | undefined = undefined;
  const v = (a as any).dtPaid;
  if (v) {
    if (typeof v === "string") {
      dtPaid = v;
    } else if (v instanceof Date) {
      try {
        dtPaid = v.toISOString();
      } catch {}
    } else if (v && typeof (v as any).toDate === "function") {
      try {
        dtPaid = (v as any).toDate().toISOString();
      } catch {}
    } else if (typeof v === "object") {
      const secs = (v as any)._seconds ?? (v as any).seconds;
      const nanos = (v as any)._nanoseconds ?? (v as any).nanoseconds;
      if (typeof secs === "number") {
        const ms =
          secs * 1000 +
          (typeof nanos === "number" ? Math.floor(nanos / 1e6) : 0);
        try {
          dtPaid = new Date(ms).toISOString();
        } catch {}
      }
    }
  }

  return {
    id: String(a.id),
    collaboratorId: String(a.collaboratorId),
    collaboratorName: a.collaboratorName ?? "",
    description: String(a.description ?? ""),
    value: Number(a.value),
    parcelasTotal,
    month: Math.min(12, Math.max(1, Number(a.month ?? 1))),
    year: Math.max(1900, Number(a.year ?? new Date().getFullYear())),
    status: (a.status as Account["status"]) ?? "Pendente",
    paid: Boolean(a.paid),
    dtPaid,
    createdAt: a.createdAt ?? "",
    updatedAt: a.updatedAt ?? "",
    cancelledAt: a.cancelledAt ?? undefined,
  };
}
export default function HomePage() {
  // Modo de edição de ordem de colaboradores
  const [editOrderMode, setEditOrderMode] = useState(false);
  const COMPACT_TABLE_KEY = "compact_table";
  const [compactTable, setCompactTable] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COMPACT_TABLE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [collapsedStateBackup, setCollapsedStateBackup] = useState<{
    [collabId: string]: boolean;
  }>({});

  function handleToggleCompactTable() {
    setCompactTable((prev) => {
      const next = !prev;
      try {
        if (next) localStorage.setItem(COMPACT_TABLE_KEY, "true");
        else localStorage.removeItem(COMPACT_TABLE_KEY);
      } catch {}
      return next;
    });
  }

  // Função para obter o estado de colapso de cada colaborador
  function getAllCollabsCollapseState() {
    const state: { [collabId: string]: boolean } = {};
    collabs.forEach((c) => {
      const saved = localStorage.getItem(`collapse_${c.id}`);
      state[c.id] = saved === "true";
    });
    return state;
  }

  // Função para forçar o colapso de todos os colaboradores
  function forceCollapseAllCollabs() {
    collabs.forEach((c) => {
      localStorage.setItem(`collapse_${c.id}`, "true");
    });
  }

  // Função para restaurar o estado de colapso salvo
  function restoreCollapseState(state: { [collabId: string]: boolean }) {
    Object.entries(state).forEach(([id, collapsed]) => {
      localStorage.setItem(`collapse_${id}`, collapsed ? "true" : "false");
    });
  }

  // Handler do botão Personalizar Ordem
  function handleToggleEditOrderMode() {
    if (!editOrderMode) {
      // Ativar modo edição: salvar estado, colapsar todos, ativar drag, notificar
      setCollapsedStateBackup(getAllCollabsCollapseState());
      forceCollapseAllCollabs();
      setEditOrderMode(true);
      notify("Modo de edição de colaborador ativado!", "success");
    } else {
      // Desativar: restaurar estado, desativar drag, notificar
      restoreCollapseState(collapsedStateBackup);
      setEditOrderMode(false);
      notify("Modo de edição de colaborador desativado!", "info");
    }
  }

  // Estado de seleção múltipla global para todos os FinanceTable
  // Seleção individual por colaborador
  const [selectedItems, setSelectedItems] = useState<{
    [collabId: string]: Set<string>;
  }>({});

  // Funções auxiliares para seleção múltipla por colaborador
  const toggleItemSelection = (collabId: string, itemId: string) => {
    setSelectedItems((prev) => {
      const prevSet = prev[collabId] || new Set();
      const newSet = new Set(prevSet);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return { ...prev, [collabId]: newSet };
    });
  };

  const toggleSelectAll = (collabId: string, ids: string[]) => {
    setSelectedItems((prev) => {
      const prevSet = prev[collabId] || new Set();
      if (prevSet.size === ids.length) {
        return { ...prev, [collabId]: new Set() };
      } else {
        return { ...prev, [collabId]: new Set(ids) };
      }
    });
  };

  const clearSelection = (collabId: string) => {
    setSelectedItems((prev) => ({ ...prev, [collabId]: new Set() }));
  };
  const { notify } = useNotification();
  const collabRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const [selectedCollab, setSelectedCollab] = useState<string | null>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const sidebar = document.getElementById("sidebar-total-colabs");
      const mainContent = document.getElementById("main-content");
      if (!sidebar || !mainContent) return;
      if (
        !sidebar.contains(e.target as Node) &&
        !mainContent.contains(e.target as Node)
      ) {
        setSelectedCollab(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [selectedCollab]);
  const now = todayComp();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  async function saveCollabOrder(newOrder: string[]) {
    try {
      await api.saveCollabOrder(newOrder);
    } catch (err) {
      console.error("Erro ao salvar ordem dos colaboradores:", err);
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
            style: { cursor: isDragging ? "grabbing" : "grab" },
          },
        })}
      </div>
    );
  }
  const [showAll, setShowAll] = useState(false);
  const [showCancelled, setShowCancelled] = useState(true);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [dlg, setDlg] = useState<DialogState>({ mode: "closed" });
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [collabOrder, setCollabOrder] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  const [filterDesc, setFilterDesc] = useState("");
  const [filterValor, setFilterValor] = useState("");
  const [filterParcela, setFilterParcela] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const visibleSnapshotRef = useRef<Account[]>([]);
  const resumoRef = useRef<HTMLDivElement>(null);

  const [hiddenCollabs, setHiddenCollabs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("hiddenCollabs");
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
      localStorage.setItem("hiddenCollabs", JSON.stringify(updated));
      return updated;
    });
  }

  useEffect(() => {
    function syncHiddenCollabs() {
      try {
        const saved = localStorage.getItem("hiddenCollabs");
        setHiddenCollabs(saved ? JSON.parse(saved) : []);
      } catch {}
    }
    window.addEventListener("storage", syncHiddenCollabs);
    window.addEventListener("hiddenCollabsChanged", syncHiddenCollabs);
    return () => {
      window.removeEventListener("storage", syncHiddenCollabs);
      window.removeEventListener("hiddenCollabsChanged", syncHiddenCollabs);
    };
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getMergedFinances(year, month);
      const normalizedAccounts = (data.accounts as any[]).map(normalizeAccount);
      setAccounts(normalizedAccounts);
      let collabList = (data.collabs as Collaborator[]) || [];
      if (collabList.length && "orderId" in collabList[0]) {
        collabList = [...collabList].sort((a, b) => {
          const va =
            typeof a.orderId === "number" ? a.orderId : Number(a.orderId ?? 0);
          const vb =
            typeof b.orderId === "number" ? b.orderId : Number(b.orderId ?? 0);
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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key === "n") {
        e.preventDefault();
        setDlg({ mode: "addAccount" });
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (resumoRef.current) {
        const rect = resumoRef.current.getBoundingClientRect();
        const isResumoVisible = rect.bottom > 0;
        setShowFloatingButton(!isResumoVisible);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const visibleAccounts = useMemo(() => {
    let result: Account[] = [];
    if (showAll) {
      accounts.forEach((acc) => {
        if (acc.parcelasTotal === null || acc.parcelasTotal === undefined) {
          result.push(acc);
        } else if (
          typeof acc.parcelasTotal === "number" &&
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
          typeof acc.parcelasTotal === "number" &&
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
      result = result.filter((acc) => acc.status !== "Cancelado");
    }

    if (filterDesc.trim()) {
      result = result.filter((acc) =>
        acc.description.toLowerCase().includes(filterDesc.trim().toLowerCase())
      );
    }

    if (filterValor.trim()) {
      result = result.filter(
        (acc) => Number(acc.value) === Number(filterValor)
      );
    }

    if (filterParcela) {
      if (filterParcela === "avulso") {
        result = result.filter(
          (acc) => acc.parcelasTotal === 0 || acc.parcelasTotal === 1
        );
      } else if (filterParcela === "fixo") {
        result = result.filter(
          (acc) => acc.parcelasTotal === null || acc.parcelasTotal === undefined
        );
      } else {
        result = result.filter(
          (acc) =>
            typeof (acc as any).parcelaAtual !== "undefined" &&
            (acc as any).parcelaAtual === Number(filterParcela)
        );
      }
    }
    // Filtro de status
    if (typeof filterStatus !== "undefined" && filterStatus !== "") {
      result = result.filter((item) => {
        if (filterStatus === "Pago")
          return isAccountPaidInMonth(item, { year, month });
        if (filterStatus === "Pendente")
          return (
            !isAccountPaidInMonth(item, { year, month }) &&
            item.status !== "Cancelado"
          );
        if (filterStatus === "Cancelado") return item.status === "Cancelado";
        if (filterStatus === "Futuro") {
          if (item.dtPaid) {
            const paidDate = new Date(item.dtPaid);
            const paidYear = paidDate.getFullYear();
            const paidMonth = paidDate.getMonth() + 1;
            return paidYear > year || (paidYear === year && paidMonth > month);
          }
          return false;
        }
        return true;
      });
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
    filterStatus,
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
        !isAccountPaidInMonth(a, { year, month }) && a.status !== "Cancelado"
    )
    .reduce((s, a) => s + Number(a.value), 0);
  const totalPago = stableVisible
    .filter((a) => isAccountPaidInMonth(a, { year, month }))
    .reduce((s, a) => s + Number(a.value), 0);

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
        !isAccountPaidInMonth(a, { year, month }) && a.status !== "Cancelado"
    )
    .reduce((s, a) => s + Number(a.value), 0);
  const totalPagoSidebar = visibleAccountsForSidebar
    .filter((a) => isAccountPaidInMonth(a, { year, month }))
    .reduce((s, a) => s + Number(a.value), 0);

  async function addOrUpdateAccount(
    payload: Omit<
      Account,
      "id" | "createdAt" | "updatedAt" | "collaboratorName" | "cancelledAt"
    >,
    idToUpdate?: string
  ) {
    try {
      if (idToUpdate) {
        await api.updateAccount(idToUpdate, payload);
      } else {
        await api.addAccount(payload);
      }
      setDlg({ mode: "closed" });
      await load();
    } catch (err) {
      console.error("Erro ao salvar conta:", err);
    }
  }

  async function removeAccount(id: string | string[]) {
    const ids = Array.isArray(id) ? id : [id];

    let desc = "";
    if (ids.length === 1) {
      const acc = accounts.find((a) => a.id === ids[0]);
      if (acc) desc = acc.description;
    }
    await api.deleteAccount(ids);
    notify(
      ids.length === 1 && desc
        ? `Finança "${desc}" removida com sucesso!`
        : `Finanças removidas com sucesso!`,
      "success"
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
      notify("Já existe um colaborador com esse nome!", "error");
      return;
    }
    await api.addCollab(name);
    notify(`Colaborador "${name}" criado com sucesso!`, "success");
    setDlg({ mode: "closed" });
    await load();
  }
  function handlePaidUpdate(accountId: string, paid: boolean) {
    setAccounts((prev) =>
      prev.map((account) => {
        if (account.id === accountId) {
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

  async function handleCollabDeleted(collabId: string) {
    const collab = collabs.find((c) => c.id === collabId);
    notify(
      collab
        ? `Colaborador "${collab.name}" removido com sucesso!`
        : "Colaborador removido com sucesso!",
      "success"
    );
    await load();
  }

  // Se o usuário expandir manualmente um colaborador durante o modo edição, desativa o modo e restaura o estado
  function handleCollabExpandDuringEdit() {
    if (editOrderMode) {
      restoreCollapseState(collapsedStateBackup);
      setEditOrderMode(false);
      notify("Modo de edição de colaborador desativado!", "info");
    }
  }

  return (
    <div className="flex items-start px-4 sm:px-6 lg:px-20 gap-6 mx-auto">
      {sidebarOpen && (
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
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }
              }, 100);
            }}
            hiddenCollabs={hiddenCollabs}
            onToggleCollabVisibility={toggleCollabVisibility}
            onAddFinance={(collabId) => {
              setDlg({ mode: "addAccount", initialCollaboratorId: collabId });
            }}
            onAddCollaborator={() => setDlg({ mode: "addCollab" })}
            month={month}
            year={year}
            onChangeMonthYear={(m, y) => {
              setMonth(m);
              setYear(y);
            }}
            // Novas props para total selecionado
            selectedItems={selectedItems}
            accountsByCollab={collabs.reduce((acc, c) => {
              acc[c.id] = byCollab(c.id);
              return acc;
            }, {} as { [collabId: string]: Account[] })}
          />
        </div>
      )}

      <div className="hidden md:block sticky top-6 h-screen mx-2">
        <div className="relative h-full">
          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-slate-300 dark:bg-slate-700" />
          <button
            aria-label={sidebarOpen ? "Fechar sidebar" : "Abrir sidebar"}
            onClick={() => setSidebarOpen((s) => !s)}
            className="absolute z-10 p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition left-1/2 top-3 -translate-x-1/2"
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
              className="text-slate-700 dark:text-slate-200"
            >
              {sidebarOpen ? (
                <polyline points="15 18 9 12 15 6"></polyline>
              ) : (
                <polyline points="9 18 15 12 9 6"></polyline>
              )}
            </svg>
          </button>
        </div>
      </div>
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
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            compactTable={compactTable}
            onToggleCompactTable={handleToggleCompactTable}
            editOrderMode={editOrderMode}
            onToggleEditOrderMode={handleToggleEditOrderMode}
          />
        </div>

        {loading && <SkeletonCard className="mb-4" />}

        {editOrderMode ? (
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
              <div className="flex flex-col gap-6 relative z-10">
                {/* ...background gradients... */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 overflow-hidden -z-10"
                >
                  <div className="absolute left-1/2 top-[15%] -translate-x-1/2 w-[1000px] h-[1000px] rounded-full bg-gradient-to-br from-blue-700/20 via-blue-800/10 to-transparent  dark:from-blue-900/25 dark:via-blue-800/15 dark:to-transparent  blur-[120px]" />
                  <div className="absolute left-[65%] top-[95%] -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-blue-700/16 via-blue-800/10 to-transparent  dark:from-blue-900/20 dark:via-blue-800/12 dark:to-transparent  blur-[100px]" />
                  <div
                    className="absolute left-[30%] top-[175%] -translate-x-1/2 w-[600px] h-[600px] rounded-full 
                    bg-gradient-to-tr from-blue-600/12 via-blue-700/8 to-transparent 
                    dark:from-blue-900/16 dark:via-blue-800/10 dark:to-transparent 
                    blur-[90px]"
                  />
                </div>
                {collabOrder.map((id) => {
                  const c = collabs.find((cc) => cc.id === id);
                  if (!c) return null;
                  if (hiddenCollabs.includes(c.id)) return null;
                  const items = byCollab(c.id);
                  const selectedSet = selectedItems[c.id] || new Set();
                  return (
                    <div
                      key={c.id}
                      ref={(el) => {
                        collabRefs.current[c.id] = el;
                      }}
                      className={
                        selectedCollab === c.id
                          ? "border-2 border-blue-500 rounded transition-all"
                          : "rounded"
                      }
                    >
                      <SortableCollab id={c.id}>
                        <FinanceTable
                          collaboratorId={c.id}
                          title={c.name}
                          compact={compactTable}
                          items={items}
                          currentComp={{ year, month }}
                          onDelete={(id) => removeAccount(id)}
                          onEdit={(account) =>
                            setDlg({ mode: "editAccount", account })
                          }
                          onDuplicate={(account) => {
                            const {
                              id,
                              createdAt,
                              updatedAt,
                              cancelledAt,
                              ...rest
                            } = account;
                            setDlg({
                              mode: "addAccount",
                              account: { ...rest },
                            });
                          }}
                          onCancelToggle={(id) => toggleCancel(id)}
                          onCollabDeleted={async (collabId) => {
                            await handleCollabDeleted(collabId);
                          }}
                          onPaidUpdate={handlePaidUpdate}
                          selectedItems={selectedSet}
                          toggleItemSelection={(itemId) =>
                            toggleItemSelection(c.id, itemId)
                          }
                          toggleSelectAll={() =>
                            toggleSelectAll(
                              c.id,
                              items.map((item) => item.id)
                            )
                          }
                          clearSelection={() => clearSelection(c.id)}
                          forceCollapse={true}
                          onExpandDuringEdit={() =>
                            handleCollabExpandDuringEdit()
                          }
                        />
                      </SortableCollab>
                    </div>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          // Drag-and-drop desativado quando não está em modo de edição
          <div className="flex flex-col gap-6 relative z-10">
            {/* ...background gradients... */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden -z-10"
            >
              <div className="absolute left-1/2 top-[15%] -translate-x-1/2 w-[1000px] h-[1000px] rounded-full bg-gradient-to-br from-blue-700/20 via-blue-800/10 to-transparent  dark:from-blue-900/25 dark:via-blue-800/15 dark:to-transparent  blur-[120px]" />
              <div className="absolute left-[65%] top-[95%] -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-blue-700/16 via-blue-800/10 to-transparent  dark:from-blue-900/20 dark:via-blue-800/12 dark:to-transparent  blur-[100px]" />
              <div
                className="absolute left-[30%] top-[175%] -translate-x-1/2 w-[600px] h-[600px] rounded-full 
                bg-gradient-to-tr from-blue-600/12 via-blue-700/8 to-transparent 
                dark:from-blue-900/16 dark:via-blue-800/10 dark:to-transparent 
                blur-[90px]"
              />
            </div>
            {collabOrder.map((id) => {
              const c = collabs.find((cc) => cc.id === id);
              if (!c) return null;
              if (hiddenCollabs.includes(c.id)) return null;
              const items = byCollab(c.id);
              const selectedSet = selectedItems[c.id] || new Set();
              return (
                <div
                  key={c.id}
                  ref={(el) => {
                    collabRefs.current[c.id] = el;
                  }}
                  className={
                    selectedCollab === c.id
                      ? "border-2 border-blue-500 rounded transition-all"
                      : "rounded"
                  }
                >
                  <FinanceTable
                    collaboratorId={c.id}
                    title={c.name}
                    compact={compactTable}
                    items={items}
                    currentComp={{ year, month }}
                    onDelete={(id) => removeAccount(id)}
                    onEdit={(account) =>
                      setDlg({ mode: "editAccount", account })
                    }
                    onDuplicate={(account) => {
                      const { id, createdAt, updatedAt, cancelledAt, ...rest } =
                        account;
                      setDlg({
                        mode: "addAccount",
                        account: { ...rest },
                      });
                    }}
                    onCancelToggle={(id) => toggleCancel(id)}
                    onCollabDeleted={async (collabId) => {
                      await handleCollabDeleted(collabId);
                    }}
                    onPaidUpdate={handlePaidUpdate}
                    selectedItems={selectedSet}
                    toggleItemSelection={(itemId) =>
                      toggleItemSelection(c.id, itemId)
                    }
                    toggleSelectAll={() =>
                      toggleSelectAll(
                        c.id,
                        items.map((item) => item.id)
                      )
                    }
                    clearSelection={() => clearSelection(c.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Botões flutuantes */}
      {showFloatingButton && (
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-50">
          <div className="relative">
            <button
              onClick={() => setDlg({ mode: "addAccount" })}
              className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
              title="Adicionar finança (Alt+N)"
            >
              <Plus size={24} />
            </button>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
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

      {dlg.mode === "addCollab" && (
        <AddCollaboratorDialog
          onClose={() => setDlg({ mode: "closed" })}
          onSave={createCollab}
        />
      )}
      {(dlg.mode === "addAccount" || dlg.mode === "editAccount") && (
        <FinanceDialog
          initial={
            dlg.mode === "editAccount"
              ? dlg.account
              : dlg.mode === "addAccount" && dlg.account
              ? {
                  id: "",
                  collaboratorId:
                    dlg.account.collaboratorId || collabs[0]?.id || "",
                  collaboratorName: dlg.account.collaboratorName || "",
                  description: dlg.account.description || "",
                  value: dlg.account.value ?? 0,
                  parcelasTotal: dlg.account.parcelasTotal ?? null,
                  month: dlg.account.month ?? month,
                  year: dlg.account.year ?? year,
                  status: dlg.account.status || "Pendente",
                  paid: dlg.account.paid ?? false,
                  dtPaid: dlg.account.dtPaid || "",
                  createdAt: "",
                  updatedAt: "",
                  cancelledAt: undefined,
                }
              : undefined
          }
          mode={
            dlg.mode === "addAccount" && dlg.account ? "duplicate" : dlg.mode
          }
          collaborators={collabs.map((c) => ({ id: c.id, name: c.name }))}
          filteredMonth={month}
          filteredYear={year}
          initialCollaboratorId={
            dlg.mode === "addAccount" ? dlg.initialCollaboratorId : undefined
          }
          onSave={addOrUpdateAccount}
          onClose={() => setDlg({ mode: "closed" })}
        />
      )}
    </div>
  );
}
