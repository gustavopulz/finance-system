// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const { user } = await import('../lib/api').then(mod => mod.getCurrentUser());
        if (user && user.id && user.username && user.role) {
          setUser({ id: user.id, username: user.username, role: user.role });
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

  const login = async (username: string, password: string) => {
    try {
      // Chama o login da API
      const { user } = await import('../lib/api').then(mod => mod.login(username, password));
      if (user && user.id && user.username && user.role) {
        setUser({ id: user.id, username: user.username, role: user.role });
      } else {
        setUser(null);
        throw new Error('Usuário inválido');
      }
    } catch (err) {
      setUser(null);
      throw err;
    }
    setToken(null);
  };

  const logout = async () => {
    await import('../lib/api').then(mod => mod.logout());
    setUser(null);
    setToken(null);
  };

  const isAuthenticated = () => !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
