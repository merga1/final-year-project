/**
 * Typed API client for the NestJS backend.
 * All server-side fetches go through here.
 */
import type { OverviewResponse } from '../components/overview-content';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_BASE_URL ?? 'http://localhost:4000';

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
