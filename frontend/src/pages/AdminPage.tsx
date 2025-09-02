import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { listUsers, deleteUser, changeUserRole } from '../lib/api';
import { FaTrash } from 'react-icons/fa';
import { FaUserShield, FaUser } from 'react-icons/fa';

export default function AdminPage() {
  const { notify } = useNotification();
  const auth = useAuth();
  if (auth?.loading)
    return (
      <div className="w-full flex items-center justify-center py-20">
        <span className="text-gray-500 dark:text-gray-400 text-lg">
          Carregando...
        </span>
      </div>
    );
  if (!auth?.user) return <Navigate to="/login" replace />;
  if (auth.user.role !== 'admin') return <Navigate to="/" replace />;
  async function handleToggleAdmin(user: { id: number; role: string }) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await changeUserRole(user.id, newRole);
      await refresh();
    } catch (err: any) {
      notify('Erro ao atualizar papel do usuário', 'error');
    }
  }

  const [users, setUsers] = useState<
    { id: number; name: string; role: string; email: string }[]
  >([]);
  const [, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
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
          (u: { id: number; name: string; role: string; email?: string }) => ({
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
      notify(err.message || 'Erro ao excluir usuário', 'error');
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
        <h1 className="text-2xl font-medium">Administração de Usuários</h1>
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
                Nome {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
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
              <th className="px-4 py-3 font-medium text-center">Ações</th>
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
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleAdmin(u)}
                          className={`p-2 rounded border flex items-center gap-2 ${u.role === 'admin' ? 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white' : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'} transition`}
                        >
                          {u.role === 'admin' ? (
                            <FaUser className="w-4 h-4" />
                          ) : (
                            <FaUserShield className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setDlg({ mode: 'deleteUser', userId: u.id });
                          }}
                          className="p-2 rounded border border-gray-400 text-gray-600 hover:bg-gray-400 hover:text-white transition"
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
          <div className="bg-white dark:bg-slate-800 rounded p-6 shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-medium mb-4">Confirmar Exclusão</h2>
            <p>Tem certeza que deseja excluir este usuário?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 text-white px-4 py-2 rounded-md transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
