import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    // fallback: prefere o SO
    const prefersDark = window.matchMedia?.(
      '(prefers-color-scheme: dark)'
    ).matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}

export default function App() {
  const { theme, setTheme } = useTheme();

  return (
    <BrowserRouter>
      <header className="border-b bg-white dark:bg-slate-900 dark:border-slate-800">
        <div className="container-app flex items-center justify-between py-4">
          <NavLink
            to="/"
            className="text-lg font-bold text-brand-700 dark:text-brand-400"
          >
            Finanças • moAI
          </NavLink>
          <nav className="flex items-center gap-2">
            <NavLink to="/" className="btn btn-ghost">
              Início
            </NavLink>

            <button
              className="btn btn-ghost"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              {theme === 'dark' ? 'Claro' : 'Escuro'}
            </button>
          </nav>
        </div>
      </header>

      <main className="container-app py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </main>

      <footer className="border-t py-6 text-center text-xs text-slate-500 dark:text-slate-400 dark:border-slate-800">
        Feito com React + Vite + TS + Tailwind 3.4
      </footer>
    </BrowserRouter>
  );
}
