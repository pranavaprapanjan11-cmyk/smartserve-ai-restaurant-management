// File: frontend/src/pages/auth/Register.tsx
// Registration page for new users

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const roles = [
  'OWNER',
  'MANAGER',
  'CASHIER',
  'WAITER',
  'CHEF',
];

const Register: React.FC = () => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(roles[4]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register({ name, email, password, role });
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Create an account</h2>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border p-2 rounded">
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <button className="w-full bg-green-600 text-white py-2 rounded">Register</button>
        </div>
      </form>
    </div>
  );
};

export default Register;
