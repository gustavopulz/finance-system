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
  const [linkConfigLoading, setLinkConfigLoading] = useState(false);
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
    setSelectedCollabId('');
    setLinkConfigOpen({ open: true, otherUserId, direction });
    setLinkConfigLoading(true);
    try {
      let res = await getLinkConfig(otherUserId, direction);
      let ids = res?.allowedCollabIds || [];
      // Fallback: if nothing returned (legacy/inverted saves), try opposite direction
      if (!ids.length) {
        const fallbackDir = direction === 'see-me' ? 'i-see' : 'see-me';
        try {
          const fb = await getLinkConfig(otherUserId, fallbackDir as any);
          if (fb?.allowedCollabIds?.length) ids = fb.allowedCollabIds;
        } catch {}
      }
      setLinkAllowedCollabIds(ids);
    } catch (e: any) {
      setLinkAllowedCollabIds([]);
      notify(
        e?.message || 'Não foi possível carregar a configuração do vínculo',
        'error'
      );
    } finally {
      setLinkConfigLoading(false);
    }
    // For now, only 'see-me' configuration is available in the UI, so we keep using
    // the current user's collaborators already loaded into `collabs`.
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
      <div className="mb-4 flex items-center gap-3">
        <h3 className="text-lg font-bold flex items-center gap-2 m-0">
          <Settings size={20} /> Configuração de Token
        </h3>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-md transition"
            onClick={() => setTokenModalOpen(true)}
          >
            <SlidersHorizontal size={16} /> Configurar token
          </button>
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={handleGenerateToken}
          >
            <Plus size={16} /> Gerar Token
          </button>
        </div>
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
            className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-md transition"
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
            className="btn btn-primary cursor-pointer"
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
              <div className="flex flex-col gap-2">
                {links.iSee.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <span className="flex gap-2 items-center font-medium">
                      <User size={16} /> {u.name || u.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-xs btn-ghost text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        onClick={() => handleUnlink(u.id, 'i-see')}
                        title="Remover vínculo"
                        aria-label="Remover vínculo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vê sua conta */}
            <div>
              <h5 className="font-semibold mb-2">Vê sua conta:</h5>
              <div className="flex flex-col gap-2">
                {links.seeMe.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <span className="flex gap-2 items-center font-medium">
                      <LinkIcon size={16} /> {u.name || u.id}
                    </span>
                    <div className="flex items-center">
                      <button
                        className="btn btn-xs btn-ghost text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        title="Configurar quais colaboradores desse vínculo veem da sua conta"
                        aria-label="Configurar vínculo"
                        onClick={() => startLinkConfig(u.id, 'see-me')}
                      >
                        <SlidersHorizontal size={16} />
                      </button>
                      <button
                        className="btn btn-xs btn-ghost text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        onClick={() => handleUnlink(u.id, 'see-me')}
                        title="Remover vínculo"
                        aria-label="Remover vínculo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Token Config Modal */}
      {tokenModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded shadow-md w-full max-w-lg">
            <h4 className="font-bold mb-4">Configurar Token</h4>
            <div className="mb-4">
              <label className="block text-sm mb-1">Colaborador</label>
              <div className="flex w-full items-stretch gap-2">
                <select
                  className="select select-bordered flex-1 min-w-0"
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
                <button
                  className="btn btn-primary btn-square shrink-0"
                  onClick={addSelectedCollabToToken}
                  disabled={!selectedCollabId}
                  aria-label="Adicionar colaborador"
                  title="Adicionar colaborador"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            {/* Selected list */}
            <div className="max-h-48 overflow-auto border border-slate-300 dark:border-slate-700 rounded p-3 mb-4">
              {tokenAllowedCollabIds.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum colaborador selecionado. Todos serão compartilhados.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tokenAllowedCollabIds.map((id) => {
                    const c = collabs.find((x) => x.id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm"
                        title={c?.name || id}
                      >
                        <span className="max-w-[14rem] truncate">
                          {c?.name || id}
                        </span>
                        <button
                          className="inline-flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          onClick={() => removeFromTokenList(id)}
                          aria-label="Remover"
                          title="Remover"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-md transition"
                onClick={() => setTokenModalOpen(false)}
              >
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
            <div className="mb-4">
              <label className="block text-sm mb-1">Colaborador</label>
              <div className="flex w-full items-stretch gap-2">
                <select
                  className="select select-bordered flex-1 min-w-0"
                  value={selectedCollabId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setSelectedCollabId(e.target.value)
                  }
                  disabled={linkConfigLoading}
                >
                  <option value="">Selecione...</option>
                  {collabs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-primary btn-square shrink-0"
                  onClick={addSelectedCollabToLink}
                  disabled={!selectedCollabId || linkConfigLoading}
                  aria-label="Adicionar colaborador"
                  title="Adicionar colaborador"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="max-h-48 overflow-auto border border-slate-300 dark:border-slate-700 rounded p-3 mb-4">
              {linkConfigLoading ? (
                <p className="text-sm text-slate-500">Carregando...</p>
              ) : linkAllowedCollabIds.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum colaborador selecionado. Todos serão compartilhados.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {linkAllowedCollabIds.map((id) => {
                    const c = collabs.find((x) => x.id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm"
                        title={c?.name || id}
                      >
                        <span className="max-w-[14rem] truncate">
                          {c?.name || id}
                        </span>
                        <button
                          className="inline-flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          onClick={() => removeFromLinkList(id)}
                          aria-label="Remover"
                          title="Remover"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-md transition"
                onClick={() =>
                  setLinkConfigOpen({ open: false, otherUserId: null })
                }
              >
                Cancelar
              </button>
              <button
                className={`btn btn-primary ${savingLinkConfig ? 'loading' : ''}`}
                onClick={saveLinkConfiguration}
                disabled={savingLinkConfig || linkConfigLoading}
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
