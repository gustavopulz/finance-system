import { NavLink } from 'react-router-dom';
import { Moon, Sun, LogOut, LayoutDashboard } from 'lucide-react';
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
      to: '/info',
      label: 'Dashboard',
      icon: null,
    },
    auth?.user
      ? {
          type: 'link',
          to: '/usuario',
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
          <NavLink to="/dashboard" className="btn btn-primary">
            Dashboard
          </NavLink>
          <NavLink to="/summary" className="btn btn-secondary">
            Resumo
          </NavLink>
        </div>
        {/* User and Settings */}
        <div className="hidden md:flex items-center gap-4">
          <NavLink to="/settings" className="btn btn-ghost">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3 15.4a1.65 1.65 0 0 0-1.51-1H1a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h.09c.5 0 .96-.2 1.31-.55A1.65 1.65 0 0 0 3 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06c.36.36.86.55 1.36.55h.09a1.65 1.65 0 0 0 1.51-1V3a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v.09c0 .5.2.96.55 1.31A1.65 1.65 0 0 0 15.4 3a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.36.36-.55.86-.55 1.36v.09c0 .5.2.96.55 1.31A1.65 1.65 0 0 0 21 8.6a1.65 1.65 0 0 0 1.51 1H23a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.09c-.5 0-.96.2-1.31.55A1.65 1.65 0 0 0 19.4 15z" />
            </svg>
          </NavLink>
          <div className="relative">
            <button
              className="btn btn-ghost flex items-center"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </button>
            {mobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 shadow-lg rounded-md">
                <div className="p-4">
                  <p className="text-sm font-medium">{auth?.user?.username}</p>
                  <p className="text-xs text-gray-500">
                    Cargo: {auth?.user?.role}
                  </p>
                </div>
                {auth?.user?.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    Painel Admin
                  </NavLink>
                )}
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  Modo: {theme === 'dark' ? 'Claro' : 'Escuro'}
                </button>
                {auth && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-slate-700"
                    onClick={() => auth.logout()}
                  >
                    Desconectar
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
