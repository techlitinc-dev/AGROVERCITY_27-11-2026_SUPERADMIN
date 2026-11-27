import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, clearSession, getAccessToken, getRefreshToken, persistSession, type AuthUser } from '../lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  bootstrapping: boolean;
  login: (phone: string, mpin: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      if (!getAccessToken()) {
        setBootstrapping(false);
        return;
      }
      try {
        setUser(await api.me());
        return;
      } catch {
        // fall through to refresh
      }
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const renewed = await api.refresh(refreshToken);
          persistSession(renewed.accessToken, renewed.refreshToken);
          setUser(await api.me());
          return;
        } catch {
          // refresh failed — clear and stay logged out
        }
      }
      clearSession();
      setUser(null);
      setBootstrapping(false);
    };
    void bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    persistSession(res.accessToken, res.refreshToken);
    setUser(res.user);
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await api.logout(refreshToken);
      } catch {
        // best effort — local session is cleared regardless
      }
    }
    clearSession();
    setUser(null);
  };

  const refreshUser = async () => {
    setUser(await api.me());
  };

  return (
    <AuthContext.Provider value={{ user, bootstrapping, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
