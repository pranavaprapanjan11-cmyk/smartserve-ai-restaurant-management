// File: frontend/src/context/AuthContext.tsx
// React context to manage authentication state and actions

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

type User = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
};

const normalizeRole = (role?: string): string | undefined => {
  if (!role) return undefined;
  if (role === 'KITCHEN_STAFF' || role === 'CHEF') return 'CHEF';
  if (role === 'RESTAURANT_OWNER' || role === 'OWNER') return 'OWNER';
  return role;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; role: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem('auth_token');
    const u = localStorage.getItem('auth_user');
    if (t && u) {
      setToken(t);
      try {
        const parsed = JSON.parse(u);
        setUser({ ...parsed, role: normalizeRole(parsed.role) || parsed.role });
      } catch (e) {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { token: t, user: u } = await authService.login({ email, password });
    const normalizedUser = { ...u, role: normalizeRole(u.role) || u.role };
    localStorage.setItem('auth_token', t);
    localStorage.setItem('auth_user', JSON.stringify(normalizedUser));
    setToken(t);
    setUser(normalizedUser);
    navigate('/dashboard');
  };

  const register = async (payload: { name: string; email: string; password: string; role: string }) => {
    const { token: t, user: u } = await authService.register(payload);
    const normalizedUser = { ...u, role: normalizeRole(u.role) || u.role };
    localStorage.setItem('auth_token', t);
    localStorage.setItem('auth_user', JSON.stringify(normalizedUser));
    setToken(t);
    setUser(normalizedUser);
    navigate('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    navigate('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
