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
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.user) {
          setUser(parsed.user);
        }
        if (parsed?.token) {
          setToken(parsed.token);
        }
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = (token: string, user: User) => {
    const authData = { token, user };
    localStorage.setItem('auth', JSON.stringify(authData));
    setUser(user);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem('auth');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
