import { parcelaLabel, brl } from '../lib/format';
import type { Account } from '../lib/types';
import { ArrowUpDown, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { deleteCollab } from '../lib/api';

type SortKey = 'description' | 'value' | 'parcelas' | 'status';
type SortDir = 'asc' | 'desc';

export interface FinanceTableProps {
  collaboratorId: string;
  title: string;
  items: Account[];
  currentComp: { year: number; month: number };
  onDelete: (id: string) => void;
  onEdit: (a: Account) => void;
  onCancelToggle: (id: string) => void;
  onCollabDeleted: (id: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}

export default function FinanceTable({
  collaboratorId,
  title,
  items,
  currentComp,
  onDelete,
  onEdit,
  onCancelToggle,
  onCollabDeleted,
  dragHandleProps,
}: FinanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('description');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [financaToDelete, setFinancaToDelete] = useState<Account | null>(null);
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    financa: Account | null;
  }>({ open: false, financa: null });

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const data = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      let va: any, vb: any;
      switch (sortKey) {
        case 'value':
          va = a.value;
          vb = b.value;
          break;
        case 'status':
          va = a.status;
          vb = b.status;
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
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [items, sortKey, sortDir, currentComp]);

  const total = data
    .filter((f) => f.status !== 'cancelado')
    .reduce((acc, f) => acc + Number(f.value), 0);

  const Th = ({ label, keyName }: { label: string; keyName: SortKey }) => (
    <th
      className="cursor-pointer select-none"
      onClick={() => toggleSort(keyName)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={14} />
      </span>
    </th>
  );

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

  return (
    <section className="card relative">
      {/* Cabeçalho DESKTOP */}
      <div
        className="hidden md:flex items-center justify-between p-4 pb-2 cursor-grab"
        {...(dragHandleProps || {})}
        style={{ ...(dragHandleProps?.style || {}), userSelect: 'none' }}
      >
        <div className="flex items-center gap-2 flex-1">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="badge">Total: {brl(Number(total))}</div>
          <button
            onClick={() => setShowConfirm(true)}
            className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
          >
            <Trash2 size={16} /> Excluir colaborador
          </button>
        </div>
      </div>

      {/* Cabeçalho MOBILE */}
      <div className="md:hidden mb-2">
        {/* Linha 1: Nome + Total */}
        <div
          className="flex items-center justify-between"
          {...(dragHandleProps || {})}
          style={{ ...(dragHandleProps?.style || {}), userSelect: 'none' }}
        >
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="badge">Total: {brl(Number(total))}</div>
        </div>

        {/* Linha 2: Botão excluir colaborador */}
        <div className="mt-2">
          <button
            onClick={() => setShowConfirm(true)}
            className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
          >
            <Trash2 size={16} /> Excluir colaborador
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto px-4 pb-4">
        <table className="table">
          <thead>
            <tr>
              <Th label="Descrição" keyName="description" />
              <Th label="Valor" keyName="value" />
              <Th label="Parcela" keyName="parcelas" />
              <Th label="Status" keyName="status" />
              <th className="hidden md:table-cell">Cancelado em</th>
              <th className="w-8 md:w-36 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {/* Versão desktop */}
            {data.map((f, idx) => (
              <tr
                key={f.id}
                className={
                  'hidden md:table-row ' +
                  (idx % 2 === 0
                    ? 'bg-slate-50 dark:bg-slate-900/40'
                    : 'bg-white dark:bg-slate-800/40')
                }
              >
                <td className="px-2 py-3 font-medium min-w-[100px] md:min-w-[150px]">
                  {f.description}
                </td>
                <td className="py-3 min-w-[60px] md:min-w-[90px]">
                  {brl(Number(f.value))}
                </td>
                <td className="py-3 min-w-[60px] md:min-w-[90px]">
                  {parcelaLabel(f, currentComp)}
                </td>
                <td className="py-3 min-w-[60px] md:min-w-[90px]">
                  <span
                    className={
                      'px-2 py-1 rounded-full text-xs font-semibold ' +
                      (f.status === 'ativo'
                        ? 'bg-green-100 text-green-700 dark:bg-green-500/30 dark:text-green-300'
                        : f.status === 'cancelado'
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/30 dark:text-red-300'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300')
                    }
                  >
                    {f.status}
                  </span>
                </td>
                <td className="py-3 text-xs text-slate-500 hidden md:table-cell">
                  {f.cancelledAt
                    ? new Date(f.cancelledAt).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: '2-digit',
                      })
                    : ''}
                </td>
                <td className="px-1 py-3 flex items-center justify-center">
                  <div className="hidden md:flex gap-1">
                    <button className="btn btn-ghost" onClick={() => onEdit(f)}>
                      ✏️
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => onCancelToggle(f.id)}
                    >
                      🚫
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setFinancaToDelete(f)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Versão mobile (cards lado esquerdo infos, direito ações) */}
            {data.map((f) => (
              <tr key={f.id} className="md:hidden">
                <td colSpan={6} className="p-3">
                  <div className="border rounded-lg p-3 bg-slate-50 dark:bg-slate-800 flex justify-between items-center gap-3">
                    {/* Infos */}
                    <div className="flex-1 space-y-2">
                      <div className="font-medium">{f.description}</div>
                      <div className="text-sm">{brl(Number(f.value))}</div>
                      <div className="text-sm text-slate-500">
                        Parcela: {parcelaLabel(f, currentComp)}
                      </div>
                      <div>
                        <span
                          className={
                            'px-2 py-1 rounded-full text-xs font-semibold ' +
                            (f.status === 'ativo'
                              ? 'bg-green-100 text-green-700 dark:bg-green-500/30 dark:text-green-300'
                              : f.status === 'cancelado'
                                ? 'bg-red-100 text-red-700 dark:bg-red-500/30 dark:text-red-300'
                                : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300')
                          }
                        >
                          {f.status}
                        </span>
                      </div>
                      {f.cancelledAt && (
                        <div className="text-xs text-slate-400">
                          Cancelado em:{' '}
                          {new Date(f.cancelledAt).toLocaleDateString('pt-BR', {
                            year: 'numeric',
                            month: '2-digit',
                          })}
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => onEdit(f)}
                        className="btn btn-ghost text-xs"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onCancelToggle(f.id)}
                        className="btn btn-ghost text-xs"
                      >
                        {f.status === 'ativo' ? '🚫' : '✅'}
                      </button>
                      <button
                        onClick={() => setFinancaToDelete(f)}
                        className="btn btn-ghost text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">
                  Sem lançamentos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmação de colaborador */}
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
      {/* Modal de ações para lançamento */}
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
                className="px-4 py-2 rounded bg-yellow-500 text-white"
                onClick={() => {
                  if (actionModal.financa) {
                    onCancelToggle(actionModal.financa.id);
                  }
                  setActionModal({ open: false, financa: null });
                }}
              >
                {actionModal.financa.status === 'ativo' ? 'Cancelar' : 'Ativar'}
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

      {/* Modal de confirmação de finança */}
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
          {toast}
        </div>
      )}
    </section>
  );
}
