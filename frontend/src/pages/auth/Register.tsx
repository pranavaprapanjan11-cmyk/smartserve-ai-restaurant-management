import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../../config';

const roles = [
  'OWNER',
  'MANAGER',
  'KITCHEN',
  'WAITER',
  'CASHIER',
  'EMPLOYEE',
];

const Register: React.FC = () => {
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const urlWorkspaceCode = searchParams.get('workspace') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(roles[3]); // Default to WAITER
  const [workspaceName, setWorkspaceName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [workspaceCode, setWorkspaceCode] = useState(urlWorkspaceCode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [workspacePreview, setWorkspacePreview] = useState<{ workspace_name: string; owner_name: string } | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeValid, setCodeValid] = useState(false);

  useEffect(() => {
    if (role === 'OWNER') {
      setCodeValid(true);
      setWorkspacePreview(null);
      return;
    }

    if (!workspaceCode || workspaceCode.trim().length < 4) {
      setCodeValid(false);
      setWorkspacePreview(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setCheckingCode(true);
      try {
        const res = await axios.get(`${API_BASE}/workspace/by-code/${workspaceCode.trim()}`);
        setWorkspacePreview(res.data);
        setCodeValid(true);
      } catch (err) {
        setWorkspacePreview(null);
        setCodeValid(false);
      } finally {
        setCheckingCode(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [workspaceCode, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        workspaceName: role === 'OWNER' ? workspaceName : undefined,
        restaurantName: role === 'OWNER' ? restaurantName : undefined,
        workspaceCode: role !== 'OWNER' ? workspaceCode : undefined,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F6B4B] px-4 py-12 text-[#111827]">
      <div className="w-full max-w-lg rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_4px_18px_rgba(0,0,0,0.08)] space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7D6E6] border border-[#E8B9CF] text-[#4A1D35] text-base font-extrabold shadow-sm">
            SS
          </div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Create Account</h2>
          <p className="text-xs text-[#4B5563] font-medium">
            Or{' '}
            <Link to="/auth/login" className="text-[#0F6B4B] hover:underline font-bold">
              sign in to your existing account
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
            <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#0F6B4B] focus:outline-none transition"
              placeholder="Your full name"
            />
          </div>

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
              minLength={8}
              required
              className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#0F6B4B] focus:outline-none transition"
              placeholder="Min. 8 characters"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#0F6B4B] focus:outline-none transition font-semibold"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {role === 'OWNER' ? (
            <div className="space-y-4 border-t border-[#E5E7EB] pt-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#0F6B4B]">Workspace Setup</p>
              <div>
                <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">Workspace Name</label>
                <input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#0F6B4B] focus:outline-none transition"
                  placeholder="e.g. Downtown Cafe Workspace"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">Restaurant Name</label>
                <input
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#0F6B4B] focus:outline-none transition"
                  placeholder="e.g. Downtown Cafe"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 border-t border-[#E5E7EB] pt-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#0F6B4B]">Join Workspace</p>
              <div>
                <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">Workspace Code</label>
                <input
                  value={workspaceCode}
                  onChange={(e) => setWorkspaceCode(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#0F6B4B] focus:outline-none transition uppercase"
                  placeholder="e.g. ANNAM7821"
                />
                <p className="mt-1 text-[11px] text-[#4B5563]">Ask your workspace owner for their code.</p>

                {checkingCode && (
                  <p className="mt-2 text-xs text-[#0F6B4B] font-bold animate-pulse">Verifying workspace code...</p>
                )}

                {!checkingCode && codeValid && workspacePreview && (
                  <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 font-bold">
                    <p>✓ Workspace Found</p>
                    <p className="mt-1">Restaurant: {workspacePreview.workspace_name.replace("'s Workspace", "")}</p>
                    <p className="font-medium text-gray-600">Owner: {workspacePreview.owner_name}</p>
                  </div>
                )}

                {!checkingCode && workspaceCode && !codeValid && (
                  <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800 font-bold">
                    ✗ Workspace not found. Please check the code.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              disabled={loading || (role !== 'OWNER' && !codeValid)}
              className="w-full rounded-lg bg-[#0F6B4B] py-3 text-xs font-bold text-white transition hover:bg-[#084C37] focus:outline-none disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Registering...' : 'Register Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
