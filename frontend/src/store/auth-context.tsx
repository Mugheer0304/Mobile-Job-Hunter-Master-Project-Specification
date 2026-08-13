'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { api } from '@/lib/api';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/lib/auth';
import type { SafeUser, AuthResponse } from '@/types';

interface AuthContextValue {
  user: SafeUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount by fetching /auth/me if a token exists.
  useEffect(() => {
    const token = getAccessToken();
    if (!token || !getRefreshToken()) {
      setLoading(false);
      return;
    }
    api
      .get<SafeUser & { profile: unknown }>('/auth/me')
      .then((u) => setUser(u))
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    const res = await api.post<AuthResponse>('/auth/register', { email, password, fullName });
    setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
