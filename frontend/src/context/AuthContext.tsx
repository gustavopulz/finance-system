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
    // Try to get user info from backend using cookie
    async function fetchUser() {
      try {
        const res = await fetch('http://localhost:3000/api/users/me', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.username && data?.id && data?.role) {
            setUser({ id: data.id, username: data.username, role: data.role });
          } else {
            setUser(null);
          }
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

  const login = (token: string, user: User) => {
  setUser(user);
  setToken(null); // token is not stored client-side
  };

  const logout = () => {
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
