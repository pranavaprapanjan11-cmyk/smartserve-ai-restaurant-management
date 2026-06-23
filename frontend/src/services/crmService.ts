import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export async function getDashboardMetrics(token: string): Promise<any> {
  const res = await axios.get(`${API_BASE}/crm/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function getCustomers(token: string): Promise<any[]> {
  const res = await axios.get(`${API_BASE}/crm/customers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function getReservations(token: string): Promise<any[]> {
  const res = await axios.get(`${API_BASE}/crm/reservations`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function updateReservationStatus(id: string, status: string, token: string): Promise<any> {
  const res = await axios.patch(`${API_BASE}/crm/reservations/${id}/status`, { status }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function getWaitlist(token: string): Promise<any[]> {
  const res = await axios.get(`${API_BASE}/crm/waitlist`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function updateWaitlistStatus(id: string, status: string, token: string): Promise<any> {
  const res = await axios.patch(`${API_BASE}/crm/waitlist/${id}/status`, { status }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}
