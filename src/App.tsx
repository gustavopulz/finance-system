import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  NavLink,
  useLocation,
} from 'react-router-dom';
import type { JSX } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import UserPanelPage from './pages/UserPanelPage';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import InfoPage from './pages/InfoPage';

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

function AppWithHeader() {
  const location = useLocation();
  const hideHeader = location.pathname === '/login';
  return (
    <>
      {!hideHeader && <Header />}
      <main className="container-app py-6">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/info"
            element={
              <PrivateRoute>
                <InfoPage />
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
          <Route
            path="/usuario"
            element={
              <PrivateRoute>
                <UserPanelPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppWithHeader />
      </Router>
    </AuthProvider>
  );
}

export default App;
