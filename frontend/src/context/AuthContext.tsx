// File: frontend/src/context/AuthContext.tsx
// React context to manage authentication state and actions

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';

type User = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  workspace_id?: string | null;
  workspace_code?: string | null;
  restaurantId?: string;
};

const normalizeRole = (role?: string): string | undefined => {
  if (!role) return undefined;
  const upper = role.toUpperCase();
  if (upper === 'KITCHEN_STAFF' || upper === 'CHEF' || upper === 'KITCHEN') return 'CHEF';
  if (upper === 'RESTAURANT_OWNER' || upper === 'OWNER') return 'OWNER';
  return upper;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, workspaceCode?: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
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

  const login = async (email: string, password: string, workspaceCode?: string) => {
    const { token: t, user: u } = await authService.login({ email, password, workspaceCode });
    const normalizedUser = { ...u, role: normalizeRole(u.role) || u.role };
    localStorage.setItem('auth_token', t);
    localStorage.setItem('auth_user', JSON.stringify(normalizedUser));
    setToken(t);
    setUser(normalizedUser);
    navigate('/dashboard');
  };

  const register = async (payload: any) => {
    const { token: t, user: u } = await authService.register(payload);
    const normalizedUser = { ...u, role: normalizeRole(u.role) || u.role };
    localStorage.setItem('auth_token', t);
    localStorage.setItem('auth_user', JSON.stringify(normalizedUser));
    setToken(t);
    setUser(normalizedUser);
    navigate('/dashboard');
  };

  useEffect(() => {
    if (!token || !user?.workspace_id) return;
    
    const sseUrl = `${API_BASE}/workspace/updates?token=${token}`;
    console.log('Connecting to SSE Updates at:', sseUrl);
    
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(sseUrl);
      
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log('SSE update received:', payload.type, payload.data);
          
          window.dispatchEvent(new CustomEvent(payload.type, { detail: payload.data }));
          
          if (payload.type === 'ordersUpdated') {
            window.dispatchEvent(new CustomEvent('ordersUpdated'));
          } else if (payload.type === 'tablesUpdated') {
            window.dispatchEvent(new CustomEvent('tablesUpdated'));
          } else if (payload.type === 'reservationsUpdated') {
            window.dispatchEvent(new CustomEvent('reservationsUpdated'));
          } else if (payload.type === 'employeesUpdated') {
            window.dispatchEvent(new CustomEvent('employeesUpdated'));
          } else if (payload.type === 'inventoryUpdated') {
            window.dispatchEvent(new CustomEvent('inventoryUpdated'));
          }
        } catch (e) {
          // ignore heartbeats
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE EventSource error:', err);
      };
    } catch (err) {
      console.error('Failed to create EventSource:', err);
    }
    
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [token, user?.workspace_id]);

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
