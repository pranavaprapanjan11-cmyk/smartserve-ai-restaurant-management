// File: frontend/src/services/authService.ts
// Small service wrapper for authentication API calls

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export interface AuthResponse {
  token: string;
  user: any;
}

export async function register(payload: { name: string; email: string; password: string; role: string }) {
  const res = await axios.post<AuthResponse>(`${API_BASE}/auth/register`, payload);
  return res.data;
}

export async function login(payload: { email: string; password: string }) {
  const res = await axios.post<AuthResponse>(`${API_BASE}/auth/login`, payload);
  return res.data;
}

export async function fetchMe(token: string) {
  const res = await axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}
