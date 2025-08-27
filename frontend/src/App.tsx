import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import type { JSX } from 'react';
import HomePage from './pages/SumarryPage';
import LoginPage from './pages/LoginPage';
import UserPanelPage from './pages/UserPanelPage';
import { useAuth } from './context/AuthContext';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import InfoPage from './pages/InfoPage';
import NotFoundPage from './pages/errors/404';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  if (auth?.loading) return null;
  if (!auth || !auth.user) {
    // Redireciona para login se não estiver autenticado
    return <Navigate to="/login" />;
  }
  return children;
}

// Rota privada só para admin
function AdminRoute({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  if (!auth || !auth.user) return <Navigate to="/login" />;
  if (auth.user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

function AppWithHeader() {
  const location = useLocation();
  const hideHeader = location.pathname === '/login';
  const auth = useAuth();

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
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
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

          <Route
            path="*"
            element={
              auth?.loading ? (
                <div>Carregando...</div>
              ) : !auth?.user ? (
                <Navigate to="/login" replace />
              ) : (
                <NotFoundPage />
              )
            }
          />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppWithHeader />
    </Router>
  );
}

export default App;
