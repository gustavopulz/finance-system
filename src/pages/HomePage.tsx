import { useEffect, useState } from 'react';
import type { Account, Collaborator } from '../lib/types';
import { MONTHS_PT, brl } from '../lib/format';
import { todayComp } from '../lib/date';
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

export default function HomePage() {
  const now = todayComp();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);

  const [dlg, setDlg] = useState<DialogState>({ mode: 'closed' });
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  async function load() {
    const [c, a] = await Promise.all([
      api.listCollabs(),
      api.listAccounts(month, year),
    ]);
    setCollabs(c as Collaborator[]);
    setAccounts(a as Account[]);
  }

  useEffect(() => {
    load();
  }, [month, year]);

  const currentComp = { year, month };

  const byCollab = (id: number) =>
    accounts.filter(
      (a) => a.collaboratorId === id && isVisibleInMonth(a, currentComp)
    );

  const totalGeral = accounts
    .filter((a) => a.status !== 'cancelado' && isVisibleInMonth(a, currentComp))
    .reduce((s, a) => s + Number(a.value), 0);

  // CRUD handlers
  async function addOrUpdateAccount(
    payload: Omit<
      Account,
      'id' | 'createdAt' | 'updatedAt' | 'collaboratorName' | 'cancelledAt'
    >,
    idToUpdate?: number
  ) {
    if (idToUpdate) {
      await api.updateAccount(idToUpdate, payload);
    } else {
      await api.addAccount(payload);
    }
    setDlg({ mode: 'closed' });
    await load();
  }

  async function removeAccount(id: number) {
    await api.deleteAccount(id);
    await load();
  }

  async function toggleCancel(id: number) {
    await api.toggleCancel(id);
    await load();
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
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
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
            />
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

      {/* Cards dinâmicos por colaborador */}
      <div className="flex flex-col gap-6">
        {collabs.map((c) => (
          <FinanceTable
            key={c.id}
            collaboratorId={c.id}
            title={c.name}
            items={byCollab(c.id)}
            currentComp={currentComp}
            onDelete={(id) => {
              removeAccount(id);
            }}
            onEdit={(account) => setDlg({ mode: 'editAccount', account })}
            onCancelToggle={(id) => {
              toggleCancel(id);
            }}
            onCollabDeleted={(id) => {
              // remove o card sem F5
              setCollabs((prev) => prev.filter((cc) => cc.id !== id));
            }}
          />
        ))}
        {collabs.length === 0 && (
          <div className="card p-6 text-center text-slate-500">
            Nenhum colaborador. Clique em <strong>Adicionar colaborador</strong>{' '}
            para começar.
          </div>
        )}
      </div>

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
