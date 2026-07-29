import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceCode, setWorkspaceCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password, workspaceCode ? workspaceCode.trim().toUpperCase() : undefined);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F6B4B] px-4 py-16 text-[#111827]">
      <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_4px_18px_rgba(0,0,0,0.08)] space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7D6E6] border border-[#E8B9CF] text-[#4A1D35] text-base font-extrabold shadow-sm">
            SS
          </div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Sign in to SmartServe AI</h2>
          <p className="text-xs text-[#4B5563] font-medium">
            Or{' '}
            <Link to="/auth/register" className="text-[#0F6B4B] hover:underline font-bold">
              create a new workspace account
            </Link>
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg border border-red-300 bg-red-50 text-xs font-bold text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#0F6B4B] focus:outline-none transition"
              placeholder="name@restaurant.com"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#0F6B4B] focus:outline-none transition"
              placeholder="Enter your password"
            />
          </div>

          <div className="border-t border-[#E5E7EB] pt-4">
            <label className="block text-xs font-extrabold text-[#0F6B4B] uppercase tracking-wide mb-1.5">
              Workspace Code (Optional)
            </label>
            <input
              value={workspaceCode}
              onChange={(e) => setWorkspaceCode(e.target.value)}
              className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#0F6B4B] focus:outline-none transition uppercase"
              placeholder="e.g. ANNAM7821"
            />
            <p className="mt-1 text-[11px] text-[#4B5563]">Only enter if joining an existing restaurant workspace.</p>
          </div>

          <div className="pt-2">
            <button
              disabled={loading}
              className="w-full rounded-lg bg-[#0F6B4B] py-3 text-xs font-bold text-white transition hover:bg-[#084C37] focus:outline-none disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
