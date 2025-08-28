import { useState, useEffect } from 'react';
import { generateShareToken, useShareToken, getLinks, unlinkUser } from '../../lib/api';
import { Settings, Plus, Link as LinkIcon, Eye, User, X, Lock } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import SkeletonCard from '../SkeletonCard';

export default function TokenSettings() {
  const { notify } = useNotification();
  const [token, setToken] = useState('');
  const [sharedToken, setSharedToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<{ iSee: any[]; seeMe: any[] }>({ iSee: [], seeMe: [] });
  const [loadingLinks, setLoadingLinks] = useState(false);

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

  const handleUnlink = async (id: string, direction: 'i-see' | 'see-me') => {
    try {
      await unlinkUser(id, direction);
      await fetchLinks();
    } catch (err: any) {
      notify(err.message || 'Erro ao desvincular usuário', 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded shadow-md p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Settings size={20} /> Configuração de Token
      </h3>

      <button className="btn btn-primary mb-4 flex items-center gap-2" onClick={handleGenerateToken}>
        <Plus size={16} /> Gerar Token
      </button>

      {token && (
        <div className="flex gap-2 mb-4">
          <input type="text" className="input input-bordered w-full" value={token} readOnly />
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
            onChange={(e) => setSharedToken(e.target.value)}
          />
          <button className="btn btn-primary" disabled={!sharedToken.trim()} onClick={handleUseToken}>
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
                <div key={u.id} className="flex justify-between items-center border-b py-1">
                  <span className="flex gap-2 items-center">
                    <User size={16} /> {u.name || u.id}
                  </span>
                  <button className="btn btn-xs btn-error" onClick={() => handleUnlink(u.id, 'i-see')}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Vê sua conta */}
            <div>
              <h5 className="font-semibold mb-2">Vê sua conta:</h5>
              {links.seeMe.map((u) => (
                <div key={u.id} className="flex justify-between items-center border-b py-1">
                  <span className="flex gap-2 items-center">
                    <Lock size={16} /> {u.name || u.id}
                  </span>
                  <button className="btn btn-xs btn-error" onClick={() => handleUnlink(u.id, 'see-me')}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
