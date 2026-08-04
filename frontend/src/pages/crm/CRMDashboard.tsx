import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as crmService from '../../services/crmService';

interface DashboardMetrics {
  totalCustomers: number;
  vipCount: number;
  atRiskCount: number;
  upcomingReservations: number;
  waitingCount: number;
  insights: string[];
}

const CRMDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchMetrics();
    }
  }, [token]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await crmService.getDashboardMetrics(token!);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load CRM metrics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-[var(--text-muted)]">Loading CRM Dashboard...</div>;
  }

  return (
    <div className="flex h-full flex-col p-6 sm:p-8 text-[var(--text-primary)] overflow-y-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            CRM & Reservation Intelligence
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)]">Manage customers, loyalty, reservations, and waitlists.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NavLink to="/crm/customers" className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-card-enterprise transition hover:border-[#0F6B4B]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Total Customers</h3>
          <p className="text-4xl font-extrabold text-[var(--text-primary)]">{metrics?.totalCustomers ?? 0}</p>
        </NavLink>
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-card-enterprise">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">VIP Customers</h3>
          <p className="text-4xl font-extrabold text-purple-600 dark:text-purple-400">{metrics?.vipCount ?? 0}</p>
        </div>
        <NavLink to="/crm/reservations" className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-card-enterprise transition hover:border-sky-500">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Upcoming Reservations</h3>
          <p className="text-4xl font-extrabold text-sky-600 dark:text-sky-400">{metrics?.upcomingReservations ?? 0}</p>
        </NavLink>
        <NavLink to="/crm/waitlist" className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-card-enterprise transition hover:border-amber-500">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Waitlist Queue</h3>
          <p className="text-4xl font-extrabold text-amber-600 dark:text-amber-400">{metrics?.waitingCount ?? 0}</p>
        </NavLink>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-card-enterprise">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
            <svg className="w-5 h-5 text-[#0F6B4B] dark:text-[#4ADE80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI CRM Intelligence
          </h2>
          {metrics?.insights && metrics.insights.length > 0 ? (
            <div className="space-y-4">
              {metrics.insights.map((insight, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#0F6B4B]/30 bg-[#0F6B4B]/10 dark:bg-[#0F6B4B]/20 text-xs font-semibold text-[var(--text-primary)]">
                  {insight}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">No new insights generated today.</p>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-card-enterprise flex flex-col justify-center items-center text-center">
          <svg className="w-16 h-16 text-[var(--text-muted)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-2">Quick Actions</h3>
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            <NavLink to="/crm/reservations" className="px-6 py-2.5 bg-[#0F6B4B] hover:bg-[#0B563D] text-white rounded-xl font-bold text-xs transition shadow-sm">
              Manage Reservations
            </NavLink>
            <NavLink to="/crm/customers" className="px-6 py-2.5 bg-[var(--secondary-btn-bg)] hover:bg-[var(--secondary-btn-hover)] text-[var(--secondary-btn-text)] border border-[var(--secondary-btn-border)] rounded-xl font-bold text-xs transition shadow-sm">
              View All Customers
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;
