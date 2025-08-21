import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  NavLink,
} from 'react-router-dom';
import type { JSX } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminPage from './pages/AdminPage';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  return auth && auth.user ? children : <Navigate to="/login" />;
}

// Rota privada só para admin
function AdminRoute({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  if (!auth || !auth.user) return <Navigate to="/login" />;
  if (auth.user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

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

function Header() {
  const { theme, setTheme } = useTheme();
  const auth = useAuth();

  return (
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
          <NavLink to="/admin" className="btn btn-ghost">
            Admin
          </NavLink>
          {!auth?.user ? (
            <NavLink to="/login" className="btn btn-ghost">
              Login
            </NavLink>
          ) : (
            <button
              onClick={() => auth.logout()}
              className="btn btn-ghost text-red-500"
            >
              <LogOut size={18} className="mr-1" />
              Sair
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Claro' : 'Escuro'}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <main className="container-app py-6">
          <Routes>
            {/* Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Páginas protegidas */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <HomePage />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />

            {/* Qualquer rota desconhecida manda para "/" */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}
