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
    <header className="px-4 2xl:px-60 lg:px-20 border-b bg-white dark:bg-slate-900 dark:border-slate-800">
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
        {/* Desktop menu */}
        <nav className="hidden md:flex items-center gap-2">
          {menuLinks.map((item, idx) => {
            if (item.type === 'link' && item.to) {
              return (
                <NavLink key={idx} to={item.to} className="btn btn-ghost">
                  {item.icon}
                  {item.label}
                </NavLink>
              );
            } else if (item.type === 'button' && item.onClick) {
              return (
                <button
                  key={idx}
                  className={`btn btn-ghost ${item.className || ''}`}
                  onClick={item.onClick}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            }
            return null;
          })}
        </nav>
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
