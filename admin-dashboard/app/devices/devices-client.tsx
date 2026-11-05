'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pagination } from '../../components/pagination';

function ConnectivityBadge({ status }: { status: string }) {
  const s = (status ?? '').toLowerCase();
  const isOnline = s === 'online';
  const isOffline = s === 'offline';

  return (
    <span className={`status-badge ${isOnline ? 'status-ok' : isOffline ? 'status-danger' : 'status-warn'}`}>
      <span
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: isOnline ? '#16a34a' : isOffline ? '#dc2626' : '#d97706',
          marginRight: 6,
        }}
      />
      {isOnline ? 'Online' : isOffline ? 'Offline' : (status || 'Unknown')}
    </span>
  );
}

function ValveBadge({ state }: { state: string }) {
  const s = (state ?? '').toLowerCase();
  const isOpen = s === 'open';
  return (
    <span className={`status-badge ${isOpen ? 'status-ok' : 'status-muted'}`}>
      {isOpen ? 'Open' : 'Closed'}
    </span>
  );
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
      title={`Battery Level: ${val}%`}
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    const customerName = (d.customerName ?? '').toLowerCase();
    const zone = (d.zone ?? '').toLowerCase();
    return meterId.includes(q) || customerId.includes(q) || customerName.includes(q) || zone.includes(q);
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleStatusFilter(s: string) {
    setStatusFilter(s);
    setPage(1);
  }

  function handleZoneFilter(z: string) {
    setZoneFilter(z);
    setPage(1);
  }

  function handleValveFilter(v: string) {
    setValveFilter(v);
    setPage(1);
  }

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

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
          onClick={() => handleStatusFilter('all')}
          title="Click to view all devices"
        >
          <span className="stat-chip-val">{devices.length}</span>
          <span className="stat-chip-label">Total Devices</span>
        </div>
        <div
          className={`stat-chip stat-chip-green ${statusFilter === 'online' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => handleStatusFilter(statusFilter === 'online' ? 'all' : 'online')}
          title="Filter online devices"
        >
          <span className="stat-chip-val">{online}</span>
          <span className="stat-chip-label">Online</span>
        </div>
        <div
          className={`stat-chip stat-chip-red ${statusFilter === 'offline' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => handleStatusFilter(statusFilter === 'offline' ? 'all' : 'offline')}
          title="Filter offline devices"
        >
          <span className="stat-chip-val">{offline}</span>
          <span className="stat-chip-label">Offline</span>
        </div>
        <div
          className={`stat-chip stat-chip-amber ${statusFilter === 'warning' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => handleStatusFilter(statusFilter === 'warning' ? 'all' : 'warning')}
          title="Filter warning devices"
        >
          <span className="stat-chip-val">{warning}</span>
          <span className="stat-chip-label">Warning</span>
        </div>
      </div>

      {error && <div className="form-error-alert">{error}</div>}
      {success && <div className="form-success-alert">{success}</div>}

      {/* Standardized Table Toolbar (Filters & Search) */}
      <div className="table-toolbar-row">
        <div className="table-toolbar-left">
          <div className="filter-tabs">
            {[
              { id: 'all', label: 'All', count: devices.length },
              { id: 'online', label: 'Online', count: online },
              { id: 'offline', label: 'Offline', count: offline },
              { id: 'warning', label: 'Warning', count: warning },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                className={`filter-tab ${statusFilter === t.id ? 'active' : ''}`}
                onClick={() => handleStatusFilter(t.id)}
              >
                {t.label}
                <span className="filter-tab-count">{t.count}</span>
              </button>
            ))}
          </div>

          {/* Zone Filter */}
          <select
            value={zoneFilter}
            onChange={e => handleZoneFilter(e.target.value)}
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
            onChange={e => handleValveFilter(e.target.value)}
            className="filter-select"
            style={{ minWidth: 140 }}
          >
            <option value="all">All Valves</option>
            <option value="open">Valve Open</option>
            <option value="closed">Valve Closed</option>
          </select>

          {(statusFilter !== 'all' || zoneFilter !== 'all' || valveFilter !== 'all' || search) && (
            <button
              type="button"
              className="filter-clear-btn"
              onClick={() => {
                setStatusFilter('all');
                setZoneFilter('all');
                setValveFilter('all');
                setSearch('');
                setPage(1);
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="table-toolbar-right">
          <div className="search-bar-wrap" style={{ width: '100%' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search devices..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="search-clear" onClick={() => handleSearch('')}>×</button>
            )}
          </div>
        </div>
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
            {paginated.map(d => {
              const id = d.meterId ?? d.id;
              const isOnline = (d.connectivity ?? '').toLowerCase() === 'online';
              return (
                <tr key={id}>
                  <td>
                    <Link href={`/devices/${id}`} className="table-link-mono" title={`View details for ${id}`}>
                      {id}
                    </Link>
                  </td>
                  <td>
                    {d.customerId ? (
                      <Link
                        href={`/customers/${d.customerId}`}
                        style={{
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontWeight: 600,
                          color: '#1e6b52',
                          fontSize: '0.88rem',
                        }}
                        title={`View profile for ${d.customerName || d.customerId}`}
                      >
                        <span>{d.customerName ?? d.customerId}</span>
                      </Link>
                    ) : (
                      <span className="status-badge status-muted" style={{ fontSize: '0.75rem' }}>
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 500 }}>
                      {d.zone ?? '—'}
                    </span>
                  </td>
                  <td><ConnectivityBadge status={d.connectivity} /></td>
                  <td><ValveBadge state={d.valveState} /></td>
                  <td><BatteryIndicator percent={d.batteryPercent} /></td>
                  <td className="text-muted-sm" suppressHydrationWarning>
                    {formatLastSeen(d.lastSeenAt)}
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

        <Pagination
          totalItems={filtered.length}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="devices"
        />
      </div>
    </div>
  );
}
