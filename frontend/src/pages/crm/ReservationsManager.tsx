import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as crmService from '../../services/crmService';

const ReservationsManager: React.FC = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchReservations();
    }
  }, [token]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await crmService.getReservations(token!);
      setReservations(data);
    } catch (err) {
      console.error('Failed to load reservations', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await crmService.updateReservationStatus(id, status, token!);
      fetchReservations();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className="flex h-full flex-col p-8 text-white overflow-y-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reservations</h1>
          <p className="mt-2 text-slate-400">Manage upcoming bookings and table seating.</p>
        </div>
        <button className="rounded-xl bg-cyan-600 px-4 py-2 font-semibold hover:bg-cyan-500 transition">
          + New Reservation
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading reservations...</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Guests</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No upcoming reservations.</td>
                </tr>
              ) : (
                reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{new Date(r.reservation_date).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-400">{r.reservation_time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{r.customer_name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{r.phone_number}</div>
                    </td>
                    <td className="px-6 py-4">{r.guest_count}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-2xs font-bold rounded-md ${r.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : r.status === 'CONFIRMED' ? 'bg-cyan-500/20 text-cyan-400' : r.status === 'SEATED' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {r.status === 'PENDING' && (
                        <button onClick={() => updateStatus(r.id, 'CONFIRMED')} className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">Confirm</button>
                      )}
                      {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                        <button onClick={() => updateStatus(r.id, 'SEATED')} className="text-xs text-green-400 hover:text-green-300 font-semibold">Seat</button>
                      )}
                      {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                        <button onClick={() => updateStatus(r.id, 'CANCELLED')} className="text-xs text-red-400 hover:text-red-300 font-semibold">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ReservationsManager;
