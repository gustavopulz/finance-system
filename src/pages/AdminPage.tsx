import { useEffect, useState } from 'react';
import { listCollabs, addCollab, deleteCollab } from '../lib/api';

export default function AdminPage() {
  const [collabs, setCollabs] = useState<{ id: number; name: string }[]>([]);
  const [newName, setNewName] = useState('');

  // Carregar colaboradores ao entrar
  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const data = await listCollabs();
    setCollabs(data);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await addCollab(newName);
      setNewName('');
      await refresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao adicionar colaborador');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este colaborador?')) return;
    try {
      await deleteCollab(id);
      await refresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir colaborador');
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Administração</h1>

      {/* Formulário para adicionar colaborador */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          className="input input-bordered flex-1"
          placeholder="Novo colaborador"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">
          Adicionar
        </button>
      </form>

      {/* Lista de colaboradores */}
      <ul className="space-y-2">
        {collabs.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm"
          >
            <span>{c.name}</span>
            <button
              onClick={() => handleDelete(c.id)}
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
