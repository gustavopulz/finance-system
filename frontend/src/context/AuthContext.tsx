import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../lib/api';

interface User {
  id: number;
  role: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🚀 Checa usuário logado ao montar
  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await api.getCurrentUser();
        if (data?.id && data?.email && data?.role && data?.name) {
          setUser({
            id: data.id,
            email: String(data.email),
            role: String(data.role),
            name: String(data.name),
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  // 🔑 Login
  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    if (data?.user) {
      setUser({
        id: data.user.id,
        email: String(data.user.email),
        role: String(data.user.role),
        name: String(data.user.name),
      });
    } else {
      throw new Error('Usuário inválido');
    }
  };

  // 🚪 Logout
  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  // 🔒 Helper
  const isAuthenticated = () => !!user;

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
