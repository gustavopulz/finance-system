import { Settings, Link as LinkIcon, User, Palette } from 'lucide-react';

interface UserPanelSidebarProps {
  activeTab: 'account' | 'token' | 'categories';
  onTabChange: (tab: 'account' | 'token' | 'categories') => void;
}

export default function UserPanelSidebar({
  activeTab,
  onTabChange,
}: UserPanelSidebarProps) {
  return (
    <aside className="w-64 bg-slate-50 dark:bg-slate-900 pr-4 flex flex-col gap-3 border-r border-slate-200 dark:border-slate-800 sticky top-6 pt-3 pb-3 self-stretch h-full">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <User size={22} className="text-slate-500" /> Painel do Usuário
      </h2>
      <nav className="flex flex-col gap-2">
        <button
          className={`btn w-full flex items-center gap-2 justify-start whitespace-nowrap ${
            activeTab === 'account' ? 'btn-primary' : 'btn-ghost'
          }`}
          onClick={() => onTabChange('account')}
        >
          <Settings size={18} className="text-slate-500" /> Configuração de Conta
        </button>

        <button
          className={`btn w-full flex items-center gap-2 justify-start whitespace-nowrap ${
            activeTab === 'token' ? 'btn-primary' : 'btn-ghost'
          }`}
          onClick={() => onTabChange('token')}
        >
          <LinkIcon size={18} className="text-slate-500" /> Configuração de Token
        </button>

        <button
          className={`btn w-full flex items-center gap-2 justify-start whitespace-nowrap ${
            activeTab === 'categories' ? 'btn-primary' : 'btn-ghost'
          }`}
          onClick={() => onTabChange('categories')}
        >
          <Palette size={18} className="text-slate-500" /> Configuração de Categorias
        </button>
      </nav>
    </aside>
  );
}
