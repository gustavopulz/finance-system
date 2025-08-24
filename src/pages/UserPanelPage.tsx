import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateShareToken, useShareToken } from '../lib/api';

export default function UserPanelPage() {
  const auth = useAuth();
  const [token, setToken] = useState('');
  const [sharedToken, setSharedToken] = useState('');
  const [copied, setCopied] = useState(false);

  // Gerar token via backend
  const handleGenerateToken = async () => {
    const res = await generateShareToken();
    setToken(res.token);
    setCopied(false);
  };

  // Usar token via backend
  const handleUseToken = async () => {
    const res = await useShareToken(sharedToken);
    if (res.success) {
      alert('Contas mescladas com sucesso!');
    } else {
      alert(res.error || 'Erro ao mesclar contas');
    }
    setSharedToken('');
  };

  // Simulação: alterar nome/senha
  const handleChangeName = () => {
    alert('Função de alterar nome (implementar backend)');
  };
  const handleChangePassword = () => {
    alert('Função de alterar senha (implementar backend)');
  };

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-white dark:bg-slate-900 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Painel do Usuário</h2>
      <div className="mb-6">
        <button className="btn btn-primary" onClick={handleGenerateToken}>
          Gerar Token de Compartilhamento
        </button>
        {token && (
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              {token}
            </span>
            <button
              className="btn btn-ghost"
              onClick={() => {
                navigator.clipboard.writeText(token);
                setCopied(true);
              }}
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        )}
      </div>
      <div className="mb-6">
        <label className="block mb-2">Usar Token para Mesclar Contas:</label>
        <input
          type="text"
          className="input input-bordered w-full mb-2"
          placeholder="Cole o token aqui..."
          value={sharedToken}
          onChange={(e) => setSharedToken(e.target.value)}
        />
        <button className="btn btn-secondary" onClick={handleUseToken}>
          Mesclar Contas
        </button>
      </div>
      <div className="mb-6">
        <button className="btn btn-ghost mr-2" onClick={handleChangeName}>
          Alterar Nome
        </button>
        <button className="btn btn-ghost" onClick={handleChangePassword}>
          Alterar Senha
        </button>
      </div>
    </div>
  );
}
