import { useEffect, useState } from 'react';
import { listUsers, addUser, deleteUser, changeUserRole } from '../lib/api';
import { FaTrash } from 'react-icons/fa';

export default function AdminPage() {
  async function handleToggleAdmin(user: { id: number; role: string }) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await changeUserRole(user.id, newRole);
      await refresh();
    } catch (err: any) {
      alert('Erro ao atualizar papel do usuário');
    }
  }

  const [users, setUsers] = useState<
    { id: number; name: string; role: string; email: string }[]
  >([]);
  const [, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<{
    id: number;
    name: string;
    role: string;
    email: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<'name' | 'role' | 'email' | null>(
    null
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listUsers();
      setUsers(
        data.map(
          (u: {
            id: number;
            name: string;
            role: string;
            email?: string;
          }) => ({
            ...u,
            email: u.email ?? '',
          })
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (userToDelete === null) return;
    try {
      await deleteUser(userToDelete);
      setShowDeleteModal(false);
      setUserToDelete(null);
      await refresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir usuário');
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!userToEdit) return;
    try {
      // aqui você pode substituir pelo endpoint correto de edição
      await addUser(userToEdit.name, '', userToEdit.role);
      setShowEditModal(false);
      setUserToEdit(null);
      await refresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao editar usuário');
    }
  }

  function handleSort(key: 'name' | 'role' | 'email') {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortKey) return 0;
    const valueA = a[sortKey];
    const valueB = b[sortKey];

    if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  function setDlg(
    arg: { mode: 'deleteUser'; userId: number } | { mode: 'addUser' }
  ) {
    if (arg.mode === 'deleteUser') {
      setUserToDelete(arg.userId);
      setShowDeleteModal(true);
    } else if (arg.mode === 'addUser') {
      setShowModal(true);
    }
  }

  return (
    <div className="mx-auto px-4 2xl:px-40 lg:px-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Administração de Usuários</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
          onClick={() => setDlg({ mode: 'addUser' })}
        >
          Adicionar Usuário
        </button>
      </div>

      {/* TABELA */}
      <div className="overflow-hidden rounded border border-slate-200 dark:border-slate-700 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th
                className="px-4 py-3 font-medium cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Nome{' '}
                {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer"
                onClick={() => handleSort('role')}
              >
                Função {sortKey === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer"
                onClick={() => handleSort('email')}
              >
                E-mail{' '}
                {sortKey === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-4 w-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-24"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-16"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-32"></div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="h-4 w-12 bg-slate-300 dark:bg-slate-600 rounded"></div>
                    </td>
                  </tr>
                ))
              : sortedUsers.map((u, idx) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition"
                  >
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {u.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                          u.role === 'admin'
                            ? 'bg-red-500/90 text-white'
                            : 'bg-blue-500/90 text-white'
                        }`}
                      >
                        {u.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {u.email || (
                        <span className="italic text-slate-400">N/D</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleAdmin(u)}
                          className={`p-2 rounded border ${u.role === 'admin' ? 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white' : 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white'} transition`}
                        >
                          {u.role === 'admin'
                            ? 'Tornar Usuário'
                            : 'Tornar Admin'}
                        </button>
                        <button
                          onClick={() => {
                            setDlg({ mode: 'deleteUser', userId: u.id });
                          }}
                          className="p-2 rounded border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DELETE */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
            <p>Tem certeza que deseja excluir este usuário?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={handleConfirmDelete} className="btn btn-error">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {showEditModal && userToEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Editar Usuário</h2>
            <form onSubmit={handleEdit} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  id="edit-name"
                  value={userToEdit.name}
                  onChange={(e) =>
                    setUserToEdit({ ...userToEdit, name: e.target.value })
                  }
                  className="peer w-full rounded-md border border-slate-300 bg-transparent px-3 pt-5 pb-2 text-sm 
                       text-slate-900 placeholder-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                       dark:border-slate-600 dark:text-white"
                  placeholder="Usuário"
                />
                <label
                  htmlFor="edit-name"
                  className="absolute left-3 top-2 text-slate-500 text-sm transition-all 
                       peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-400 peer-placeholder-shown:text-base 
                       peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-500"
                >
                  Usuário
                </label>
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">
                  Função
                </label>
                <select
                  value={userToEdit.role}
                  onChange={(e) =>
                    setUserToEdit({ ...userToEdit, role: e.target.value })
                  }
                  className="select w-full rounded-md border border-slate-300 px-3 py-2 
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                       dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
