import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import type { JSX } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import UserPanelPage from './pages/UserPanelPage';
import { useAuth } from './context/AuthContext';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import InfoPage from './pages/InfoPage';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  if (auth?.loading) return null;
  return auth && auth.user ? children : <Navigate to="/login" />;
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
    <Router>
      <AppWithHeader />
    </Router>
  );
}

export default App;
