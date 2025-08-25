import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateShareToken, useShareToken } from '../lib/api';
import { updateUserName, updateUserPassword } from '../lib/api';
import { getLinks } from '../lib/share';

export default function UserPanelPage() {
  const auth = useAuth();
  const [token, setToken] = useState('');
  const [sharedToken, setSharedToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<{ iSee: any[]; seeMe: any[] }>({
    iSee: [],
    seeMe: [],
  });
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [nameStatus, setNameStatus] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  // Buscar vínculos ao abrir
  useEffect(() => {
    fetchLinks();
  }, []);

  async function fetchLinks() {
    setLoadingLinks(true);
    try {
      const data = await getLinks();
      setLinks(data);
    } finally {
      setLoadingLinks(false);
    }
  }

  // Gerar token via backend
  const handleGenerateToken = async () => {
    const res = await generateShareToken();
    setToken(res.token);
    setCopied(false);
    await fetchLinks();
  };

  // Usar token via backend
  const handleUseToken = async () => {
    const res = await useShareToken(sharedToken);
    if (res.success) {
      alert('Contas mescladas com sucesso!');
      await fetchLinks();
    } else {
      alert(res.error || 'Erro ao mesclar contas');
    }
    setSharedToken('');
  };

  // Desvincular
  async function handleUnlink() {
    await fetchLinks();
  }
  // Simulação: alterar nome/senha
  const handleChangeName = () => {
    setEditingName(true);
    setNewName(auth?.user?.username || '');
  };
  const handleChangePassword = () => {
    setEditingPassword(true);
    setNewPassword('');
  };
  const handleSaveName = async () => {
    setNameStatus(null);
    try {
  await updateUserName(newName);
      setNameStatus('Nome alterado com sucesso!');
      if (auth?.user) {
        auth.user.username = newName;
      }
      setEditingName(false);
    } catch (err: any) {
      setNameStatus(err.message || 'Erro ao alterar nome');
    }
  };

  const handleSavePassword = async () => {
    setPasswordStatus(null);
    try {
      await updateUserPassword(newPassword);
      setPasswordStatus('Senha alterada com sucesso!');
      setEditingPassword(false);
    } catch (err: any) {
      setPasswordStatus(err.message || 'Erro ao alterar senha');
    }
  };

  return (
    <div className="max-w-5xl mx-auto grid gap-8 py-10 px-4">
      {/* Card principal */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-8 flex flex-col gap-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full flex items-center justify-center">
              {/* User icon SVG */}
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="text-slate-500 w-6 h-6"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </span>
            <span className="text-2xl font-bold">Painel do Usuário</span>
            <button
              className="btn btn-secondary ml-2"
              onClick={() => setShowInfo(!showInfo)}
              title="Informações"
              style={{ padding: '0.4rem' }}
            >
              <span>
                {/* Info icon SVG (circle with 'i') */}
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className="inline-block align-middle text-slate-100"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <circle cx="12" cy="9" r="1" />
                </svg>
              </span>
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleGenerateToken}>
            <span className="mr-1">
              {/* Plus icon SVG */}
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="inline-block align-middle text-slate-100"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>{' '}
            Gerar Token
          </button>
        </div>
        {showInfo && (
          <div className="bg-slate-100 dark:bg-slate-800 rounded p-4 text-sm text-slate-700 dark:text-slate-300 mb-2">
            <strong>Como funciona:</strong>
            <ul className="list-disc ml-5 mt-2">
              <li>
                Gere um token para compartilhar suas finanças com outro usuário.
              </li>
              <li>
                Use um token recebido para mesclar contas e visualizar dados
                compartilhados.
              </li>
              <li>Desvincule acessos a qualquer momento.</li>
              <li>Altere seu nome ou senha pelo painel.</li>
            </ul>
          </div>
        )}
        <p className="text-slate-500 dark:text-slate-400 mb-2 -mt-4">
          Gerencie seu perfil, compartilhamento e vínculos de acesso.
        </p>
        {token && (
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs border border-slate-300 dark:border-slate-700">
              {token}
            </span>
            <button
              className={`btn btn-secondary ${copied ? 'text-green-600' : ''}`}
              onClick={() => {
                navigator.clipboard.writeText(token);
                setCopied(true);
              }}
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        )}
        <div className="mt-4">
          <label className="block mb-2 font-semibold text-slate-700 dark:text-slate-300">
            Usar Token para Mesclar Contas:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Cole o token aqui..."
              value={sharedToken}
              onChange={(e) => setSharedToken(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleUseToken}>
              <span className="mr-1">
                {/* Merge icon SVG */}
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className="inline-block align-middle text-slate-100"
                >
                  <path d="M17 8a5 5 0 0 0-10 0v8" />
                  <polyline points="12 17 17 12 12 7" />
                </svg>
              </span>{' '}
              Mesclar
            </button>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {/* Alterar nome */}
          <div className="flex flex-col gap-2 w-1/2">
            {!editingName ? (
              <button
                className="btn btn-primary w-full"
                onClick={handleChangeName}
              >
                <span className="mr-1">
                  {/* Edit icon SVG */}
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="inline-block align-middle text-slate-100"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </span>{' '}
                Alterar Nome
              </button>
            ) : (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <button className="btn btn-success" onClick={handleSaveName}>
                  Salvar
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditingName(false)}
                >
                  Cancelar
                </button>
              </div>
            )}
            {nameStatus && (
              <div className="text-xs mt-1 text-green-600 dark:text-green-400">
                {nameStatus}
              </div>
            )}
          </div>
          {/* Alterar senha */}
          <div className="flex flex-col gap-2 w-1/2">
            {!editingPassword ? (
              <button
                className="btn btn-primary w-full"
                onClick={handleChangePassword}
              >
                <span className="mr-1">
                  {/* Lock icon SVG */}
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="inline-block align-middle text-slate-100"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>{' '}
                Alterar Senha
              </button>
            ) : (
              <div className="flex gap-2 items-center">
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  className="btn btn-success"
                  onClick={handleSavePassword}
                >
                  Salvar
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditingPassword(false)}
                >
                  Cancelar
                </button>
              </div>
            )}
            {passwordStatus && (
              <div className="text-xs mt-1 text-green-600 dark:text-green-400">
                {passwordStatus}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Card de vínculos */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-8 border border-slate-200 dark:border-slate-800">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full flex items-center justify-center">
            {/* Link icon SVG */}
            <svg
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="text-slate-500 w-5 h-5"
            >
              <path d="M10 14L21 3" />
              <path d="M8 6a5 5 0 0 1 7.07 0l3.54 3.54a5 5 0 0 1 0 7.07l-3.54 3.54a5 5 0 0 1-7.07 0l-1.5-1.5" />
            </svg>
          </span>
          Vínculos de Compartilhamento
        </h3>
        {loadingLinks ? (
          <div className="text-slate-500 dark:text-slate-400">
            Carregando vínculos...
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <span>👁️</span> Você vê:
              </div>
              {links.iSee.length === 0 ? (
                <div className="text-slate-400">Nenhum vínculo.</div>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {links.iSee.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full flex items-center justify-center">
                          {/* User icon SVG */}
                          <svg
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            className="text-slate-500 w-5 h-5"
                          >
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                          </svg>
                        </span>
                        <span className="font-medium">{u.username}</span>
                      </span>
                      <button
                        className="btn btn-xs btn-error"
                        onClick={handleUnlink}
                      >
                        <span className="mr-1">
                          {/* Unlink icon SVG */}
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            className="inline-block align-middle"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </span>{' '}
                        Desvincular
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <span>🔒</span> Vê sua conta:
              </div>
              {links.seeMe.length === 0 ? (
                <div className="text-slate-400">Nenhum vínculo.</div>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {links.seeMe.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full text-center flex items-center justify-center">
                          👤
                        </span>
                        <span className="font-medium">{u.username}</span>
                      </span>
                      <button
                        className="btn btn-xs btn-error"
                        onClick={handleUnlink}
                      >
                        <span className="mr-1">❌</span> Desvincular
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
