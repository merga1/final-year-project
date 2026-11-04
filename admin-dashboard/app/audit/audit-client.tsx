'use client';

import { useState } from 'react';
import { Pagination } from '../../components/pagination';

function StatusTag({ status }: { status: string }) {
  const s = (status ?? 'SUCCESS').toUpperCase();
  if (s === 'SUCCESS') return <span className="status-badge status-ok">Success</span>;
  if (s === 'WARNING') return <span className="status-badge status-warn">Warning</span>;
  return <span className="status-badge status-danger">Failed</span>;
}

function CategoryTag({ category }: { category: string }) {
  const cat = (category ?? 'GENERAL').toUpperCase();
  let bg = '#f1f5f9';
  let color = '#475569';
  if (cat === 'DEVICE') { bg = '#f0fdf9'; color = '#1e6b52'; }
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

function formatAction(action: string) {
  if (!action) return 'Action';
  return action
    .toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatAuditDate(dateStr?: string | Date) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateStr);
  }
}

export function AuditClient({ logs = [] }: { logs: any[] }) {
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const deviceCount = logs.filter(l => (l.category ?? '').toUpperCase() === 'DEVICE').length;
  const valveCount = logs.filter(l => (l.category ?? '').toUpperCase() === 'VALVE').length;
  const ticketCount = logs.filter(l => (l.category ?? '').toUpperCase() === 'TICKET').length;
  const customerCount = logs.filter(l => (l.category ?? '').toUpperCase() === 'CUSTOMER').length;
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

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleCategoryFilter(c: string) {
    setCategoryFilter(c);
    setPage(1);
  }

  function handleStatusFilter(s: string) {
    setStatusFilter(s);
    setPage(1);
  }

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

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
          onClick={() => handleCategoryFilter('all')}
          title="View all events"
        >
          <span className="stat-chip-val">{logs.length}</span>
          <span className="stat-chip-label">Total Events</span>
        </div>
        <div
          className={`stat-chip stat-chip-green ${categoryFilter === 'device' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => handleCategoryFilter(categoryFilter === 'device' ? 'all' : 'device')}
          title="Filter device events"
        >
          <span className="stat-chip-val">{deviceCount}</span>
          <span className="stat-chip-label">Device Operations</span>
        </div>
        <div
          className={`stat-chip stat-chip-amber ${categoryFilter === 'valve' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => handleCategoryFilter(categoryFilter === 'valve' ? 'all' : 'valve')}
          title="Filter valve actuations"
        >
          <span className="stat-chip-val">{valveCount}</span>
          <span className="stat-chip-label">Valve Actuations</span>
        </div>
        <div
          className={`stat-chip stat-chip-purple ${categoryFilter === 'ticket' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => handleCategoryFilter(categoryFilter === 'ticket' ? 'all' : 'ticket')}
          title="Filter ticket dispatches"
        >
          <span className="stat-chip-val">{ticketCount}</span>
          <span className="stat-chip-label">Ticket Changes</span>
        </div>
        <div
          className={`stat-chip stat-chip-amber ${categoryFilter === 'customer' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => handleCategoryFilter(categoryFilter === 'customer' ? 'all' : 'customer')}
          title="Filter customer operations"
        >
          <span className="stat-chip-val">{customerCount}</span>
          <span className="stat-chip-label">Customer Ops</span>
        </div>
      </div>

      {/* Standardized Table Toolbar (Filters & Search) */}
      <div className="table-toolbar-row">
        <div className="table-toolbar-left">
          <div className="filter-tabs">
            {[
              { id: 'all', label: 'All', count: logs.length },
              { id: 'device', label: 'Device', count: deviceCount },
              { id: 'valve', label: 'Valve', count: valveCount },
              { id: 'ticket', label: 'Ticket', count: ticketCount },
              { id: 'customer', label: 'Customer', count: customerCount },
              { id: 'billing', label: 'Billing', count: billingCount },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                className={`filter-tab ${categoryFilter === t.id ? 'active' : ''}`}
                onClick={() => handleCategoryFilter(t.id)}
              >
                {t.label}
                <span className="filter-tab-count">{t.count}</span>
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={e => handleStatusFilter(e.target.value)}
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
              type="button"
              className="filter-clear-btn"
              onClick={() => {
                setCategoryFilter('all');
                setStatusFilter('all');
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
              placeholder="Search audit trail..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="search-clear" onClick={() => handleSearch('')}>×</button>
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="table-card" style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
          No audit entries matching current filters.
        </div>
      ) : viewMode === 'timeline' ? (
        /* ── Chronological Timeline View ── */
        <div className="table-card" style={{ padding: '24px 20px 0 20px', overflow: 'hidden' }}>
          <div style={{ position: 'relative', paddingLeft: 24, marginBottom: 20 }}>
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
              {paginated.map(entry => (
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
                      backgroundColor: entry.status === 'WARNING' ? '#d97706' : entry.status === 'FAILED' ? '#dc2626' : '#1e6b52',
                      border: '2px solid #ffffff',
                      boxShadow: '0 0 0 2px #cbd5e1',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <CategoryTag category={entry.category} />
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                        {formatAction(entry.action)}
                      </strong>
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>on</span>
                      <span className="table-link-mono" style={{ fontSize: '0.82rem' }}>
                        {entry.targetEntity}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <StatusTag status={entry.status} />
                      <span className="text-muted-sm" suppressHydrationWarning style={{ fontSize: '0.8rem' }}>
                        {formatAuditDate(entry.createdAt)}
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

          <Pagination
            totalItems={filtered.length}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="audit events"
          />
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
              {paginated.map(entry => (
                <tr key={entry.id}>
                  <td className="text-muted-sm" suppressHydrationWarning style={{ whiteSpace: 'nowrap' }}>
                    {formatAuditDate(entry.createdAt)}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{entry.actor}</td>
                  <td>
                    <CategoryTag category={entry.category} />
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                    {formatAction(entry.action)}
                  </td>
                  <td>
                    <span className="table-link-mono" style={{ fontSize: '0.8rem' }}>
                      {entry.targetEntity}
                    </span>
                  </td>
                  <td style={{ maxWidth: 320, fontSize: '0.86rem', color: '#334155' }}>{entry.details}</td>
                  <td><StatusTag status={entry.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            totalItems={filtered.length}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="audit events"
          />
        </div>
      )}
    </div>
  );
}
