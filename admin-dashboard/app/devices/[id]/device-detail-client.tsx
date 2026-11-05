'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}

function BatteryIndicator({ percent }: { percent: number | null | undefined }) {
  if (percent == null) return <span className="text-muted-sm">—</span>;
  const val = Math.round(percent);
  const isLow = val < 20;
  const isMedium = val >= 20 && val <= 50;

  const color = isLow ? '#dc2626' : isMedium ? '#d97706' : '#16a34a';
  const bg = isLow ? '#fef2f2' : isMedium ? '#fffbeb' : '#f0fdf4';
  const border = isLow ? '#fecaca' : isMedium ? '#fde68a' : '#bbf7d0';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 8px',
        borderRadius: 999,
        background: bg,
        border: `1px solid ${border}`,
        fontSize: '0.78rem',
        fontWeight: 700,
        color,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
        <line x1="22" y1="11" x2="22" y2="13" />
      </svg>
      <span>{val}%</span>
    </div>
  );
}

function formatLastSeen(dateStr?: string | null) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export function DeviceDetailClient({
  device,
  readings,
  token,
}: {
  device: any;
  readings: any[];
  token: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isActive = (device.connectivity ?? '').toUpperCase() !== 'OFFLINE';

  const chartData = [...readings]
    .sort((a, b) => new Date(a.createdAt ?? a.timestamp).getTime() - new Date(b.createdAt ?? b.timestamp).getTime())
    .slice(-20)
    .map(r => ({
      time: (r.createdAt ?? r.timestamp)
        ? new Date(r.createdAt ?? r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '—',
      flow: parseFloat(r.flowLitersPerMin ?? r.flow ?? 0),
      turbidity: parseFloat(r.turbidityNtu ?? r.turbidity ?? 0),
    }));

  async function handleToggle() {
    const action = isActive ? 'deactivate' : 'activate';
    if (!confirm(`${action === 'activate' ? 'Activate' : 'Deactivate'} this device?`)) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(String.fromCharCode(0xFEFF), '').trim();
      const t = getCookie('sw_token') || token;
      const res = await fetch(`${API}/api/admin/devices/${device.id ?? device.meterId}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed');
      setSuccess(`Device ${action}d successfully.`);
      router.refresh();
    } catch {
      setError(`Could not ${isActive ? 'deactivate' : 'activate'} device.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section-container">
      <Link href="/devices" className="back-link">← Back to Devices</Link>

      {error && <div className="form-error-alert">{error}</div>}
      {success && <div className="form-success-alert">{success}</div>}

      <div className="detail-two-col">
        {/* Left: info + latest values */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="detail-card">
            <div className="detail-card-header">
              <h2 className="detail-card-title">{device.meterId ?? device.deviceId ?? device.id}</h2>
              {(device.connectivity ?? '').toUpperCase() === 'ONLINE'
                ? <span className="status-badge status-ok">Online</span>
                : (device.connectivity ?? '').toUpperCase() === 'WARNING'
                  ? <span className="status-badge status-warn">Warning</span>
                  : <span className="status-badge status-danger">Offline</span>}
            </div>

            <dl className="detail-fields">
              <div className="detail-field-row">
                <dt>Customer</dt>
                <dd>
                  {device.customerId ? (
                    <Link
                      href={`/customers/${device.customerId}`}
                      style={{ color: '#1e6b52', fontWeight: 600, textDecoration: 'none' }}
                      title="View Customer Profile"
                    >
                      {device.customerName ?? device.customerId}
                    </Link>
                  ) : (
                    <span className="status-badge status-muted" style={{ fontSize: '0.75rem' }}>
                      Unassigned
                    </span>
                  )}
                </dd>
              </div>
              <div className="detail-field-row">
                <dt>Zone</dt>
                <dd>{device.zone ?? '—'}</dd>
              </div>
              <div className="detail-field-row">
                <dt>Valve State</dt>
                <dd>
                  {(device.valveState ?? '').toUpperCase() === 'OPEN'
                    ? <span className="status-badge status-ok">Open</span>
                    : <span className="status-badge status-muted">{device.valveState ?? '—'}</span>}
                </dd>
              </div>
              <div className="detail-field-row">
                <dt>Battery</dt>
                <dd><BatteryIndicator percent={device.batteryPercent} /></dd>
              </div>
              <div className="detail-field-row">
                <dt>Last Update</dt>
                <dd className="text-muted-sm" suppressHydrationWarning>
                  {formatLastSeen(device.lastReadingAt ?? device.lastSeenAt ?? device.updatedAt)}
                </dd>
              </div>
              <div className="detail-field-row">
                <dt>SIM Number</dt>
                <dd className="text-muted-sm">{device.simNumber ?? '—'}</dd>
              </div>
              <div className="detail-field-row">
                <dt>Firmware</dt>
                <dd className="text-muted-sm">{device.firmwareVersion ?? '—'}</dd>
              </div>
            </dl>

            <div style={{ marginTop: 20 }}>
              <button
                className={isActive ? 'btn-danger-sm' : 'btn-success-sm'}
                style={{ width: '100%', padding: '10px' }}
                disabled={loading}
                onClick={handleToggle}
              >
                {loading ? 'Please wait...' : isActive ? 'Deactivate Device' : 'Activate Device'}
              </button>
            </div>
          </div>

          {/* Latest sensor values */}
          <div className="detail-card">
            <h3 className="detail-card-subtitle">Latest Sensor Values</h3>
            <div className="sensor-values-grid">
              <div className="sensor-value-box">
                <span className="sensor-val-label">Flow Rate</span>
                <span className="sensor-val-number">
                  {device.latestReading?.flowLitersPerMin ?? device.flowLitersPerMin ?? '—'}
                </span>
                <span className="sensor-val-unit">L/min</span>
              </div>
              <div className="sensor-value-box">
                <span className="sensor-val-label">Turbidity</span>
                <span className="sensor-val-number">
                  {device.latestReading?.turbidityNtu ?? device.turbidityNtu ?? '—'}
                </span>
                <span className="sensor-val-unit">NTU</span>
              </div>
              <div className="sensor-value-box">
                <span className="sensor-val-label">Monthly Usage</span>
                <span className="sensor-val-number">
                  {device.monthlyUsageLiters != null
                    ? Number(device.monthlyUsageLiters).toLocaleString()
                    : '—'}
                </span>
                <span className="sensor-val-unit">L</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Chart + table */}
        <div className="detail-card">
          <h3 className="detail-card-subtitle">Reading History (last 20)</h3>
          {chartData.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', padding: '20px 0' }}>
              No readings available for this device.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="flow" name="Flow (L/min)" stroke="#1e6b52" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="turbidity" name="Turbidity (NTU)" stroke="#d97706" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {readings.length > 0 && (
            <div style={{ marginTop: 20, overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '0.78rem' }}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Flow (L/min)</th>
                    <th>Turbidity (NTU)</th>
                    <th>Valve</th>
                    <th>Volume (L)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...readings]
                    .sort((a, b) => new Date(b.createdAt ?? b.timestamp).getTime() - new Date(a.createdAt ?? a.timestamp).getTime())
                    .slice(0, 15)
                    .map((r, i) => (
                      <tr key={r.id ?? i}>
                        <td className="text-muted-sm" suppressHydrationWarning>
                          {(r.createdAt ?? r.timestamp) ? new Date(r.createdAt ?? r.timestamp).toLocaleString() : '—'}
                        </td>
                        <td>{r.flowLitersPerMin ?? r.flow ?? '—'}</td>
                        <td>{r.turbidityNtu ?? r.turbidity ?? '—'}</td>
                        <td>
                          {(r.valveState ?? '').toUpperCase() === 'OPEN'
                            ? <span className="status-badge status-ok" style={{ fontSize: '0.7rem' }}>Open</span>
                            : <span className="status-badge status-muted" style={{ fontSize: '0.7rem' }}>{r.valveState ?? '—'}</span>}
                        </td>
                        <td>{r.volumeLiters != null ? Number(r.volumeLiters).toFixed(1) : '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
