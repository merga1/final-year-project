'use client';

import { useState } from 'react';
import Link from 'next/link';

function formatName(name: string | undefined | null): string {
  if (!name) return 'Customer';
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? 'active').toLowerCase();
  if (s === 'active') return <span className="status-badge status-ok">Active</span>;
  if (s === 'suspended') return <span className="status-badge status-danger">Suspended</span>;
  if (s === 'pending') return <span className="status-badge status-warn">Pending</span>;
  return <span className="status-badge status-muted">{status || 'Unknown'}</span>;
}

export function CustomersClient({ customers }: { customers: any[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [meterFilter, setMeterFilter] = useState('all');

  const getStatus = (c: any) => (c.accountStatus ?? c.status ?? 'active').toLowerCase();

  const active = customers.filter(c => getStatus(c) === 'active').length;
  const suspended = customers.filter(c => getStatus(c) === 'suspended').length;
  const pending = customers.filter(c => getStatus(c) === 'pending').length;

  const filtered = customers.filter(c => {
    const s = getStatus(c);
    if (statusFilter !== 'all' && s !== statusFilter) return false;

    const hasMeter = Boolean(c.meterId ?? c.deviceId);
    if (meterFilter === 'metered' && !hasMeter) return false;
    if (meterFilter === 'unmetered' && hasMeter) return false;

    if (!search) return true;
    const q = search.toLowerCase();
    const rawName = c.name ?? `${c.firstName ?? ''} ${c.lastName ?? ''}`;
    const formatted = formatName(rawName).toLowerCase();
    const email = (c.email ?? '').toLowerCase();
    const phone = (c.phone ?? c.phoneNumber ?? '').toLowerCase();
    const deviceId = (c.meterId ?? c.deviceId ?? '').toLowerCase();
    return formatted.includes(q) || email.includes(q) || phone.includes(q) || deviceId.includes(q);
  });

  return (
    <div className="section-container">
      <div className="section-header-row">
        <div>
          <h2 className="section-main-title">Customers</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {filtered.length} of {customers.length} registered customers shown
          </span>
        </div>
        <Link href="/customers/new" className="btn-primary-blue">
          + Add Customer
        </Link>
      </div>

      {/* Interactive KPI Stat Cards */}
      <div className="stats-strip">
        <div
          className={`stat-chip stat-chip-blue ${statusFilter === 'all' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          onClick={() => setStatusFilter('all')}
          title="Click to view all customers"
        >
          <span className="stat-chip-val">{customers.length}</span>
          <span className="stat-chip-label">Total Customers</span>
        </div>
        <div
          className={`stat-chip stat-chip-green ${statusFilter === 'active' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
          title="Filter active customers"
        >
          <span className="stat-chip-val">{active}</span>
          <span className="stat-chip-label">Active</span>
        </div>
        <div
          className={`stat-chip stat-chip-red ${statusFilter === 'suspended' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          onClick={() => setStatusFilter(statusFilter === 'suspended' ? 'all' : 'suspended')}
          title="Filter suspended customers"
        >
          <span className="stat-chip-val">{suspended}</span>
          <span className="stat-chip-label">Suspended</span>
        </div>
        <div
          className={`stat-chip stat-chip-amber ${statusFilter === 'pending' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          title="Filter pending activation"
        >
          <span className="stat-chip-val">{pending}</span>
          <span className="stat-chip-label">Pending Activation</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        {/* Status Tab Pills */}
        <div className="tab-pill-group">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: `Active (${active})` },
            { id: 'suspended', label: `Suspended (${suspended})` },
            { id: 'pending', label: `Pending (${pending})` },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              className={`tab-pill ${statusFilter === t.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Meter Assignment Filter */}
        <select
          value={meterFilter}
          onChange={e => setMeterFilter(e.target.value)}
          className="filter-select"
          style={{ minWidth: 160 }}
        >
          <option value="all">All Meter Status</option>
          <option value="metered">Assigned Meter Only</option>
          <option value="unmetered">No Meter Linked</option>
        </select>

        {(statusFilter !== 'all' || meterFilter !== 'all' || search) && (
          <button
            type="button"
            className="filter-clear-btn"
            onClick={() => {
              setStatusFilter('all');
              setMeterFilter('all');
              setSearch('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="search-bar-wrap" style={{ marginBottom: 16 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search by customer name, email, phone, or meter ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button type="button" className="search-clear" onClick={() => setSearch('')}>
            &times;
          </button>
        )}
      </div>

      {/* Customer Data Table */}
      <div className="table-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Device ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '36px' }}>
                    No customers found matching current filters.
                  </td>
                </tr>
              )}
              {filtered.map(c => {
                const rawName = c.name ?? (`${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'Customer');
                const displayName = formatName(rawName);
                const initial = displayName.charAt(0).toUpperCase();
                const deviceId = c.meterId ?? c.deviceId ?? null;
                const status = getStatus(c);

                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#e0f2fe',
                            color: '#0369a1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            flexShrink: 0,
                          }}
                        >
                          {initial}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <Link
                            href={`/customers/${c.id}`}
                            style={{
                              fontWeight: 700,
                              color: '#0f172a',
                              textDecoration: 'none',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#0284c7')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#0f172a')}
                          >
                            {displayName}
                          </Link>
                          {c.address && (
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {c.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: '0.85rem', color: '#334155' }}>
                          {c.email ?? '—'}
                        </span>
                        {c.phone && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {c.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {deviceId ? (
                        <Link
                          href={`/devices/${deviceId}`}
                          style={{
                            display: 'inline-block',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#0284c7',
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            padding: '3px 8px',
                            borderRadius: 6,
                            textDecoration: 'none',
                          }}
                        >
                          {deviceId}
                        </Link>
                      ) : (
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            background: '#f1f5f9',
                            padding: '3px 8px',
                            borderRadius: 6,
                          }}
                        >
                          No meter linked
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Link href={`/customers/${c.id}`} className="btn-table-action">
                          View
                        </Link>
                        <Link
                          href={`/support-tickets?customerId=${c.id}`}
                          className="btn-table-action-purple"
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
    </div>
  );
}
