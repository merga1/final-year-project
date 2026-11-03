'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function formatAlertType(type: string) {
  const norm = (type ?? '').toLowerCase().replace(/_/g, ' ');
  if (norm.includes('turbid') || norm.includes('quality')) {
    return {
      label: 'High Turbidity',
      category: 'water_quality',
      color: '#7c3aed',
      bg: '#f5f3ff',
      border: '#ddd6fe',
    };
  }
  if (norm.includes('leak')) {
    return {
      label: 'Leak Detected',
      category: 'leak',
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
    };
  }
  if (norm.includes('offline')) {
    return {
      label: 'Device Offline',
      category: 'offline',
      color: '#475569',
      bg: '#f1f5f9',
      border: '#cbd5e1',
    };
  }
  if (norm.includes('battery')) {
    return {
      label: 'Low Battery',
      category: 'battery',
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
    };
  }
  if (norm.includes('flow') || norm.includes('usage')) {
    return {
      label: 'High Flow',
      category: 'high_flow',
      color: '#ea580c',
      bg: '#fff7ed',
      border: '#fed7aa',
    };
  }
  if (norm.includes('tamper')) {
    return {
      label: 'Tamper Detected',
      category: 'tamper',
      color: '#b91c1c',
      bg: '#fef2f2',
      border: '#fecaca',
    };
  }
  const formatted = norm
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    label: formatted || 'Anomaly',
    category: 'other',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
  };
}

function SeverityBadge({ severity }: { severity: string }) {
  const s = (severity ?? 'warning').toLowerCase();
  if (s === 'critical') {
    return (
      <span className="status-badge status-danger" style={{ fontWeight: 700, letterSpacing: '0.01em' }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#dc2626', marginRight: 5 }} />
        Critical
      </span>
    );
  }
  if (s === 'high') {
    return (
      <span className="status-badge" style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', fontWeight: 600 }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ea580c', marginRight: 5 }} />
        High
      </span>
    );
  }
  if (s === 'medium') {
    return (
      <span className="status-badge status-warn" style={{ fontWeight: 600 }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#d97706', marginRight: 5 }} />
        Medium
      </span>
    );
  }
  return (
    <span className="status-badge status-muted" style={{ fontWeight: 600 }}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

function StatusBadge({ acknowledged }: { acknowledged: boolean }) {
  return acknowledged ? (
    <span className="status-badge status-ok" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      Acknowledged
    </span>
  ) : (
    <span className="status-badge status-warn" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#d97706' }} />
      Unacknowledged
    </span>
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

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
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
      if (typeFilter === 'water_quality' && !t.includes('turbid') && !t.includes('quality')) return false;
      if (typeFilter === 'high_flow' && !t.includes('flow') && !t.includes('usage')) return false;
      if (typeFilter === 'leak' && !t.includes('leak')) return false;
      if (typeFilter === 'battery' && !t.includes('battery')) return false;
      if (typeFilter === 'offline' && !t.includes('offline')) return false;
    }

    if (!search) return true;
    const q = search.toLowerCase();
    const meterId = (a.meterId ?? a.deviceId ?? '').toLowerCase();
    const msg = (a.message ?? '').toLowerCase();
    const zone = (a.zone ?? '').toLowerCase();
    return meterId.includes(q) || msg.includes(q) || zone.includes(q) || t.includes(q);
  });

  async function handleAcknowledge(id: string) {
    setAckingId(id);
    setError('');
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(String.fromCharCode(0xFEFF), '').trim();
      const t = getCookie('sw_token') || token;
      const res = await fetch(`${API}/api/admin/alerts/${id}/acknowledge`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to acknowledge');
      setLocalAlerts(prev => prev.map(a => (a.id === id ? { ...a, acknowledged: true } : a)));
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

      {/* 4 Stats Chips */}
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
              type="button"
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
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </select>

        {/* Anomaly Type */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="filter-select"
          style={{ minWidth: 160 }}
        >
          <option value="all">All Anomaly Types</option>
          <option value="leak">Pipe Leak</option>
          <option value="water_quality">Water Quality (Turbidity)</option>
          <option value="high_flow">High Flow / Usage</option>
          <option value="battery">Low Battery</option>
          <option value="offline">Meter Offline</option>
        </select>

        {(ackFilter !== 'all' || severityFilter !== 'all' || typeFilter !== 'all' || search) && (
          <button
            type="button"
            className="filter-clear-btn"
            onClick={() => {
              setAckFilter('all');
              setSeverityFilter('all');
              setTypeFilter('all');
              setSearch('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Search */}
      <div className="search-bar-wrap" style={{ marginBottom: 16 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search by device ID, message, or anomaly type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button type="button" className="search-clear" onClick={() => setSearch('')}>
            ×
          </button>
        )}
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Type</th>
              <th>Device &amp; Zone</th>
              <th>Message</th>
              <th>Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                  No alerts found matching current filters.
                </td>
              </tr>
            )}
            {filtered.map(a => {
              const meta = formatAlertType(a.type ?? a.alertType ?? 'anomaly');
              const meter = a.meterId ?? a.deviceId;
              return (
                <tr key={a.id} className={!a.acknowledged ? 'alert-row-unack' : ''}>
                  <td>
                    <SeverityBadge severity={a.severity} />
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: meta.bg,
                        color: meta.color,
                        border: `1px solid ${meta.border}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {meta.label}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {meter ? (
                        <Link href={`/devices/${meter}`} className="table-link-mono" title={`Inspect device ${meter}`}>
                          {meter}
                        </Link>
                      ) : (
                        <span className="text-muted-sm">—</span>
                      )}
                      {a.zone && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {a.zone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ maxWidth: 300, color: '#1e293b', fontSize: '0.85rem' }}>
                    {a.message}
                  </td>
                  <td className="text-muted-sm" suppressHydrationWarning>
                    {formatLastSeen(a.createdAt)}
                  </td>
                  <td>
                    <StatusBadge acknowledged={!!a.acknowledged} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {!a.acknowledged ? (
                        <button
                          type="button"
                          className="btn-ack"
                          onClick={() => handleAcknowledge(a.id)}
                          disabled={ackingId === a.id}
                        >
                          {ackingId === a.id ? 'Ack...' : 'Acknowledge'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
                          Resolved
                        </span>
                      )}
                      <Link
                        href="/support-tickets"
                        className="btn-table-action-purple"
                        title="View or dispatch support tickets"
                      >
                        Tickets
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
