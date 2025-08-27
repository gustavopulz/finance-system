import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import type { JSX } from 'react';
import LoginPage from './pages/LoginPage';
import UserPanelPage from './pages/UserPanelPage';
import { useAuth } from './context/AuthContext';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import InfoPage from './pages/InfoPage';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  if (auth?.loading) return null;
  return auth && auth.user ? children : <Navigate to="/login" replace />;
}

// Rota privada só para admin
function AdminRoute({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  if (!auth || !auth.user) return <Navigate to="/login" replace />;
  if (auth.user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
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
                <Navigate to="/summary" replace />
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
          <Route
            path="*"
            element={
              <PrivateRoute>
                <Navigate to="/errors/404" replace />
              </PrivateRoute>
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
