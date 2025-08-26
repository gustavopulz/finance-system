import { useState, useEffect } from 'react';
import SkeletonCard from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { generateShareToken, useShareToken } from '../lib/api';
import { updateUserName, updateUserPassword } from '../lib/api';
import { getLinks } from '../lib/share';
import {
  Plus,
  Pencil,
  Lock,
  Link as LinkIcon,
  Eye,
  User,
  X,
} from 'lucide-react';

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
    <div className="px-4 sm:px-6 lg:px-20 2xl:px-60 grid gap-8 py-10">
      {/* Card principal */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 sm:p-8 flex flex-col gap-6 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full flex items-center justify-center">
              <User className="text-slate-500 w-6 h-6" />
            </span>
            <span className="text-2xl font-bold">Painel do Usuário</span>
            <button
              className="btn btn-secondary ml-2 p-2"
              onClick={() => setShowInfo(!showInfo)}
              title="Informações"
            >
              <Eye size={18} className="text-white" />
            </button>
          </div>
          <button
            className="btn btn-primary w-full sm:w-auto flex items-center gap-2"
            onClick={handleGenerateToken}
          >
            <Plus size={18} className="text-white" />
            Gerar Token
          </button>
        </div>

        {/* Info extra */}
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

        <p className="text-slate-500 dark:text-slate-400 -mt-2">
          Gerencie seu perfil, compartilhamento e vínculos de acesso.
        </p>

        {/* Token exibido */}
        {token && (
          <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs border border-slate-300 dark:border-slate-700 w-full sm:w-auto text-center sm:text-left">
              {token}
            </span>
            <button
              className={`btn btn-secondary w-full sm:w-auto ${copied ? 'text-green-600' : ''}`}
              onClick={() => {
                navigator.clipboard.writeText(token);
                setCopied(true);
              }}
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        )}

        {/* Usar Token */}
        <div className="mt-4">
          <label className="block mb-2 font-semibold text-slate-700 dark:text-slate-300">
            Usar Token para Mesclar Contas:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Cole o token aqui..."
              value={sharedToken}
              onChange={(e) => setSharedToken(e.target.value)}
            />
            <button
              className="btn btn-primary w-full sm:w-auto flex items-center gap-2"
              onClick={handleUseToken}
            >
              <LinkIcon size={18} className="text-white" />
              Mesclar
            </button>
          </div>
        </div>

        {/* Alterar Nome e Senha */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          {/* Alterar nome */}
          <div className="flex-1">
            {!editingName ? (
              <button
                className="btn btn-primary w-full flex items-center gap-2"
                onClick={handleChangeName}
              >
                <Pencil size={18} className="text-white" />
                Alterar Nome
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-success w-full sm:w-auto"
                  onClick={handleSaveName}
                >
                  Salvar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary w-full sm:w-auto"
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
          <div className="flex-1">
            {!editingPassword ? (
              <button
                className="btn btn-primary w-full flex items-center gap-2"
                onClick={handleChangePassword}
              >
                <Lock size={18} className="text-white" />
                Alterar Senha
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-success w-full sm:w-auto"
                  onClick={handleSavePassword}
                >
                  Salvar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary w-full sm:w-auto"
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
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <LinkIcon size={20} className="text-slate-500" />
          Vínculos de Compartilhamento
        </h3>
        {loadingLinks ? (
          <SkeletonCard className="mb-4" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Você vê */}
            <div>
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <Eye size={16} /> Você vê:
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
                        <User size={18} className="text-slate-500" />
                        <span className="font-medium">{u.username}</span>
                      </span>
                      <button className="btn btn-xs btn-error bg-red-600 text-white flex items-center gap-1">
                        <X size={14} /> Desvincular
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Vê sua conta */}
            <div>
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <Lock size={16} /> Vê sua conta:
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
                        <User size={18} className="text-slate-500" />
                        <span className="font-medium">{u.username}</span>
                      </span>
                      <button className="btn btn-xs btn-error bg-red-600 text-white flex items-center gap-1">
                        <X size={14} /> Desvincular
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
