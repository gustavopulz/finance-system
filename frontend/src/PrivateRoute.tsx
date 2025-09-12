import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import type { JSX } from 'react';

export default function PrivateRoute({ children }: { children: JSX.Element }) {
  const auth = useAuth();

  if (!auth) return null; // fallback se o contexto não existir

  // 🔄 Enquanto verifica sessão
  if (auth.loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <span className="text-slate-500">Carregando...</span>
      </div>
    );
  }

  // 🚪 Se não estiver logado, manda pro login
  if (!auth.user) {
    return <Navigate to="/login" replace />;
  }

  // 🚧 Se for membro, redireciona para manutenção
  // if (auth.user.role !== 'admin') {
  //   return <Navigate to="/manutencao" replace />;
  // }
  
  // ✅ Senão, renderiza a rota protegida
  return children;
}
