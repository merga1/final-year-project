/**
 * Typed API client for the NestJS backend.
 * All server-side fetches go through here.
 */
import type { OverviewResponse } from '../components/overview-content';

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? process.env.API_BASE_URL ?? 'https://backend-five-liart-75.vercel.app').replace(/^\uFEFF/, '').trim();

async function apiFetch<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    cache: 'no-store',
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> ?? {}) },
  });

  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `API error ${res.status} at ${path}`);
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  return apiFetch<{ accessToken: string; user: { name: string; email: string; role: string } }>(
    '/auth/login', undefined,
    { method: 'POST', body: JSON.stringify({ email, password }) },
  );
}

export async function changePassword(token: string, data: { oldPassword: string; newPassword: string }) {
  return apiFetch<{ success: boolean; message: string }>(
    '/auth/change-password', token,
    { method: 'POST', body: JSON.stringify(data) },
  );
}

// ── Admin endpoints ────────────────────────────────────────────────────────────
export const getOverview = (token: string) =>
  apiFetch<OverviewResponse>('/api/admin/overview', token);

export const getCustomers = (token: string) =>
  apiFetch<any[]>('/api/admin/customers', token);

export const createCustomer = (token: string, data: any) =>
  apiFetch<any>('/api/admin/customers', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getDevices = (token: string) =>
  apiFetch<any[]>('/api/admin/devices', token);

export const getReadings = (token: string, meterId?: string) =>
  apiFetch<any[]>(`/api/admin/readings${meterId ? `?meterId=${meterId}` : ''}`, token);

export const getDailyUsage = (token: string, meterId?: string) =>
  apiFetch<Array<{ day: string; usageLiters: string }>>(`/api/admin/readings/daily${meterId ? `?meterId=${meterId}` : ''}`, token);

export const getZoneUsage = (token: string) =>
  apiFetch<Array<{ zone: string; totalLiters: number; avgTurbidity: number; meterCount: number }>>('/api/admin/readings/zones', token).catch(() => []);

export const getQualityTrend = (token: string) =>
  apiFetch<Array<{ day: string; avgTurbidity: number; maxTurbidity: number; avgFlowRate: number }>>('/api/admin/readings/quality', token).catch(() => []);

export const getBilling = (token: string) =>
  apiFetch<any[]>('/api/admin/billing', token);

export const getPayments = (token: string) =>
  apiFetch<any[]>('/api/admin/payments', token);

export const getAlerts = (token: string) =>
  apiFetch<any[]>('/api/admin/alerts', token);

export const acknowledgeAlert = (token: string, id: string) =>
  apiFetch<any>(`/api/admin/alerts/${id}/acknowledge`, token, { method: 'PATCH' });

export const getSupportTickets = (token: string) =>
  apiFetch<any[]>('/api/admin/support-tickets', token);

export const updateTicket = (token: string, id: string, data: any) =>
  apiFetch<any>(`/api/admin/support-tickets/${id}`, token, { method: 'PATCH', body: JSON.stringify(data) });

export const getTechnicians = (token: string) =>
  apiFetch<any[]>('/api/admin/technicians', token);

export const createTechnician = (token: string, data: any) =>
  apiFetch<any>('/api/admin/technicians', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });

// ── Extended Customer API ──────────────────────────────────────────────────────
export const getCustomer = (token: string, id: string) =>
  apiFetch<any>(`/api/admin/customers/${id}`, token);

export const updateCustomer = (token: string, id: string, data: any) =>
  apiFetch<any>(`/api/admin/customers/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const suspendCustomer = (token: string, id: string) =>
  apiFetch<any>(`/api/admin/customers/${id}/suspend`, token, { method: 'PATCH' });

export const activateCustomer = (token: string, id: string) =>
  apiFetch<any>(`/api/admin/customers/${id}/activate`, token, { method: 'PATCH' });

export const linkDeviceToCustomer = (token: string, customerId: string, meterId: string) =>
  apiFetch<any>(`/api/admin/customers/${customerId}/link-device`, token, {
    method: 'PATCH',
    body: JSON.stringify({ meterId }),
  });

// ── Extended Device API ────────────────────────────────────────────────────────
export const getDevice = (token: string, id: string) =>
  apiFetch<any>(`/api/admin/devices/${id}`, token);

export const registerDevice = (token: string, data: any) =>
  apiFetch<any>('/api/admin/devices', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const activateDevice = (token: string, id: string) =>
  apiFetch<any>(`/api/admin/devices/${id}/activate`, token, { method: 'PATCH' });

export const deactivateDevice = (token: string, id: string) =>
  apiFetch<any>(`/api/admin/devices/${id}/deactivate`, token, { method: 'PATCH' });

export const getDeviceReadings = (token: string, meterId: string, from?: string, to?: string) => {
  const params = new URLSearchParams({ meterId });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiFetch<any[]>(`/api/admin/readings?${params.toString()}`, token);
};

// ── Extended Ticket API ────────────────────────────────────────────────────────
export const getTicket = (token: string, id: string) =>
  apiFetch<any>(`/api/admin/support-tickets/${id}`, token);

export const assignTicket = (token: string, id: string, technicianId: string, reason?: string) =>
  apiFetch<any>(`/api/admin/support-tickets/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ technicianId, status: 'assigned', reason }),
  });

export const closeTicket = (token: string, id: string) =>
  apiFetch<any>(`/api/admin/support-tickets/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'closed' }),
  });

export const reopenTicket = (token: string, id: string) =>
  apiFetch<any>(`/api/admin/support-tickets/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'pending' }),
  });

export const createTicketAdmin = (token: string, data: any) =>
  apiFetch<any>('/api/admin/support-tickets', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });

// ── Extended Technician API ────────────────────────────────────────────────────
export const getTechnician = (token: string, id: string) =>
  apiFetch<any>(`/api/admin/technicians/${id}`, token);

export const updateTechnician = (token: string, id: string, data: any) =>
  apiFetch<any>(`/api/admin/technicians/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// ── Audit Logs API (NFR-A07) ───────────────────────────────────────────────────
export const getAuditLogs = (token: string, limit = 100) =>
  apiFetch<any[]>(`/api/admin/audit-logs?limit=${limit}`, token).catch(() => []);
