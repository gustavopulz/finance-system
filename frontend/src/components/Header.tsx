import { NavLink } from 'react-router-dom';
import {
  Moon,
  Sun,
  LogOut,
  LayoutDashboard,
  User,
  Settings,
  PieChart,
} from 'lucide-react'; // Added User and Settings icons
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    theme === 'dark'
      ? root.classList.add('dark')
      : root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}

export default function Header() {
  const { theme, setTheme } = useTheme();
  const auth = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Links do menu
  const menuLinks = [
    {
      type: 'link',
      to: '/summary',
      label: 'Resumo',
      icon: <PieChart size={18} className="mr-1" />,
    },
    {
      type: 'link',
      to: '/info',
      label: 'Dashboard',
      icon: null,
    },
    auth?.user
      ? {
          type: 'link',
          to: '/user-settings',
          label: 'Minha Conta',
          icon: (
            <span className="mr-1">
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="inline-block align-middle"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </span>
          ),
        }
      : null,
    auth?.user?.role === 'admin'
      ? {
          type: 'link',
          to: '/admin',
          label: 'Painel Admin',
          icon: <LayoutDashboard size={18} className="mr-1" />,
        }
      : null,
    {
      type: 'button',
      onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      label: theme === 'dark' ? 'Claro' : 'Escuro',
      icon: theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />,
    },
    auth?.user
      ? {
          type: 'button',
          onClick: () => auth.logout(),
          label: 'Sair',
          icon: <LogOut size={18} className="mr-1" />,
          className: 'text-red-500',
        }
      : null,
  ].filter((item): item is Exclude<typeof item, null> => !!item);

  return (
    <header className="mx-auto px-4 2xl:px-40 lg:px-20 border-b bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="container-app flex items-center justify-between py-4">
        <NavLink
          to="/"
          className="text-lg font-bold text-brand-700 dark:text-brand-400 flex items-center"
        >
          <img
            src={
              theme === 'dark'
                ? '/finance-system-logo.png'
                : '/finance-system-logo-light.png'
            }
            alt="Finance System Logo"
            className="h-auto w-32 mr-2"
          />
        </NavLink>
        {/* Dashboard and Summary buttons */}
        <div className="hidden md:flex items-center gap-4">
          <NavLink
            to="/summary"
            className={({ isActive }) => {
              const isRoot = window.location.pathname === '/';
              return `${isActive || isRoot ? 'text-blue-500' : 'text-white'}`;
            }}
          >
            Resumo
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${isActive ? 'text-blue-500' : 'text-white'}`
            }
          >
            Dashboard
          </NavLink>
        </div>
        {/* User and Settings */}
        <div className="hidden md:flex items-center gap-4">
          <NavLink
            to="/user-settings"
            className={({ isActive }) =>
              `btn btn-ghost flex items-center ${isActive ? 'text-blue-500' : 'text-white'}`
            }
          >
            <Settings size={24} />
          </NavLink>
          <div
            className="relative group flex items-center gap-2"
            onMouseEnter={() => setMobileMenuOpen(true)}
            onMouseLeave={() => setMobileMenuOpen(false)}
          >
            <button className="btn btn-ghost flex items-center">
              <User size={24} className="text-white" />
            </button>
            {mobileMenuOpen && (
              <div className="absolute right-0 mt-0 w-48 bg-white dark:bg-slate-800 shadow-lg rounded z-50">
                <div className="pt-4 px-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {auth?.user?.name || 'Usuário'}
                  </p>
                  <p
                    className={`text-xs ${
                      auth?.user?.role === 'admin'
                        ? 'text-red-500'
                        : 'text-blue-500'
                    }`}
                  >
                    {auth?.user?.role === 'admin' ? 'Admin' : 'Usuário'}
                  </p>
                </div>
                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                <NavLink
                  to="/user-settings"
                  className="flex px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 items-center gap-2"
                >
                  <Settings size={16} /> Configurações
                </NavLink>
                {auth?.user?.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    className="flex px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 items-center gap-2"
                  >
                    <LayoutDashboard size={16} /> Admin
                  </NavLink>
                )}
                <button
                  className="flex w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 items-center gap-2"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}{' '}
                  {theme === 'dark' ? 'Claro' : 'Escuro'}
                </button>
                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                {auth && (
                  <button
                    className="flex w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-slate-700 items-center gap-2"
                    onClick={() => auth.logout()}
                  >
                    <LogOut size={16} /> Desconectar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Mobile menu button */}
        <button
          className="md:hidden btn btn-ghost"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Abrir menu"
        >
          <svg
            width="28"
            height="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
      </div>
      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <nav className="md:hidden flex flex-col gap-2 px-4 pb-4 animate-fade-in">
          {menuLinks.map((item, idx) => {
            if (item.type === 'link' && item.to) {
              return (
                <NavLink
                  key={idx}
                  to={item.to}
                  className="btn btn-ghost w-full justify-start"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              );
            } else if (item.type === 'button' && item.onClick) {
              return (
                <button
                  key={idx}
                  className={`btn btn-ghost w-full justify-start ${item.className || ''}`}
                  onClick={() => {
                    item.onClick && item.onClick();
                    setMobileMenuOpen(false);
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            }
            return null;
          })}
        </nav>
      )}
    </header>
  );
}
