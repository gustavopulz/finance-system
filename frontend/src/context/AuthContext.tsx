import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../lib/api';
import type { User } from '../lib/types';

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

  useEffect(() => {
    api.setAuthFailureHandler(() => {
      logout();
    });

    api.setUserRefreshHandler((user) => {
      setUser(api.normalizeUser(user));
    });
  }, []);

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await api.getCurrentUser();
        setUser(api.normalizeUser(data));
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    const normalized = api.normalizeUser(data.user);
    if (normalized) {
      setUser(normalized);
    } else {
      throw new Error('Credenciais inválidas');
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const updateEmail = async (email: string) => {
    const res = await api.updateUserEmail(email);
    if (res?.success) {
      setUser(api.normalizeUser(res));
    }
  };

  const updateName = async (name: string) => {
    const res = await api.updateName(name);
    if (res?.success) {
      setUser(api.normalizeUser(res));
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
