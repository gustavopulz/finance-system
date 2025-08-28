import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import type { JSX } from 'react';

export default function PublicRoute({ children }: { children: JSX.Element }) {
  const auth = useAuth();

  if (!auth) return null;

  if (auth.loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <span className="text-slate-500">Carregando...</span>
      </div>
    );
  }

  // 🚫 se já estiver logado → redireciona para a home/painel
  if (auth.user) {
    return <Navigate to="/" replace />;
  }

  // ✅ se não estiver logado → pode acessar a rota
  return children;
}
