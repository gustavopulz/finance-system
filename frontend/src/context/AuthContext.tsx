// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.user) {
          setUser(parsed.user);
        }
      } catch {}
    }
  }, []);

  const login = (token: string, user: User) => {
    const authData = { token, user };
    localStorage.setItem('auth', JSON.stringify(authData));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('auth');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
