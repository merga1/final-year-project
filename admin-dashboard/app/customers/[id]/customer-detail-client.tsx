'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? 'active').toLowerCase();
  if (s === 'active') return <span className="status-badge status-ok">Active</span>;
  if (s === 'suspended') return <span className="status-badge status-danger">Suspended</span>;
  if (s === 'pending') return <span className="status-badge status-warn">Pending</span>;
  return <span className="status-badge status-muted">{status || 'Unknown'}</span>;
}

export function CustomerDetailClient({
  customer,
  devices,
  token,
}: {
  customer: any;
  devices: any[];
  token: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [linkMeter, setLinkMeter] = useState('');

  const name = customer.name ?? (`${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Customer');
  const currentStatus = (customer.accountStatus ?? customer.status ?? 'active').toLowerCase();
  const isSuspended = currentStatus === 'suspended';

  async function updateCustomer(data: any) {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(String.fromCharCode(0xFEFF), '').trim();
      const t = getCookie('sw_token') || token;
      const res = await fetch(`${API}/api/admin/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Action failed');
      }
      setSuccess('Action completed successfully.');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section-container">
      <Link href="/customers" className="back-link">Back to Customers</Link>

      {error && <div className="form-error-alert">{error}</div>}
      {success && <div className="form-success-alert">{success}</div>}

      <div className="detail-two-col">
        {/* Left: profile + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="detail-card">
            <div className="detail-card-header">
              <h2 className="detail-card-title">{name}</h2>
              <StatusBadge status={currentStatus} />
            </div>
            <dl className="detail-fields">
              <div className="detail-field-row">
                <dt>Email</dt>
                <dd>{customer.email ?? '—'}</dd>
              </div>
              <div className="detail-field-row">
                <dt>Phone</dt>
                <dd>{customer.phone ?? customer.phoneNumber ?? '—'}</dd>
              </div>
              <div className="detail-field-row">
                <dt>Address</dt>
                <dd>{customer.address ?? '—'}</dd>
              </div>
              <div className="detail-field-row">
                <dt>Account ID</dt>
                <dd><code className="mono-text">{customer.id}</code></dd>
              </div>
              <div className="detail-field-row">
                <dt>Registered</dt>
                <dd className="text-muted-sm">
                  {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '—'}
                </dd>
              </div>
              {(customer.meterId ?? customer.deviceId) && (
                <div className="detail-field-row">
                  <dt>Device ID</dt>
                  <dd>
                    <Link href={`/devices/${customer.meterId ?? customer.deviceId}`} className="link-mono">
                      {customer.meterId ?? customer.deviceId}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>

            <div style={{ marginTop: 20 }}>
              {isSuspended ? (
                <button
                  className="btn-success-sm"
                  style={{ width: '100%', padding: '10px' }}
                  disabled={loading}
                  onClick={() => {
                    if (confirm('Reactivate this customer account?')) {
                      updateCustomer({ accountStatus: 'active' });
                    }
                  }}
                >
                  Reactivate Account
                </button>
              ) : (
                <button
                  className="btn-danger-sm"
                  style={{ width: '100%', padding: '10px' }}
                  disabled={loading}
                  onClick={() => {
                    if (confirm('Suspend this customer? They will lose access.')) {
                      updateCustomer({ accountStatus: 'suspended' });
                    }
                  }}
                >
                  Suspend Account
                </button>
              )}
            </div>
          </div>

          {/* Device link */}
          <div className="detail-card">
            <h3 className="detail-card-subtitle">Device Assignment</h3>
            <p className="text-muted-sm" style={{ marginBottom: 10 }}>
              Currently linked: {' '}
              {(customer.meterId ?? customer.deviceId)
                ? <Link href={`/devices/${customer.meterId ?? customer.deviceId}`} className="link-mono">{customer.meterId ?? customer.deviceId}</Link>
                : 'None'}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="form-select"
                value={linkMeter}
                onChange={e => setLinkMeter(e.target.value)}
              >
                <option value="">Select a device to link...</option>
                {devices.map(d => (
                  <option key={d.id ?? d.meterId} value={d.meterId ?? d.id}>
                    {d.meterId ?? d.id}
                    {d.customerId && d.customerId !== customer.id ? ' (in use)' : ''}
                  </option>
                ))}
              </select>
              <button
                className="btn-primary-blue"
                disabled={!linkMeter || loading}
                onClick={() => updateCustomer({ meterId: linkMeter })}
              >
                Link
              </button>
            </div>
          </div>
        </div>

        {/* Right: bills, tickets, alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="detail-card">
            <h3 className="detail-card-subtitle">Recent Bills</h3>
            {customer.recentBills && customer.recentBills.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customer.recentBills.slice(0, 5).map((b: any, i: number) => (
                  <div key={b.id ?? i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>ETB {b.amountEtb ?? b.amount ?? '—'}</span>
                    <span className={`status-badge ${b.status === 'paid' ? 'status-ok' : b.status === 'overdue' ? 'status-danger' : 'status-warn'}`} style={{ fontSize: '0.72rem' }}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-sm">No billing data available.</p>
            )}
            <Link href="/billing" className="back-link" style={{ marginTop: 10, fontSize: '0.8rem' }}>
              View all bills
            </Link>
          </div>

          <div className="detail-card">
            <h3 className="detail-card-subtitle">Open Tickets</h3>
            {customer.openTickets && customer.openTickets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customer.openTickets.slice(0, 5).map((t: any, i: number) => (
                  <div key={t.id ?? i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href={`/support-tickets/${t.id}`} className="link-mono">
                      #{(t.id ?? '').replace(/-/g, '').slice(0, 8).toUpperCase()}
                    </Link>
                    <span className="text-muted-sm">{t.type ?? 'General'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-sm">No open tickets.</p>
            )}
            <Link href={`/support-tickets?customerId=${customer.id}`} className="back-link" style={{ marginTop: 10, fontSize: '0.8rem' }}>
              View all tickets
            </Link>
          </div>

          <div className="detail-card">
            <h3 className="detail-card-subtitle">Recent Alerts</h3>
            {customer.recentAlerts && customer.recentAlerts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customer.recentAlerts.slice(0, 5).map((a: any, i: number) => (
                  <div key={a.id ?? i} style={{ fontSize: '0.83rem', color: '#334155', borderLeft: '3px solid #f59e0b', paddingLeft: 8 }}>
                    {a.message}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-sm">No recent alerts.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
