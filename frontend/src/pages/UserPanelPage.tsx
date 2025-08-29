import { useState } from 'react';
import UserPanelSidebar from '../components/UserPanel/Sidebar';
import AccountSettings from '../components/UserPanel/AccountSettings';
import TokenSettings from '../components/UserPanel/TokenSettings';
import CategorySettings from '../components/UserPanel/CategorySettings';

export default function UserPanelPage() {
  const [activeTab, setActiveTab] = useState<'account' | 'token' | 'categories'>('account');

  return (
    <div className="px-4 sm:px-8 lg:px-20 2xl:px-40 flex pb-40 bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <UserPanelSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Conteúdo principal */}
      <main className="flex-1 px-4 grid gap-8">
        {activeTab === 'account' && <AccountSettings />}
        {activeTab === 'token' && <TokenSettings active={true} />}
        {activeTab === 'categories' && <CategorySettings />}
      </main>
    </div>
  );
}
