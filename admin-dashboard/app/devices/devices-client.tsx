'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function ConnectivityBadge({ status }: { status: string }) {
  const s = (status ?? '').toLowerCase();
  if (s === 'online') return <span className="status-badge status-ok">Online</span>;
  if (s === 'offline') return <span className="status-badge status-danger">Offline</span>;
  return <span className="status-badge status-warn">{status || 'Unknown'}</span>;
}

function ValveBadge({ state }: { state: string }) {
  const s = (state ?? '').toLowerCase();
  return (
    <span className={`status-badge ${s === 'open' ? 'status-ok' : 'status-danger'}`}>
      {s === 'open' ? 'Open' : 'Closed'}
    </span>
  );
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}

export function DevicesClient({
  devices,
  token,
}: {
  devices: any[];
  token: string;
}) {
  const router = useRouter();
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [valveFilter, setValveFilter] = useState('all');
  const [search, setSearch] = useState('');

  const online = devices.filter(d => (d.connectivity ?? '').toLowerCase() === 'online').length;
  const offline = devices.filter(d => (d.connectivity ?? '').toLowerCase() === 'offline').length;
  const warning = devices.length - online - offline;

  // Extract unique zones for dropdown
  const uniqueZones = Array.from(new Set(devices.map(d => d.zone).filter(Boolean)));

  const filtered = devices.filter(d => {
    const conn = (d.connectivity ?? '').toLowerCase();
    if (statusFilter === 'online' && conn !== 'online') return false;
    if (statusFilter === 'offline' && conn !== 'offline') return false;
    if (statusFilter === 'warning' && (conn === 'online' || conn === 'offline')) return false;

    if (zoneFilter !== 'all' && (d.zone ?? '') !== zoneFilter) return false;

    const valve = (d.valveState ?? '').toLowerCase();
    if (valveFilter === 'open' && valve !== 'open') return false;
    if (valveFilter === 'closed' && valve !== 'closed') return false;

    if (!search) return true;
    const q = search.toLowerCase();
    const meterId = (d.meterId ?? d.id ?? '').toLowerCase();
    const customerId = (d.customerId ?? '').toLowerCase();
    const zone = (d.zone ?? '').toLowerCase();
    return meterId.includes(q) || customerId.includes(q) || zone.includes(q);
  });

  async function handleDeviceAction(id: string, action: 'activate' | 'deactivate') {
    setActionId(id);
    setError('');
    setSuccess('');
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(String.fromCharCode(0xFEFF), '').trim();
      const t = getCookie('sw_token') || token;
      const res = await fetch(`${API}/api/admin/devices/${id}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Action failed');
      setSuccess(`Device ${action}d successfully.`);
      router.refresh();
    } catch {
      setError(`Could not ${action} device. Please try again.`);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="section-container">
      <div className="section-header-row">
        <div>
          <h2 className="section-main-title">Devices</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {filtered.length} of {devices.length} devices shown
          </span>
        </div>
        <Link href="/devices/new" className="btn-primary-blue">+ Register Device</Link>
      </div>

      <div className="stats-strip">
        <div
          className={`stat-chip stat-chip-blue ${statusFilter === 'all' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setStatusFilter('all')}
          title="Click to view all devices"
        >
          <span className="stat-chip-val">{devices.length}</span>
          <span className="stat-chip-label">Total Devices</span>
        </div>
        <div
          className={`stat-chip stat-chip-green ${statusFilter === 'online' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setStatusFilter(statusFilter === 'online' ? 'all' : 'online')}
          title="Filter online devices"
        >
          <span className="stat-chip-val">{online}</span>
          <span className="stat-chip-label">Online</span>
        </div>
        <div
          className={`stat-chip stat-chip-red ${statusFilter === 'offline' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setStatusFilter(statusFilter === 'offline' ? 'all' : 'offline')}
          title="Filter offline devices"
        >
          <span className="stat-chip-val">{offline}</span>
          <span className="stat-chip-label">Offline</span>
        </div>
        <div
          className={`stat-chip stat-chip-amber ${statusFilter === 'warning' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setStatusFilter(statusFilter === 'warning' ? 'all' : 'warning')}
          title="Filter warning devices"
        >
          <span className="stat-chip-val">{warning}</span>
          <span className="stat-chip-label">Warning</span>
        </div>
      </div>

      {error && <div className="form-error-alert">{error}</div>}
      {success && <div className="form-success-alert">{success}</div>}

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div className="tab-pill-group">
          {[
            { id: 'all', label: 'All' },
            { id: 'online', label: `Online (${online})` },
            { id: 'offline', label: `Offline (${offline})` },
            { id: 'warning', label: `Warning (${warning})` },
          ].map(t => (
            <button
              key={t.id}
              className={`tab-pill ${statusFilter === t.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Zone Filter */}
        <select
          value={zoneFilter}
          onChange={e => setZoneFilter(e.target.value)}
          className="filter-select"
          style={{ minWidth: 140 }}
        >
          <option value="all">All Zones</option>
          {uniqueZones.map(z => (
            <option key={String(z)} value={String(z)}>{String(z)}</option>
          ))}
        </select>

        {/* Valve State Filter */}
        <select
          value={valveFilter}
          onChange={e => setValveFilter(e.target.value)}
          className="filter-select"
          style={{ minWidth: 140 }}
        >
          <option value="all">All Valves</option>
          <option value="open">Valve Open</option>
          <option value="closed">Valve Closed</option>
        </select>

        {(statusFilter !== 'all' || zoneFilter !== 'all' || valveFilter !== 'all' || search) && (
          <button
            className="filter-clear-btn"
            onClick={() => { setStatusFilter('all'); setZoneFilter('all'); setValveFilter('all'); setSearch(''); }}
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
          placeholder="Search by device ID, customer ID, or zone..."
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
              <th>Device ID</th>
              <th>Customer</th>
              <th>Zone</th>
              <th>Connectivity</th>
              <th>Valve</th>
              <th>Battery</th>
              <th>Last Update</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                  No devices found matching current filters.
                </td>
              </tr>
            )}
            {filtered.map(d => {
              const id = d.meterId ?? d.id;
              const isOnline = (d.connectivity ?? '').toLowerCase() === 'online';
              return (
                <tr key={id}>
                  <td>
                    <Link href={`/devices/${id}`} className="table-link-mono">
                      {id}
                    </Link>
                  </td>
                  <td className="text-muted-sm" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.customerId ? (
                      <Link href={`/customers/${d.customerId}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                        {d.customerName ?? d.customerId}
                      </Link>
                    ) : '—'}
                  </td>
                  <td>{d.zone ?? '—'}</td>
                  <td><ConnectivityBadge status={d.connectivity} /></td>
                  <td><ValveBadge state={d.valveState} /></td>
                  <td>{d.batteryPercent != null ? `${d.batteryPercent}%` : '—'}</td>
                  <td className="text-muted-sm" suppressHydrationWarning>
                    {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Link href={`/devices/${id}`} className="btn-table-action">
                        View
                      </Link>
                      <button
                        className={isOnline ? 'btn-device-deactivate' : 'btn-device-activate'}
                        onClick={() => handleDeviceAction(id, isOnline ? 'deactivate' : 'activate')}
                        disabled={actionId === id}
                      >
                        {actionId === id ? '...' : isOnline ? 'Deactivate' : 'Activate'}
                      </button>
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
