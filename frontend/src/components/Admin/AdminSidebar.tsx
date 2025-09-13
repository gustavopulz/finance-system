import { useNavigate, useLocation } from 'react-router-dom';

interface AdminSidebarProps {
  sidebarOpen?: boolean;
}

export default function AdminSidebar({
  sidebarOpen = true,
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      label: 'Administração',
      path: '/admin',
    },
    {
      label: 'Notificações',
      path: '/admin/notificacoes',
    },
  ];

  return (
    <aside
      className={`w-64 bg-slate-50 dark:bg-slate-900 pr-4 flex flex-col gap-3 pt-3 pb-3 sticky top-6 transition-all duration-300${sidebarOpen ? '' : ' hidden'}`}
      style={{ height: 'auto', alignSelf: 'flex-start' }}
    >
      <nav>
        <ul className="flex flex-col gap-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <button
                className={`w-full text-left px-3 py-2 rounded border transition-all text-base font-medium
                  ${
                    location.pathname === item.path
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-200'
                      : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white'
                  }
                `}
                onClick={() => {
                  if (location.pathname !== item.path) {
                    navigate(item.path);
                  }
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
