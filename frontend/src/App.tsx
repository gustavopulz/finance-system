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
import Footer from './components/Footer';
import InfoPage from './pages/InfoPage';
import NotFoundPage from './pages/errors/404';
import RegisterPage from './pages/RegisterPage';
import PoliticasPage from './pages/PrivacyPage';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  if (auth?.loading) return null;
  if (!auth || !auth.user) {
    return <Navigate to="/login" />;
  }
  return children;
}

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
    location.pathname === '/register';
  const auth = useAuth();

  return (
    <>
      {!hideHeader && <Header />}
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 py-6">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
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
              path="/user-settings"
              element={
                <PrivateRoute>
                  <UserPanelPage />
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
            <Route path="/politicas-e-termos" element={<PoliticasPage />} />
            <Route path="/404" element={<NotFoundPage />} />
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
    <Router>
      <AppWithHeader />
    </Router>
  );
}

export default App;
