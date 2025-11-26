import { useState } from "react";
import UserPanelSidebar from "../components/UserPanel/Sidebar";
// import { Menu } from "lucide-react";
import AccountSettings from "../components/UserPanel/AccountSettings";
import TokenSettings from "../components/UserPanel/TokenSettings";
import CategorySettings from "../components/UserPanel/CategorySettings";

export default function UserPanelPage() {
  const [activeTab, setActiveTab] = useState<
    "account" | "token" | "categories"
  >("account");

  return (
    <div className="relative px-0 sm:px-8 lg:px-20 flex pb-40 bg-slate-50 dark:bg-slate-900 min-h-screen flex-col">
      <div className="w-full flex gap-2 md:hidden justify-center px-4 pt-4">
        <button
          className={`flex-1 px-4 py-2 rounded-full shadow-lg border text-sm font-medium transition-colors focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none ${
            activeTab === "account"
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          }`}
          onClick={() => setActiveTab("account")}
        >
          Configurar Conta
        </button>
        <button
          className={`flex-1 px-4 py-2 rounded-full shadow-lg border text-sm font-medium transition-colors focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none ${
            activeTab === "token"
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          }`}
          onClick={() => setActiveTab("token")}
        >
          Configurar Tokens
        </button>
      </div>

      <div className="flex flex-1 w-full">
        <aside
          className="hidden md:block md:static md:w-70 md:bg-slate-50 md:dark:bg-slate-900 md:shadow-none"
          style={{ maxWidth: 300 }}
        >
          <UserPanelSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </aside>

        <div className="w-px bg-slate-300 dark:bg-slate-800 mx-2 self-stretch hidden md:block" />

        <main className="px-4 mt-4 md:mt-0 w-full">
          {activeTab === "account" && <AccountSettings />}
          {activeTab === "token" && <TokenSettings active={true} />}
          {activeTab === "categories" && <CategorySettings />}
        </main>
      </div>
    </div>
  );
}
