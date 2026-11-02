'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ALERT_TYPE_LABELS: Record<string, string> = {
  high_flow: 'HIGH FLOW',
  HIGH_USAGE: 'HIGH FLOW',
  high_turbidity: 'WATER QUALITY',
  WATER_QUALITY: 'WATER QUALITY',
  leak: 'LEAK DETECTED',
  LEAK: 'LEAK DETECTED',
  offline: 'DEVICE OFFLINE',
  OFFLINE: 'DEVICE OFFLINE',
  low_battery: 'LOW BATTERY',
  LOW_BATTERY: 'LOW BATTERY',
  TAMPER: 'TAMPER DETECTED',
};

const TYPE_COLORS: Record<string, string> = {
  high_flow: '#ea580c',
  HIGH_USAGE: '#ea580c',
  high_turbidity: '#7c3aed',
  WATER_QUALITY: '#7c3aed',
  leak: '#dc2626',
  LEAK: '#dc2626',
  offline: '#64748b',
  OFFLINE: '#64748b',
  low_battery: '#d97706',
  LOW_BATTERY: '#d97706',
  TAMPER: '#b91c1c',
};

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}

function AlertTypeBadge({ type }: { type: string }) {
  const label = ALERT_TYPE_LABELS[type] ?? type;
  const color = TYPE_COLORS[type] ?? '#475569';
  return (
    <span
      className="alert-type-badge"
      style={{ background: color + '1a', color, borderColor: color + '44' }}
    >
      {label}
    </span>
  );
}

function StatusBadge({ acknowledged }: { acknowledged: boolean }) {
  return acknowledged
    ? <span className="status-badge status-ok">Acknowledged</span>
    : <span className="status-badge status-warn">Unacknowledged</span>;
}

export function AlertsClient({ alerts, token }: { alerts: any[]; token: string }) {
  const router = useRouter();
  const [localAlerts, setLocalAlerts] = useState<any[]>(alerts);
  const [ackingId, setAckingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [ackFilter, setAckFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const unack = localAlerts.filter(a => !a.acknowledged).length;
  const ackCount = localAlerts.filter(a => a.acknowledged).length;
  const critical = localAlerts.filter(a => (a.severity ?? '').toLowerCase() === 'critical' && !a.acknowledged).length;

  const filtered = localAlerts.filter(a => {
    const isAck = !!a.acknowledged;
    if (ackFilter === 'unack' && isAck) return false;
    if (ackFilter === 'ack' && !isAck) return false;

    const sev = (a.severity ?? 'warning').toLowerCase();
    if (severityFilter !== 'all' && sev !== severityFilter) return false;

    const t = (a.type ?? a.alertType ?? '').toLowerCase();
    if (typeFilter !== 'all') {
      if (typeFilter === 'water_quality' && !t.includes('turbid') && !t.includes('water_quality')) return false;
      if (typeFilter === 'high_flow' && !t.includes('flow') && !t.includes('usage')) return false;
      if (typeFilter === 'leak' && !t.includes('leak')) return false;
      if (typeFilter === 'battery' && !t.includes('battery')) return false;
      if (typeFilter === 'offline' && !t.includes('offline')) return false;
    }

    if (!search) return true;
    const q = search.toLowerCase();
    const meterId = (a.meterId ?? a.deviceId ?? '').toLowerCase();
    const msg = (a.message ?? '').toLowerCase();
    return meterId.includes(q) || msg.includes(q);
  });

  async function handleAcknowledge(id: string) {
    setAckingId(id);
    setError('');
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/u{FEFF}/u, '').trim();
      const t = getCookie('sw_token') || token;
      const res = await fetch(`${API}/api/admin/alerts/${id}/acknowledge`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to acknowledge');
      setLocalAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
      router.refresh();
    } catch {
      setError('Could not acknowledge alert. Please try again.');
    } finally {
      setAckingId(null);
    }
  }

  return (
    <div className="section-container">
      <div className="section-header-row">
        <div>
          <h2 className="section-main-title">Alerts</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {filtered.length} of {localAlerts.length} alerts shown &middot; {unack} unacknowledged
          </span>
        </div>
      </div>

      <div className="stats-strip">
        <div
          className={`stat-chip stat-chip-red ${severityFilter === 'critical' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical');
            setAckFilter('unack');
          }}
          title="Filter critical unacknowledged alerts"
        >
          <span className="stat-chip-val">{critical}</span>
          <span className="stat-chip-label">Critical Unackd</span>
        </div>
        <div
          className={`stat-chip stat-chip-amber ${ackFilter === 'unack' && severityFilter === 'all' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setAckFilter(ackFilter === 'unack' ? 'all' : 'unack');
            setSeverityFilter('all');
          }}
          title="Filter all unacknowledged alerts"
        >
          <span className="stat-chip-val">{unack}</span>
          <span className="stat-chip-label">Unacknowledged</span>
        </div>
        <div
          className={`stat-chip stat-chip-green ${ackFilter === 'ack' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setAckFilter(ackFilter === 'ack' ? 'all' : 'ack');
            setSeverityFilter('all');
          }}
          title="Filter acknowledged alerts"
        >
          <span className="stat-chip-val">{ackCount}</span>
          <span className="stat-chip-label">Acknowledged</span>
        </div>
        <div
          className={`stat-chip stat-chip-blue ${ackFilter === 'all' && severityFilter === 'all' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setAckFilter('all');
            setSeverityFilter('all');
            setTypeFilter('all');
            setSearch('');
          }}
          title="View all alerts"
        >
          <span className="stat-chip-val">{localAlerts.length}</span>
          <span className="stat-chip-label">Total Alerts</span>
        </div>
      </div>

      {error && <div className="form-error-alert">{error}</div>}

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div className="tab-pill-group">
          {[
            { id: 'all', label: 'All Status' },
            { id: 'unack', label: `Unacknowledged (${unack})` },
            { id: 'ack', label: `Acknowledged (${ackCount})` },
          ].map(t => (
            <button
              key={t.id}
              className={`tab-pill ${ackFilter === t.id ? 'active' : ''}`}
              onClick={() => setAckFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Severity */}
        <select
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
          className="filter-select"
          style={{ minWidth: 140 }}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical Only</option>
          <option value="warning">Warning Only</option>
        </select>

        {/* Type */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="filter-select"
          style={{ minWidth: 160 }}
        >
          <option value="all">All Anomaly Types</option>
          <option value="water_quality">Water Quality (Turbidity)</option>
          <option value="high_flow">High Flow / Usage</option>
          <option value="leak">Pipe Leak</option>
          <option value="battery">Low Battery</option>
          <option value="offline">Meter Offline</option>
        </select>

        {(ackFilter !== 'all' || severityFilter !== 'all' || typeFilter !== 'all' || search) && (
          <button
            className="filter-clear-btn"
            onClick={() => { setAckFilter('all'); setSeverityFilter('all'); setTypeFilter('all'); setSearch(''); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Search */}
      <div className="search-bar-wrap" style={{ marginBottom: 16 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search by device ID or message content..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button type="button" className="search-clear" onClick={() => setSearch('')}>x</button>
        )}
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Device ID</th>
              <th>Message</th>
              <th>Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                  No alerts found matching current filters.
                </td>
              </tr>
            )}
            {filtered.map(a => (
              <tr key={a.id} className={!a.acknowledged ? 'alert-row-unack' : ''}>
                <td><AlertTypeBadge type={a.type ?? a.alertType ?? 'unknown'} /></td>
                <td>
                  {a.meterId || a.deviceId ? (
                    <Link href={`/devices/${a.meterId ?? a.deviceId}`} className="table-link-mono">
                      {a.meterId ?? a.deviceId}
                    </Link>
                  ) : (
                    <span className="mono-text">—</span>
                  )}
                </td>
                <td style={{ maxWidth: 280 }}>{a.message}</td>
                <td className="text-muted-sm" suppressHydrationWarning>
                  {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}
                </td>
                <td><StatusBadge acknowledged={!!a.acknowledged} /></td>
                <td>
                  {!a.acknowledged ? (
                    <button
                      className="btn-ack"
                      onClick={() => handleAcknowledge(a.id)}
                      disabled={ackingId === a.id}
                    >
                      {ackingId === a.id ? 'Ack...' : 'Acknowledge'}
                    </button>
                  ) : (
                    <span className="text-muted-sm">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
