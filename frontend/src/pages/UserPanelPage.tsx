// import duplicado removido
import SkeletonCard from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  generateShareToken,
  useShareToken,
  updatename,
  updateUserPassword,
  getLinks,
  unlinkUser,
} from '../lib/api';
import {
  Plus,
  Pencil,
  Lock,
  Link as LinkIcon,
  Eye,
  User,
  X,
  Settings,
  Palette,
} from 'lucide-react';
import UserPanelSidebar from '../components/UserPanelSidebar';
import { useState, useEffect } from 'react';
export default function UserPanelPage() {
  // Estado para colaboradores igual AddFinanceDialog
  const [collaborators, setCollaborators] = useState<
    { id: string; name: string }[]
  >([]);
  // Estado para cor na criação de categoria
  const [newCategoryColor, setNewCategoryColor] = useState('#000000');
  // Estado para modal de edição de categoria
  const [editCategoryModal, setEditCategoryModal] = useState<{
    open: boolean;
    name: string;
    color: string;
  } | null>(null);
  const { notify } = useNotification();
  const auth = useAuth();
  const [sidebarTab, setSidebarTab] = useState<'conta' | 'token'>('conta');
  const [token, setToken] = useState('');
  const [sharedToken, setSharedToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<{ iSee: any[]; seeMe: any[] }>({
    iSee: [],
    seeMe: [],
  });
  const [loadingLinks, setLoadingLinks] = useState(false);
  // Conta
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [newName, setNewName] = useState('');
  // Colaboradores para transmissão de token
  const [transmitCollabs, setTransmitCollabs] = useState<any[]>([]);
  const [selectedTransmitCollab, setSelectedTransmitCollab] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [nameStatus, setNameStatus] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  // Categorias (visual)
  const [categories, setCategories] = useState<
    { name: string; color: string }[]
  >([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState('#000000');
  // Token modal
  const [showTokenModal, setShowTokenModal] = useState(false);

  // Atualiza colaboradores ao abrir o modal de token
  useEffect(() => {
    console.log('Colaboradores recebidos:', links.iSee);
    setCollaborators(
      Array.isArray(links.iSee)
        ? links.iSee.map((u) => ({
            id: String(u.id),
            name: u.name || String(u.id),
          }))
        : []
    );
  }, [links.iSee]);

  // Monta os links ao carregar o componente
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

  const handleGenerateToken = async () => {
    const res = await generateShareToken();
    setToken(res.token);
    setCopied(false);
    await fetchLinks();
  };

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

  const handleUnlink = async (
    otherUserId: string,
    direction: 'i-see' | 'see-me'
  ) => {
    try {
      await unlinkUser(otherUserId, direction);
      await fetchLinks();
    } catch (err: any) {
      notify(err.message || 'Erro ao desvincular usuário', 'error');
    }
  };

  const handleChangeName = () => {
    setEditingName(true);
    setNewName(auth?.user?.name || '');
  };
  const handleChangeEmail = () => {
    setEditingEmail(true);
    setNewEmail(auth?.user?.email || '');
  };
  const handleChangePassword = () => {
    setEditingPassword(true);
    setNewPassword('');
  };
  const handleSaveName = async () => {
    setNameStatus(null);
    try {
      await updatename(newName);
      setNameStatus('Nome alterado com sucesso!');
      if (auth?.user) {
        auth.user.name = newName;
      }
      setEditingName(false);
    } catch (err: any) {
      setNameStatus(err.message || 'Erro ao alterar nome');
    }
  };
  // Email e senha são apenas visuais por enquanto
  const handleSaveEmail = async () => {
    setEmailStatus('Email alterado visualmente!');
    setEditingEmail(false);
  };
  const handleSavePassword = async () => {
    setPasswordStatus('Senha alterada visualmente!');
    setEditingPassword(false);
  };
  // Categorias
  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategories([
        ...categories,
        { name: newCategory, color: newCategoryColor },
      ]);
      setNewCategory('');
    }
  };
  const handleChangeCategoryColor = () => {
    setCategories(
      categories.map((cat) =>
        cat.name === selectedCategory ? { ...cat, color: selectedColor } : cat
      )
    );
  };

  return (
    <div className="px-4 sm:px-8 lg:px-20 2xl:px-40 flex pb-40 bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <UserPanelSidebar activeTab={sidebarTab} onTabChange={setSidebarTab} />

      {/* Conteúdo principal */}
      <main className="flex-1 px-4 grid gap-8">
        {sidebarTab === 'conta' && (
          <>
            {/* Card: Alterar dados */}
            <div className="bg-white dark:bg-slate-900 rounded shadow-md p-6 sm:p-8 flex flex-col gap-4 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Settings size={20} /> Configuração de Conta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Nome */}
                <div>
                  <label className="block font-semibold mb-2">Nome</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={editingName ? newName : auth?.user?.name || ''}
                      onChange={
                        editingName
                          ? (e) => setNewName(e.target.value)
                          : undefined
                      }
                      disabled={!editingName}
                    />
                    {!editingName ? (
                      <button
                        className="btn btn-primary"
                        onClick={handleChangeName}
                      >
                        <Pencil size={16} />
                      </button>
                    ) : (
                      <>
                        <button
                          className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 text-white px-4 py-2 rounded-md transition"
                          onClick={() => setEditingName(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
                          onClick={handleSaveName}
                        >
                          Salvar
                        </button>
                      </>
                    )}
                  </div>
                  {nameStatus && (
                    <div className="text-xs mt-1 text-green-600 dark:text-green-400">
                      {nameStatus}
                    </div>
                  )}
                </div>
                {/* Email */}
                <div>
                  <label className="block font-semibold mb-2">E-mail</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      className="input input-bordered w-full"
                      value={editingEmail ? newEmail : auth?.user?.email || ''}
                      onChange={
                        editingEmail
                          ? (e) => setNewEmail(e.target.value)
                          : undefined
                      }
                      disabled={!editingEmail}
                    />
                    {!editingEmail ? (
                      <button
                        className="btn btn-primary"
                        onClick={handleChangeEmail}
                      >
                        <Pencil size={16} />
                      </button>
                    ) : (
                      <>
                        <button
                          className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 text-white px-4 py-2 rounded-md transition"
                          onClick={() => setEditingEmail(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
                          onClick={handleSaveEmail}
                        >
                          Salvar
                        </button>
                      </>
                    )}
                  </div>
                  {emailStatus && (
                    <div className="text-xs mt-1 text-green-600 dark:text-green-400">
                      {emailStatus}
                    </div>
                  )}
                </div>
                {/* Senha */}
                <div>
                  <label className="block font-semibold mb-2">Senha</label>
                  {!editingPassword ? (
                    <div className="flex gap-2">
                      <input
                        type="password"
                        className="input input-bordered w-full"
                        value="********"
                        disabled
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleChangePassword}
                      >
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
                      <button
                        className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 text-white px-4 py-2 rounded-md transition"
                        onClick={() => setEditingPassword(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
                        onClick={handleSavePassword}
                      >
                        Salvar
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

            {/* Card: Categorias */}
            <div className="bg-white dark:bg-slate-900 rounded shadow-md p-6 sm:p-8 border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Palette size={20} /> Configuração de Categorias
              </h3>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="font-semibold">Criar Categoria</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="Nome da categoria"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      style={{ color: newCategoryColor }}
                    />

                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-12 h-12 p-0 border-none rounded bg-transparent"
                      style={{ cursor: 'pointer' }}
                    />

                    <button
                      className="btn btn-primary"
                      onClick={handleAddCategory}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="font-semibold mb-2 block">Categorias</label>
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {categories.length === 0 ? (
                    <li className="text-slate-400">
                      Nenhuma categoria criada.
                    </li>
                  ) : (
                    categories.map((cat) => (
                      <li
                        key={cat.name}
                        className="py-2 flex items-center gap-2"
                      >
                        <span
                          style={{ color: cat.color }}
                          className="font-medium"
                        >
                          {cat.name}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                          {cat.color}
                        </span>
                        <button
                          className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 text-white px-4 py-2 rounded-md transition"
                          style={{ minWidth: '80px' }}
                          title="Editar categoria"
                          onClick={() =>
                            setEditCategoryModal({
                              open: true,
                              name: cat.name,
                              color: cat.color,
                            })
                          }
                        >
                          <Pencil size={14} /> Editar
                        </button>
                      </li>
                    ))
                  )}
                  {/* Modal de edição de categoria */}
                  {editCategoryModal?.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="bg-white dark:bg-slate-900 rounded shadow-lg p-6 w-full max-w-xs flex flex-col gap-4">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                          <Pencil size={20} /> Editar Categoria
                        </h3>
                        <div className="flex gap-3 items-center mb-2">
                          <input
                            type="text"
                            className="input input-bordered"
                            style={{
                              color: editCategoryModal.color,
                              maxWidth: '260px',
                            }}
                            value={editCategoryModal.name}
                            onChange={(e) =>
                              setEditCategoryModal({
                                ...editCategoryModal,
                                name: e.target.value,
                              })
                            }
                            placeholder="Nome da categoria"
                          />
                          <input
                            type="color"
                            value={editCategoryModal.color}
                            onChange={(e) =>
                              setEditCategoryModal({
                                ...editCategoryModal,
                                color: e.target.value,
                              })
                            }
                            className="w-12 h-12 p-0 border-none bg-transparent"
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 text-white px-4 py-2 rounded-md transition"
                            onClick={() => setEditCategoryModal(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              setCategories(
                                categories.map((cat) =>
                                  cat.name === editCategoryModal.name
                                    ? {
                                        ...cat,
                                        name: editCategoryModal.name,
                                        color: editCategoryModal.color,
                                      }
                                    : cat
                                )
                              );
                              setEditCategoryModal(null);
                            }}
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </ul>
              </div>
            </div>
          </>
        )}

        {sidebarTab === 'token' && (
          <>
            {/* Card: Token */}
            <div className="bg-white dark:bg-slate-900 rounded shadow-md p-6 sm:p-8 flex flex-col gap-4 border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3">
                <span className="text-lg font-bold">
                  Gerencie seu perfil, compartilhamento e vínculos de acesso.
                </span>
                <div className="flex gap-2">
                  <button
                    className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 text-white px-4 py-2 rounded-md transition"
                    onClick={() => setShowTokenModal(true)}
                  >
                    <Settings size={16} /> Configurar Token
                  </button>
                  <button
                    className="btn btn-primary flex items-center gap-2"
                    onClick={handleGenerateToken}
                  >
                    <Plus size={16} /> Gerar Token
                  </button>
                </div>
              </div>
              {/* Removido select de colaboradores para transmissão fora do modal */}
              {/* Lista de colaboradores para transmissão */}
              {transmitCollabs?.length > 0 && (
                <div className="mb-4">
                  <div className="font-semibold mb-2">
                    Colaboradores para transmissão:
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {transmitCollabs.map((c) => (
                      <li
                        key={c.id}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center gap-1"
                      >
                        <User size={16} /> {c.name || c.id}
                        <button
                          className="btn btn-xs btn-error ml-2"
                          onClick={() =>
                            setTransmitCollabs(
                              transmitCollabs.filter((tc) => tc.id !== c.id)
                            )
                          }
                        >
                          <X size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
                    className={`btn w-full sm:w-auto flex items-center gap-2 ${!sharedToken.trim() ? 'bg-gray-400 cursor-not-allowed text-white' : 'btn-primary'}`}
                    onClick={handleUseToken}
                    disabled={!sharedToken.trim()}
                  >
                    <LinkIcon size={18} className="text-white" /> Mesclar
                  </button>
                </div>
              </div>
            </div>

            {/* Card: Vínculos */}
            <div className="bg-white dark:bg-slate-900 rounded shadow-md p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <LinkIcon size={20} className="text-slate-500" /> Vínculos de
                Compartilhamento
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
                              <span className="font-medium">
                                {u.name || u.id}
                              </span>
                            </span>
                            <div className="flex gap-2 items-center">
                              <button
                                className="btn btn-xs border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 text-white rounded-md transition"
                                title="Configurar"
                                onClick={() => {
                                  setShowTokenModal(true);
                                  setSelectedTransmitCollab(String(u.id));
                                }}
                              >
                                <Settings size={20} />
                              </button>
                              <button
                                className="btn btn-xs btn-error bg-red-600 text-white flex items-center gap-1"
                                onClick={() => handleUnlink(u.id, 'i-see')}
                              >
                                <X size={20} />
                              </button>
                            </div>
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
                              <span className="font-medium">
                                {u.name || u.id}
                              </span>
                            </span>
                            <div className="flex gap-2 items-center">
                              <button
                                className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 text-white px-4 py-2 rounded-md transition"
                                title="Configurar"
                                onClick={() => {
                                  setShowTokenModal(true);
                                  setSelectedTransmitCollab(String(u.id));
                                }}
                              >
                                <Settings size={20} />
                              </button>
                              <button
                                className="btn btn-xs btn-error bg-red-600 text-white flex items-center gap-1"
                                onClick={() => handleUnlink(u.id, 'see-me')}
                              >
                                <X size={20} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal de configuração de token (visual, sem funcionalidade ainda) */}
            {showTokenModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-slate-900 rounded shadow-lg p-8 w-full max-w-lg relative">
                  <button
                    className="absolute top-2 right-2 btn btn-xs btn-error"
                    onClick={() => setShowTokenModal(false)}
                  >
                    <X size={16} />
                  </button>
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Settings size={18} /> Configurar Colaboradores do Token
                  </h4>
                  <div className="mb-4">
                    <span className="text-sm font-medium">
                      Selecione colaborador para transmitir:
                    </span>
                    <div className="flex gap-2 mt-2">
                      <select
                        className="select select-full"
                        value={selectedTransmitCollab}
                        onChange={(e) =>
                          setSelectedTransmitCollab(e.target.value)
                        }
                      >
                        {collaborators.length === 0 ? (
                          <option value="">
                            Você ainda não tem colaboradores. Crie um
                            colaborador primeiro.
                          </option>
                        ) : (
                          <>
                            <option value="">Selecione colaborador</option>
                            {collaborators.map((c) => (
                              <option key={c.id} value={String(c.id)}>
                                {c.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          if (
                            selectedTransmitCollab &&
                            !transmitCollabs?.some(
                              (c) => c.id === selectedTransmitCollab
                            )
                          ) {
                            const collab = links.iSee.find(
                              (u) => u.id === selectedTransmitCollab
                            );
                            if (collab)
                              setTransmitCollabs([
                                ...(transmitCollabs || []),
                                collab,
                              ]);
                            setSelectedTransmitCollab('');
                          }
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  {transmitCollabs?.length > 0 && (
                    <div className="mb-4">
                      <div className="font-semibold mb-2">
                        Colaboradores para transmissão:
                      </div>
                      <ul className="flex flex-wrap gap-2">
                        {transmitCollabs.map((c) => (
                          <li
                            key={c.id}
                            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center gap-1"
                          >
                            <User size={16} /> {c.name || c.id}
                            <button
                              className="btn btn-xs btn-error ml-2"
                              onClick={() =>
                                setTransmitCollabs(
                                  transmitCollabs.filter((tc) => tc.id !== c.id)
                                )
                              }
                            >
                              <X size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      className="btn btn-success"
                      onClick={() => setShowTokenModal(false)}
                    >
                      Salvar
                    </button>
                    <button
                      className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 text-white px-4 py-2 rounded-md transition"
                      onClick={() => setShowTokenModal(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
