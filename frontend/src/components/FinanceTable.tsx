import { parcelaLabel, brl } from '../lib/format';
import { updateAccount, deleteCollab } from '../lib/api';
import type { Account } from '../lib/types';
import { Trash2, Pencil, Ban, CheckCircle, GripVertical } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

export interface FinanceTableProps {
  collaboratorId: string;
  title: string;
  items: Account[];
  currentComp: { year: number; month: number };
  onDelete: (id: string) => void;
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
  const [sortKey] = useState<SortKey>('description');
  const [sortOrder] = useState<'asc' | 'desc'>('asc');
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [financaToDelete, setFinancaToDelete] = useState<Account | null>(null);
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    financa: Account | null;
  }>({ open: false, financa: null });

  // 🚀 Corrige zoom absurdo no drag preview
  function handleDragStart(e: React.DragEvent) {
    const ghost = document.createElement('div');
    ghost.style.width = '1px';
    ghost.style.height = '1px';
    ghost.style.background = 'transparent';

    document.body.appendChild(ghost);
    e.dataTransfer?.setDragImage(ghost, 0, 0);

    setTimeout(() => {
      document.body.removeChild(ghost);
    }, 0);
  }

  // Atualiza localItems quando items mudar
  useEffect(() => {
    setLocalItems((prev) => {
      if (prev.length === 0 || prev.length !== items.length) return items;
      return prev.map((item) => items.find((i) => i.id === item.id) || item);
    });
  }, [items]);

  // Reaplica a ordenação após atualizações
  useEffect(() => {
    setLocalItems(() => {
      const updatedItems = [...items];
      updatedItems.sort((a, b) => {
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
            const la = parcelaLabel(a, currentComp);
            const lb = parcelaLabel(b, currentComp);
            va =
              la === 'Indeterminada'
                ? Number.MAX_SAFE_INTEGER
                : Number(la.split('/')[0]) || 0;
            vb =
              lb === 'Indeterminada'
                ? Number.MAX_SAFE_INTEGER
                : Number(lb.split('/')[0]) || 0;
            break;
          }
          default:
            va = a.description.toLowerCase();
            vb = b.description.toLowerCase();
        }
        if (va < vb) return sortOrder === 'asc' ? -1 : 1;
        if (va > vb) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
      return updatedItems;
    });
  }, [items, sortKey, sortOrder, currentComp]);

  // Totais
  const total = localItems.reduce((acc, f) => acc + Number(f.value), 0);
  const totalPendente = localItems
    .filter((f) => !f.paid && f.status !== 'Cancelado')
    .reduce((acc, f) => acc + Number(f.value), 0);
  const totalPago = localItems
    .filter((f) => f.paid)
    .reduce((acc, f) => acc + Number(f.value), 0);

  async function handlePaidToggle(account: Account) {
    try {
      const newPaid = !account.paid;
      await updateAccount(account.id, { paid: newPaid });
      setLocalItems((prev) =>
        prev.map((item) =>
          item.id === account.id ? { ...item, paid: newPaid } : item
        )
      );
      onPaidUpdate?.(account.id, newPaid);
      setToast(`Finança marcada como ${newPaid ? 'paga' : 'não paga'} ✅`);
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      console.error('Erro ao marcar como pago:', e);
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
    if (account.paid) {
      return (
        <span className="badge bg-green-100 dark:bg-green-500/30 text-green-700 dark:text-green-300">
          Pago
        </span>
      );
    }
    if (account.status === 'Pendente') {
      return (
        <span className="badge bg-yellow-100 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300">
          Pendente
        </span>
      );
    }
    if (account.status === 'Cancelado') {
      return (
        <span className="badge bg-red-100 dark:bg-red-500/30 text-red-700 dark:text-red-300">
          Cancelado
        </span>
      );
    }
    return (
      <span className="badge bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-100">
        {account.status}
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
          const la = parcelaLabel(a, currentComp);
          const lb = parcelaLabel(b, currentComp);
          va =
            la === 'Indeterminada'
              ? Number.MAX_SAFE_INTEGER
              : Number(la.split('/')[0]) || 0;
          vb =
            lb === 'Indeterminada'
              ? Number.MAX_SAFE_INTEGER
              : Number(lb.split('/')[0]) || 0;
          break;
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
  return (
    <section className="relative">
      {/* Cabeçalho DESKTOP minimalista */}
      <div
        className="hidden md:flex items-center justify-between px-6 py-2 border border-b-0 border-slate-300 dark:border-slate-700 rounded-t-md cursor-grab"
        {...(dragHandleProps || {})}
        style={{ ...(dragHandleProps?.style || {}), userSelect: 'none' }}
      >
        {/* Esquerda: drag + título */}
        <div className="flex items-center gap-2 flex-1">
          <GripVertical
            size={16}
            className="text-slate-400 dark:text-slate-500"
          />
          <h3 className="text-base font-semibold">{title}</h3>
        </div>

        {/* Direita: totais + excluir */}
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
            onPointerDown={(e) => e.stopPropagation()}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Cabeçalho MOBILE */}
      <div className="md:hidden p-4 pb-2">
        <div
          className="flex items-center justify-between"
          {...(dragHandleProps || {})}
          style={{ ...(dragHandleProps?.style || {}), userSelect: 'none' }}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="badge bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-100">
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
              className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 ml-2"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP - Tabela estilo Jenkins */}
      <div className="hidden md:block overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm rounded-b-md">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
            <tr>
              <th className="px-6 py-3 font-medium text-left w-[30%]">
                Descrição
              </th>
              <th className="px-4 py-3 font-medium text-left w-[10%]">Valor</th>
              <th className="px-4 py-3 font-medium text-center w-[10%]">
                Parcela
              </th>
              <th className="px-4 py-3 font-medium text-center w-[12%]">
                Status
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
            {sortedData.map((f: Account, idx: number) => (
              <tr
                key={f.id}
                className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition ${
                  idx % 2 === 0
                    ? 'bg-white dark:bg-slate-800/40'
                    : 'bg-slate-50 dark:bg-slate-900/40'
                }`}
              >
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
                    checked={!!f.paid}
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
            {sortedData.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-6 text-center text-slate-500 dark:text-slate-400"
                >
                  Sem lançamentos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE - Cards */}
      <div className="block md:hidden space-y-3">
        {sortedData.map((f) => (
          <div
            key={f.id}
            className="border border-slate-300 dark:border-slate-700 rounded-md p-4 bg-white dark:bg-slate-800 shadow-sm"
          >
            <div className="font-semibold text-slate-800 dark:text-slate-100">
              {f.description}
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm">
              Valor: {brl(Number(f.value))}
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm">
              Parcela: {parcelaLabel(f, currentComp)}
            </div>
            <div className="text-sm">{getStatusBadge(f)}</div>
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={!!f.paid}
                  onChange={() => handlePaidToggle(f)}
                  className="custom-checkbox"
                />
                Pago
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {f.cancelledAt
                  ? new Date(f.cancelledAt).toLocaleDateString('pt-BR', {
                      year: 'numeric',
                      month: '2-digit',
                    })
                  : ''}
              </span>
            </div>
            {/* Ações */}
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => onEdit(f)}>
                <Pencil
                  size={16}
                  className="text-slate-500 hover:text-yellow-500"
                />
              </button>
              <button onClick={() => onCancelToggle(f.id)}>
                {f.status === 'Pendente' || f.status === 'ativo' ? (
                  <Ban size={16} className="text-red-400 hover:text-red-600" />
                ) : (
                  <CheckCircle
                    size={16}
                    className="text-green-500 hover:text-green-700"
                  />
                )}
              </button>
              <button onClick={() => setFinancaToDelete(f)}>
                <Trash2 size={16} className="text-red-600 hover:text-red-800" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modais permanecem iguais abaixo */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg max-w-sm w-full">
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
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg max-w-sm w-full">
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
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg max-w-sm w-full">
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
