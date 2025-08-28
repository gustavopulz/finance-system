import { useState } from 'react';
import { Pencil, Lock, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccountSettings() {
  const auth = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [newName, setNewName] = useState(auth?.user?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSaveName = async () => {
    try {
      await auth?.updateName(newName);
      setStatus('Nome alterado com sucesso!');
      setEditingName(false);
    } catch (err: any) {
      setStatus(err.message || 'Erro ao alterar nome');
    }
  };

  const handleSavePassword = async () => {
    try {
      await auth?.updatePassword(newPassword);
      setStatus('Senha alterada com sucesso!');
      setNewPassword('');
      setEditingPassword(false);
    } catch (err: any) {
      setStatus(err.message || 'Erro ao alterar senha');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded shadow-md p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Settings size={20} /> Configuração de Conta
      </h3>

      {/* Nome */}
      <div className="mb-4">
        <label className="block font-semibold mb-2">Nome</label>
        <div className="flex gap-2">
          <input
            type="text"
            className="input input-bordered w-full"
            value={editingName ? newName : auth?.user?.name || ''}
            onChange={editingName ? (e) => setNewName(e.target.value) : undefined}
            disabled={!editingName}
          />
          {!editingName ? (
            <button className="btn btn-primary" onClick={() => setEditingName(true)}>
              <Pencil size={16} />
            </button>
          ) : (
            <>
              <button className="btn" onClick={() => setEditingName(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSaveName}>
                Salvar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Senha */}
      <div className="mb-4">
        <label className="block font-semibold mb-2">Senha</label>
        {!editingPassword ? (
          <div className="flex gap-2">
            <input type="password" className="input input-bordered w-full" value="********" disabled />
            <button className="btn btn-primary" onClick={() => setEditingPassword(true)}>
              <Lock size={16} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="password"
              className="input input-bordered w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button className="btn" onClick={() => setEditingPassword(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSavePassword}>
              Salvar
            </button>
          </div>
        )}
      </div>

      {status && <div className="text-sm text-green-600 mt-2">{status}</div>}
    </div>
  );
}
