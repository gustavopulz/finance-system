import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import type { JSX } from 'react';

export default function PrivateRoute({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  if (auth?.loading) return null; // ou um loader/spinner
  if (!auth?.user) return <Navigate to="/login" replace />;
  return children;
}
