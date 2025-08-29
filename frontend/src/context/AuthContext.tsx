import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../lib/api';

interface User {
  id: string;
  role: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔒 Handlers globais configurados no api.ts
  useEffect(() => {
    api.setAuthFailureHandler(() => {
      logout();
    });

    api.setUserRefreshHandler((user) => {
      setUser({
        id: String(user.id),
        email: String(user.email),
        role: String(user.role),
        name: String(user.name),
      });
    });
  }, []);

  // 🔄 Puxa usuário inicial
  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await api.getCurrentUser();
        if (data?.id && data?.email && data?.role && data?.name) {
          setUser({
            id: String(data.id),
            email: String(data.email),
            role: String(data.role),
            name: String(data.name),
          });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    if (data?.user) {
      setUser({
        id: String(data.user.id),
        email: String(data.user.email),
        role: String(data.user.role),
        name: String(data.user.name),
      });
    } else {
      throw new Error('Usuário inválido');
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    setUser(null);
  };

  const updateEmail = async (email: string) => {
    const res = await api.updateUserEmail(email);
    if (res?.success) {
      setUser({
        id: res.id,
        email: res.email,
        role: res.role,
        name: res.name,
      });
    }
  };

  const updateName = async (name: string) => {
    const res = await api.updateName(name);
    if (res?.success) {
      setUser({
        id: res.id,
        email: res.email,
        role: res.role,
        name: res.name,
      });
    }
  };

  const updatePassword = async (password: string) => {
    const res = await api.updateUserPassword(password);
    if (!res?.success) {
      throw new Error('Erro ao alterar senha');
    }
  };

  const isAuthenticated = () => !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateEmail,
        updateName,
        updatePassword,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
