'use client';

import { useState } from 'react';

function PaymentStatusBadge({ status }: { status: string }) {
  const s = (status ?? '').toLowerCase();
  if (s === 'verified') return <span className="status-badge status-ok">Verified</span>;
  if (s === 'pending') return <span className="status-badge status-warn">Pending</span>;
  if (s === 'failed') return <span className="status-badge status-danger">Failed</span>;
  return <span className="status-badge status-muted">{status || 'Unknown'}</span>;
}

export function PaymentsClient({ payments = [] }: { payments: any[] }) {
  const [filter, setFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = payments.filter(p => {
    const s = (p.status ?? 'pending').toLowerCase();
    if (filter !== 'all' && s !== filter) return false;

    const m = (p.method ?? '').toLowerCase();
    if (methodFilter !== 'all') {
      if (methodFilter === 'telebirr' && !m.includes('telebirr')) return false;
      if (methodFilter === 'cbe' && !m.includes('cbe')) return false;
      if (methodFilter === 'chapa' && !m.includes('chapa')) return false;
      if (methodFilter === 'cash' && !m.includes('cash')) return false;
    }

    if (!search) return true;
    const q = search.toLowerCase();
    const cust = (p.customerName ?? '').toLowerCase();
    const ref = (p.reference ?? '').toLowerCase();
    const method = (p.method ?? '').toLowerCase();
    return cust.includes(q) || ref.includes(q) || method.includes(q);
  });

  const verified = payments.filter(p => (p.status ?? '').toLowerCase() === 'verified');
  const pending = payments.filter(p => (p.status ?? '').toLowerCase() === 'pending');
  const failed = payments.filter(p => (p.status ?? '').toLowerCase() === 'failed');

  const totalCollected = verified.reduce((acc, p) => acc + Number(p.amount ?? 0), 0);
  const totalPending = pending.reduce((acc, p) => acc + Number(p.amount ?? 0), 0);

  const counts: Record<string, number> = {
    all: payments.length,
    verified: verified.length,
    pending: pending.length,
    failed: failed.length,
  };

  return (
    <div className="section-container">
      <div className="section-header-row">
        <div>
          <h2 className="section-main-title">Payments Verification</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {filtered.length} of {payments.length} transactions shown &middot; Ethiopian Gateway (Chapa / Telebirr)
          </span>
        </div>
      </div>

      <div className="stats-strip">
        <div
          className={`stat-chip stat-chip-green ${filter === 'verified' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setFilter(filter === 'verified' ? 'all' : 'verified')}
          title="Filter verified payments"
        >
          <span className="stat-chip-val">ETB {Math.round(totalCollected).toLocaleString()}</span>
          <span className="stat-chip-label">Verified Collections</span>
        </div>
        <div
          className={`stat-chip stat-chip-amber ${filter === 'pending' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
          title="Filter pending verification"
        >
          <span className="stat-chip-val">ETB {Math.round(totalPending).toLocaleString()}</span>
          <span className="stat-chip-label">Pending Verification</span>
        </div>
        <div
          className={`stat-chip stat-chip-blue ${filter === 'all' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => { setFilter('all'); setMethodFilter('all'); setSearch(''); }}
          title="View all transactions"
        >
          <span className="stat-chip-val">{payments.length}</span>
          <span className="stat-chip-label">Total Transactions</span>
        </div>
        <div
          className={`stat-chip stat-chip-red ${filter === 'failed' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setFilter(filter === 'failed' ? 'all' : 'failed')}
          title="Filter failed payments"
        >
          <span className="stat-chip-val">{failed.length}</span>
          <span className="stat-chip-label">Failed / Disputed</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="filter-tabs">
            {['all', 'verified', 'pending', 'failed'].map(s => (
              <button
                key={s}
                type="button"
                className={`filter-tab ${filter === s ? 'active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                <span className="filter-tab-count">{counts[s] ?? 0}</span>
              </button>
            ))}
          </div>

          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="filter-select"
            style={{ minWidth: 150 }}
          >
            <option value="all">All Gateways</option>
            <option value="telebirr">Telebirr</option>
            <option value="cbe">CBE Birr</option>
            <option value="chapa">Chapa Card / Bank</option>
            <option value="cash">Cash Office</option>
          </select>
        </div>

        <div className="search-bar-wrap" style={{ minWidth: 260 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search reference, customer, method..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="search-clear" onClick={() => setSearch('')}>x</button>
          )}
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                  No payment records found matching current filters.
                </td>
              </tr>
            )}
            {filtered.map(p => {
              const ref = p.reference ?? p.transactionRef ?? (p.id ? `TX-${p.id.slice(0, 8).toUpperCase()}` : '—');
              return (
                <tr key={p.id}>
                  <td>
                    <code className="mono-text" style={{ fontWeight: 600 }}>{ref}</code>
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{p.customerName ?? 'Customer'}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    ETB {Number(p.amount ?? 0).toLocaleString()}
                  </td>
                  <td>
                    <span className="type-pill" style={{ textTransform: 'capitalize' }}>
                      {p.method ?? p.paymentMethod ?? 'Chapa'}
                    </span>
                  </td>
                  <td className="text-muted-sm" suppressHydrationWarning>
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : p.date ?? '—'}
                  </td>
                  <td><PaymentStatusBadge status={p.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
