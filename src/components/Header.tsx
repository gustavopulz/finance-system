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

  return (
    <header className="border-b bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="container-app flex items-center justify-between py-4">
        <NavLink
          to="/"
          className="text-lg font-bold text-brand-700 dark:text-brand-400"
        >
          Finanças
        </NavLink>
        <nav className="flex items-center gap-2">
          <button
            className="btn btn-ghost"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Claro' : 'Escuro'}
          </button>
          {auth?.user && (
            <NavLink to="/usuario" className="btn btn-ghost">
              <span className="mr-1">👤</span>
              Minha Conta
            </NavLink>
          )}
          {auth?.user?.role === 'admin' && (
            <NavLink to="/admin" className="btn btn-ghost">
              <LayoutDashboard size={18} className="mr-1" />
              Painel Admin
            </NavLink>
          )}
          {auth?.user && (
            <button
              onClick={() => auth.logout()}
              className="btn btn-ghost text-red-500"
            >
              <LogOut size={18} className="mr-1" />
              Sair
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
