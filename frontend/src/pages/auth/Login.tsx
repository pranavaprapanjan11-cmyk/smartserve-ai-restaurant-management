// File: frontend/src/pages/auth/Login.tsx
// Simple login page using AuthContext and authService

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Sign In</h2>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full border p-2 rounded" />
        </div>
        <div>
          <button className="w-full bg-blue-600 text-white py-2 rounded">Sign In</button>
        </div>
      </form>
    </div>
  );
};

export default Login;
