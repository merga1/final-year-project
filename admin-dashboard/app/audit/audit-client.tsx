'use client';

import { useState } from 'react';
import Link from 'next/link';

function StatusTag({ status }: { status: string }) {
  const s = (status ?? 'SUCCESS').toUpperCase();
  if (s === 'SUCCESS') return <span className="status-badge status-ok">SUCCESS</span>;
  if (s === 'WARNING') return <span className="status-badge status-warn">WARNING</span>;
  return <span className="status-badge status-danger">FAILED</span>;
}

function CategoryTag({ category }: { category: string }) {
  const cat = (category ?? 'GENERAL').toUpperCase();
  let bg = '#f1f5f9';
  let color = '#475569';
  if (cat === 'DEVICE') { bg = '#eff6ff'; color = '#2563eb'; }
  else if (cat === 'VALVE') { bg = '#ecfdf5'; color = '#059669'; }
  else if (cat === 'TICKET') { bg = '#f5f3ff'; color = '#7c3aed'; }
  else if (cat === 'CUSTOMER') { bg = '#fff7ed'; color = '#ea580c'; }
  else if (cat === 'BILLING') { bg = '#f0fdf4'; color = '#16a34a'; }

  return (
    <span
      style={{
        padding: '3px 8px',
        borderRadius: 6,
        fontSize: '0.74rem',
        fontWeight: 700,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${color}33`,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {cat}
    </span>
  );
}

export function AuditClient({ logs = [] }: { logs: any[] }) {
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const deviceCount = logs.filter(l => (l.category ?? '').toUpperCase() === 'DEVICE').length;
  const valveCount = logs.filter(l => (l.category ?? '').toUpperCase() === 'VALVE').length;
  const ticketCount = logs.filter(l => (l.category ?? '').toUpperCase() === 'TICKET').length;
  const billingCount = logs.filter(l => (l.category ?? '').toUpperCase() === 'BILLING').length;

  const filtered = logs.filter(l => {
    const cat = (l.category ?? 'GENERAL').toLowerCase();
    if (categoryFilter !== 'all' && cat !== categoryFilter.toLowerCase()) return false;

    const stat = (l.status ?? 'SUCCESS').toLowerCase();
    if (statusFilter !== 'all' && stat !== statusFilter.toLowerCase()) return false;

    if (!search) return true;
    const q = search.toLowerCase();
    const actor = (l.actor ?? '').toLowerCase();
    const action = (l.action ?? '').toLowerCase();
    const target = (l.targetEntity ?? '').toLowerCase();
    const details = (l.details ?? '').toLowerCase();
    return actor.includes(q) || action.includes(q) || target.includes(q) || details.includes(q);
  });

  return (
    <div className="section-container">
      <div className="section-header-row">
        <div>
          <h2 className="section-main-title">Audit Log & Change History</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {filtered.length} of {logs.length} events recorded &middot; Attributable change audit trail (SRS NFR-A07)
          </span>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
          <button
            type="button"
            className={`tab-pill ${viewMode === 'timeline' ? 'active' : ''}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setViewMode('timeline')}
          >
            Timeline View
          </button>
          <button
            type="button"
            className={`tab-pill ${viewMode === 'table' ? 'active' : ''}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setViewMode('table')}
          >
            Table View
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="stats-strip">
        <div
          className={`stat-chip stat-chip-blue ${categoryFilter === 'all' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setCategoryFilter('all')}
          title="View all events"
        >
          <span className="stat-chip-val">{logs.length}</span>
          <span className="stat-chip-label">Total Events</span>
        </div>
        <div
          className={`stat-chip stat-chip-green ${categoryFilter === 'device' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setCategoryFilter(categoryFilter === 'device' ? 'all' : 'device')}
          title="Filter device events"
        >
          <span className="stat-chip-val">{deviceCount}</span>
          <span className="stat-chip-label">Device Operations</span>
        </div>
        <div
          className={`stat-chip stat-chip-amber ${categoryFilter === 'valve' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setCategoryFilter(categoryFilter === 'valve' ? 'all' : 'valve')}
          title="Filter valve actuations"
        >
          <span className="stat-chip-val">{valveCount}</span>
          <span className="stat-chip-label">Valve Actuations</span>
        </div>
        <div
          className={`stat-chip stat-chip-purple ${categoryFilter === 'ticket' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setCategoryFilter(categoryFilter === 'ticket' ? 'all' : 'ticket')}
          title="Filter ticket dispatches"
        >
          <span className="stat-chip-val">{ticketCount}</span>
          <span className="stat-chip-label">Ticket Changes</span>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div className="tab-pill-group">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'device', label: `Device (${deviceCount})` },
            { id: 'valve', label: `Valve (${valveCount})` },
            { id: 'ticket', label: `Ticket (${ticketCount})` },
            { id: 'billing', label: `Billing (${billingCount})` },
          ].map(t => (
            <button
              key={t.id}
              className={`tab-pill ${categoryFilter === t.id ? 'active' : ''}`}
              onClick={() => setCategoryFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="filter-select"
          style={{ minWidth: 140 }}
        >
          <option value="all">All Statuses</option>
          <option value="success">Success Only</option>
          <option value="warning">Warning Only</option>
          <option value="failed">Failed Only</option>
        </select>

        {(categoryFilter !== 'all' || statusFilter !== 'all' || search) && (
          <button
            className="filter-clear-btn"
            onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); setSearch(''); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Search */}
      <div className="search-bar-wrap" style={{ marginBottom: 20 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search by actor, action name, target entity, or change details..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button type="button" className="search-clear" onClick={() => setSearch('')}>x</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="table-card" style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
          No audit entries matching current filters.
        </div>
      ) : viewMode === 'timeline' ? (
        /* ── Chronological Timeline View ── */
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          {/* Vertical line connecting nodes */}
          <div
            style={{
              position: 'absolute',
              top: 16,
              bottom: 16,
              left: 10,
              width: 2,
              backgroundColor: '#e2e8f0',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(entry => (
              <div
                key={entry.id}
                style={{
                  position: 'relative',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '16px 20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {/* Timeline node dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: -20,
                    top: 20,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: entry.status === 'WARNING' ? '#d97706' : entry.status === 'FAILED' ? '#dc2626' : '#2563eb',
                    border: '2px solid #ffffff',
                    boxShadow: '0 0 0 2px #cbd5e1',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <CategoryTag category={entry.category} />
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                      {entry.action.replace(/_/g, ' ')}
                    </strong>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>on</span>
                    <code className="mono-text" style={{ fontWeight: 600, color: '#1e293b' }}>
                      {entry.targetEntity}
                    </code>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusTag status={entry.status} />
                    <span className="text-muted-sm" suppressHydrationWarning style={{ fontSize: '0.8rem' }}>
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>

                <p style={{ margin: '6px 0 10px 0', fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                  {entry.details}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                  <span>
                    Initiated by: <strong style={{ color: '#0f172a' }}>{entry.actor}</strong>
                  </span>
                  {entry.ipAddress && (
                    <span className="mono-text" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      IP: {entry.ipAddress}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Compact Table View ── */
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Category</th>
                <th>Action</th>
                <th>Target Entity</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr key={entry.id}>
                  <td className="text-muted-sm" suppressHydrationWarning style={{ whiteSpace: 'nowrap' }}>
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                    {entry.actor}
                  </td>
                  <td><CategoryTag category={entry.category} /></td>
                  <td style={{ fontWeight: 600 }}>{entry.action.replace(/_/g, ' ')}</td>
                  <td><code className="mono-text">{entry.targetEntity}</code></td>
                  <td style={{ maxWidth: 300, fontSize: '0.85rem' }}>{entry.details}</td>
                  <td><StatusTag status={entry.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
