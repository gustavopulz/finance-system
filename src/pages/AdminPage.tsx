import { useEffect, useState } from 'react';
import { listUsers, addUser, deleteUser } from '../lib/api';

export default function AdminPage() {
  const [users, setUsers] = useState<
    { id: number; username: string; role: string }[]
  >([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  // Carregar colaboradores ao entrar
  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const data = await listUsers();
    setUsers(data);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;
    try {
      await addUser(newUsername, newPassword, newRole);
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      await refresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao adicionar usuário');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await deleteUser(id);
      await refresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir usuário');
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Administração de Usuários</h1>

      {/* Formulário para adicionar usuário */}
      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-6">
        <input
          className="input input-bordered"
          placeholder="Novo usuário"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />
        <input
          className="input input-bordered"
          type="password"
          placeholder="Senha"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <select
          className="select"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
        >
          <option value="user">Usuário</option>
          <option value="admin">Administrador</option>
        </select>
        <button className="btn btn-primary" type="submit">
          Adicionar usuário
        </button>
      </form>

      {/* Lista de usuários */}
      <ul className="space-y-2">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:shadow-lg"
          >
            <span>
              {u.username} <span className="badge ml-2">{u.role}</span>
            </span>
            <button
              onClick={() => handleDelete(u.id)}
              className="btn btn-sm btn-error"
            >
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
