import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import {
  generateShareToken,
  useShareToken,
  getLinks,
  unlinkUser,
  getTokenConfig,
  saveTokenConfig,
  listCollabs,
  getLinkConfig,
  saveLinkConfig,
} from '../../lib/api';
import {
  Settings,
  Plus,
  Link as LinkIcon,
  User,
  X,
  Lock,
  SlidersHorizontal,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import SkeletonCard from '../SkeletonCard';
import { useAuth } from '../../context/AuthContext';

export default function TokenSettings({ active }: { active: boolean }) {
  const { notify } = useNotification();
  const auth = useAuth();
  const [token, setToken] = useState('');
  const [sharedToken, setSharedToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<{ iSee: any[]; seeMe: any[] }>({
    iSee: [],
    seeMe: [],
  });
  const [loadingLinks, setLoadingLinks] = useState(false);
  // Token config modal state
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [collabs, setCollabs] = useState<any[]>([]);
  const [selectedCollabId, setSelectedCollabId] = useState('');
  const [tokenAllowedCollabIds, setTokenAllowedCollabIds] = useState<string[]>(
    []
  );
  const [savingTokenConfig, setSavingTokenConfig] = useState(false);
  // Per-link config
  const [linkConfigOpen, setLinkConfigOpen] = useState<{
    open: boolean;
    otherUserId: string | null;
    direction?: 'i-see' | 'see-me';
  }>({ open: false, otherUserId: null, direction: 'see-me' });
  const [linkAllowedCollabIds, setLinkAllowedCollabIds] = useState<string[]>(
    []
  );
  const [modalCollabs, setModalCollabs] = useState<any[]>([]);
  const [savingLinkConfig, setSavingLinkConfig] = useState(false);

  useEffect(() => {
    if (!active) return;
    fetchLinks();
    bootstrapTokenConfig();
  }, [active]);

  // Quando sair da aba (active=false), limpa a exibição temporária do token
  useEffect(() => {
    if (!active) {
      setToken('');
      setCopied(false);
    }
  }, [active]);

  async function fetchLinks() {
    setLoadingLinks(true);
    try {
      const data = await getLinks();
      setLinks(data);
    } finally {
      setLoadingLinks(false);
    }
  }

  const handleGenerateToken = async () => {
    const res = await generateShareToken();
    setToken(res.token);
    setCopied(false);
    await fetchLinks();
  };

  async function bootstrapTokenConfig() {
    try {
      if (auth?.user?.id) {
        const cl = await listCollabs(auth.user.id);
        setCollabs(cl);
      }
      const cfg = await getTokenConfig();
      // Não exibir token automaticamente ao abrir a tela; exibição é apenas após gerar
      setTokenAllowedCollabIds(cfg?.allowedCollabIds || []);
    } catch {}
  }

  const handleUseToken = async () => {
    const res = await useShareToken(sharedToken);
    if (res.success) {
      notify('Contas mescladas com sucesso!', 'success');
      await fetchLinks();
    } else {
      notify(res.error || 'Erro ao mesclar contas', 'error');
    }
    setSharedToken('');
  };

  const handleUnlink = async (id: string, direction: 'i-see' | 'see-me') => {
    try {
      await unlinkUser(id, direction);
      await fetchLinks();
    } catch (err: any) {
      notify(err.message || 'Erro ao desvincular usuário', 'error');
    }
  };

  function addSelectedCollabToToken() {
    if (!selectedCollabId) return;
    setTokenAllowedCollabIds((prev) =>
      prev.includes(selectedCollabId) ? prev : [...prev, selectedCollabId]
    );
  }

  function removeFromTokenList(id: string) {
    setTokenAllowedCollabIds((prev) => prev.filter((c) => c !== id));
  }

  async function saveTokenConfiguration() {
    setSavingTokenConfig(true);
    try {
      await saveTokenConfig(tokenAllowedCollabIds);
      notify('Configuração do token salva.', 'success');
      setTokenModalOpen(false);
    } catch (e: any) {
      notify(e?.message || 'Erro ao salvar configuração', 'error');
    } finally {
      setSavingTokenConfig(false);
    }
  }

  async function startLinkConfig(
    otherUserId: string,
    direction: 'i-see' | 'see-me'
  ) {
    setLinkConfigOpen({ open: true, otherUserId, direction });
    try {
      const res = await getLinkConfig(otherUserId, direction);
      setLinkAllowedCollabIds(res?.allowedCollabIds || []);
    } catch {
      setLinkAllowedCollabIds([]);
    }
    // Load proper collaborators for this modal based on direction
    try {
      if (direction === 'see-me') {
        // My collaborators (already in state), but keep a local snapshot
        setModalCollabs(collabs);
      } else {
        // Other user's collaborators
        const otherCollabs = await listCollabs(otherUserId);
        setModalCollabs(otherCollabs);
      }
    } catch {
      setModalCollabs([]);
    }
  }

  function addSelectedCollabToLink() {
    if (!selectedCollabId) return;
    setLinkAllowedCollabIds((prev) =>
      prev.includes(selectedCollabId) ? prev : [...prev, selectedCollabId]
    );
  }

  function removeFromLinkList(id: string) {
    setLinkAllowedCollabIds((prev) => prev.filter((c) => c !== id));
  }

  async function saveLinkConfiguration() {
    if (!linkConfigOpen.otherUserId) return;
    setSavingLinkConfig(true);
    try {
      await saveLinkConfig(
        linkConfigOpen.otherUserId,
        linkAllowedCollabIds,
        linkConfigOpen.direction || 'see-me'
      );
      notify('Configuração do vínculo salva.', 'success');
      setLinkConfigOpen({
        open: false,
        otherUserId: null,
        direction: 'see-me',
      });
    } catch (e: any) {
      notify(e?.message || 'Erro ao salvar configuração do vínculo', 'error');
    } finally {
      setSavingLinkConfig(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded shadow-md p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Settings size={20} /> Configuração de Token
      </h3>

      <div className="flex items-center gap-2 mb-4">
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={handleGenerateToken}
        >
          <Plus size={16} /> Gerar Token
        </button>
        <button
          className="btn btn-secondary flex items-center gap-2"
          onClick={() => setTokenModalOpen(true)}
        >
          <SlidersHorizontal size={16} /> Configurar token
        </button>
      </div>

      {token && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="input input-bordered w-full"
            value={token}
            readOnly
          />
          <button
            className={`btn ${copied ? 'btn-success' : 'btn-secondary'}`}
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
        <label className="block mb-2 font-semibold">Usar Token:</label>
        <div className="flex gap-2">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Cole o token aqui..."
            value={sharedToken}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSharedToken(e.target.value)
            }
          />
          <button
            className="btn btn-primary"
            disabled={!sharedToken.trim()}
            onClick={handleUseToken}
          >
            <LinkIcon size={16} /> Mesclar
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="font-bold mb-2">Vínculos</h4>
        {loadingLinks ? (
          <SkeletonCard />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Você vê */}
            <div>
              <h5 className="font-semibold mb-2">Você vê:</h5>
              {links.iSee.map((u) => (
                <div
                  key={u.id}
                  className="flex justify-between items-center border-b py-1 gap-2"
                >
                  <span className="flex gap-2 items-center">
                    <User size={16} /> {u.name || u.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-xs btn-ghost opacity-50 cursor-not-allowed"
                      title="Configuração bloqueada: apenas o dono do vínculo pode alterar"
                      disabled
                    >
                      <SlidersHorizontal size={14} />
                    </button>
                    <button
                      className="btn btn-xs btn-error"
                      onClick={() => handleUnlink(u.id, 'i-see')}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Vê sua conta */}
            <div>
              <h5 className="font-semibold mb-2">Vê sua conta:</h5>
              {links.seeMe.map((u) => (
                <div
                  key={u.id}
                  className="flex justify-between items-center border-b py-1 gap-2"
                >
                  <span className="flex gap-2 items-center">
                    <Lock size={16} /> {u.name || u.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-xs"
                      title="Configurar quais colaboradores desse vínculo veem da sua conta"
                      onClick={() => startLinkConfig(u.id, 'see-me')}
                    >
                      <SlidersHorizontal size={14} />
                    </button>
                    <button
                      className="btn btn-xs btn-error"
                      onClick={() => handleUnlink(u.id, 'see-me')}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Token Config Modal */}
      {tokenModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded shadow-md w-full max-w-lg">
            <h4 className="font-bold mb-4">Configurar Token</h4>
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-1">
                <label className="block text-sm mb-1">Colaborador</label>
                <select
                  className="select select-bordered w-full"
                  value={selectedCollabId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setSelectedCollabId(e.target.value)
                  }
                >
                  <option value="">Selecione...</option>
                  {modalCollabs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={addSelectedCollabToToken}
              >
                <Plus size={16} />
              </button>
            </div>
            {/* Selected list */}
            <div className="max-h-48 overflow-auto border rounded p-2 mb-4">
              {tokenAllowedCollabIds.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum colaborador selecionado. Todos serão compartilhados.
                </p>
              ) : (
                tokenAllowedCollabIds.map((id) => {
                  const c = collabs.find((x) => x.id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between py-1 border-b last:border-0"
                    >
                      <span>{c?.name || id}</span>
                      <button
                        className="btn btn-xs"
                        onClick={() => removeFromTokenList(id)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn" onClick={() => setTokenModalOpen(false)}>
                Cancelar
              </button>
              <button
                className={`btn btn-primary ${savingTokenConfig ? 'loading' : ''}`}
                onClick={saveTokenConfiguration}
                disabled={savingTokenConfig}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Config Modal */}
      {linkConfigOpen.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded shadow-md w-full max-w-lg">
            <h4 className="font-bold mb-4">Configurar Vínculo</h4>
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-1">
                <label className="block text-sm mb-1">Colaborador</label>
                <select
                  className="select select-bordered w-full"
                  value={selectedCollabId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setSelectedCollabId(e.target.value)
                  }
                >
                  <option value="">Selecione...</option>
                  {collabs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={addSelectedCollabToLink}
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="max-h-48 overflow-auto border rounded p-2 mb-4">
              {linkAllowedCollabIds.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum colaborador selecionado. Todos serão compartilhados.
                </p>
              ) : (
                linkAllowedCollabIds.map((id) => {
                  const c = collabs.find((x) => x.id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between py-1 border-b last:border-0"
                    >
                      <span>{c?.name || id}</span>
                      <button
                        className="btn btn-xs"
                        onClick={() => removeFromLinkList(id)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="btn"
                onClick={() =>
                  setLinkConfigOpen({ open: false, otherUserId: null })
                }
              >
                Cancelar
              </button>
              <button
                className={`btn btn-primary ${savingLinkConfig ? 'loading' : ''}`}
                onClick={saveLinkConfiguration}
                disabled={savingLinkConfig}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
