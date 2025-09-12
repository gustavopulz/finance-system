import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import type { JSX } from 'react';

import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import UserPanelPage from './pages/UserPanelPage';
import { useAuth } from './context/AuthContext';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import NotificationBar from './components/NotificationBar';
import {
  NotificationProvider,
  useNotification,
} from './context/NotificationContext';
import Footer from './components/Footer';
import InfoPage from './pages/InfoPage';
import NotFoundPage from './pages/errors/404';
import MaintenancePage from './pages/errors/MaintenancePage';
import RegisterPage from './pages/auth/RegisterPage';
import PoliticasPage from './pages/PrivacyPage';
import DashboardPage from './pages/DashboardPage';

import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';

// 🔒 AdminRoute separado (continua igual)
function AdminRoute({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  if (!auth || !auth.user) return <Navigate to="/login" />;
  if (auth.user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

function AppWithHeader() {
  const location = useLocation();
  const hideHeader =
    location.pathname === '/login' ||
    location.pathname === '/404' ||
    location.pathname === '/register' ||
    location.pathname === '/manutencao';

  const auth = useAuth();
  const { notifications, remove } = useNotification();

  return (
    <>
      <NotificationBar notifications={notifications} onRemove={remove} />
      {!hideHeader && <Header />}
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 py-6">
          <Routes>
            {/* Página de manutenção */}
            <Route path="/manutencao" element={<MaintenancePage />} />
            {/* Rotas públicas */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Rotas privadas */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <HomePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/summary"
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
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/user-settings"
              element={
                <PrivateRoute>
                  <UserPanelPage />
                </PrivateRoute>
              }
            />

            {/* Rota admin */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />

            {/* Rotas livres */}
            <Route path="/politicas-e-termos" element={<PoliticasPage />} />
            <Route path="/404" element={<NotFoundPage />} />

            {/* Catch-all */}
            <Route
              path="*"
              element={
                auth?.loading ? (
                  <div>Carregando...</div>
                ) : !auth?.user ? (
                  <Navigate to="/login" replace />
                ) : (
                  <Navigate to="/404" replace />
                )
              }
            />
          </Routes>
        </main>
        {!hideHeader && <Footer />}
      </div>
    </>
  );
}

function App() {
  return (
    <NotificationProvider>
      <Router>
        <AppWithHeader />
      </Router>
    </NotificationProvider>
  );
}

export default App;
