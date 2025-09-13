import { FaTrash, FaUserShield, FaUser } from 'react-icons/fa';

export type User = {
  id: number;
  name: string;
  role: string;
  email: string;
};

interface UserTableProps {
  users: User[];
  loading: boolean;
  sortKey: 'name' | 'role' | 'email' | null;
  sortOrder: 'asc' | 'desc';
  onSort: (key: 'name' | 'role' | 'email') => void;
  onToggleAdmin: (user: User) => void;
  onDeleteUser: (userId: number) => void;
}

export default function UserTable({
  users,
  loading,
  sortKey,
  sortOrder,
  onSort,
  onToggleAdmin,
  onDeleteUser,
}: UserTableProps) {
  const sortedUsers = [...users].sort((a, b) => {
    if (!sortKey) return 0;
    const valueA = a[sortKey];
    const valueB = b[sortKey];
    if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="overflow-hidden rounded border border-slate-200 dark:border-slate-700 shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300">
          <tr>
            <th className="px-4 py-3 font-medium">#</th>
            <th
              className="px-4 py-3 font-medium cursor-pointer"
              onClick={() => onSort('name')}
            >
              Nome {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="px-4 py-3 font-medium cursor-pointer"
              onClick={() => onSort('role')}
            >
              Função {sortKey === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="px-4 py-3 font-medium cursor-pointer"
              onClick={() => onSort('email')}
            >
              E-mail {sortKey === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                        onClick={() => onToggleAdmin(u)}
                        className={`p-2 rounded border flex items-center gap-2 ${
                          u.role === 'admin'
                            ? 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white'
                            : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                        } transition`}
                      >
                        {u.role === 'admin' ? (
                          <FaUser className="w-4 h-4" />
                        ) : (
                          <FaUserShield className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => onDeleteUser(u.id)}
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
  );
}
