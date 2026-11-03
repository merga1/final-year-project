'use client';

import { useState } from 'react';
import Link from 'next/link';

function PaymentStatusBadge({ status }: { status: string }) {
  const s = (status ?? '').toLowerCase();
  if (s === 'verified') return <span className="status-badge status-ok">Verified</span>;
  if (s === 'pending') return <span className="status-badge status-warn">Pending</span>;
  if (s === 'failed') return <span className="status-badge status-danger">Failed</span>;
  return <span className="status-badge status-muted">{status || 'Unknown'}</span>;
}

function PaymentMethodBadge({ method }: { method?: string }) {
  const m = (method ?? '').toLowerCase();
  if (m.includes('chapa') || m.includes('chappa')) {
    return (
      <span className="type-pill" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
        Chapa
      </span>
    );
  }
  if (m.includes('telebirr') || m.includes('mobile')) {
    return (
      <span className="type-pill" style={{ background: '#ecfeff', color: '#0e7490', border: '1px solid #a5f3fc' }}>
        Telebirr
      </span>
    );
  }
  if (m.includes('bank') || m.includes('cbe')) {
    return (
      <span className="type-pill" style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
        CBE Birr / Bank
      </span>
    );
  }
  return (
    <span className="type-pill" style={{ textTransform: 'capitalize' }}>
      {method || 'Cash'}
    </span>
  );
}

function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
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
      if (methodFilter === 'telebirr' && !m.includes('telebirr') && !m.includes('mobile')) return false;
      if (methodFilter === 'cbe' && !m.includes('cbe') && !m.includes('bank')) return false;
      if (methodFilter === 'chapa' && !m.includes('chapa') && !m.includes('chappa')) return false;
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

  const totalCollected = verified.reduce((acc, p) => acc + Number(p.amount ?? p.amountEtb ?? 0), 0);
  const totalPending = pending.reduce((acc, p) => acc + Number(p.amount ?? p.amountEtb ?? 0), 0);

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
            {filtered.length} of {payments.length} transactions shown &middot; Ethiopian Gateway (Chapa / Telebirr / CBE)
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
            style={{ minWidth: 160 }}
          >
            <option value="all">All Gateways</option>
            <option value="chapa">Chapa Card / Bank</option>
            <option value="telebirr">Telebirr</option>
            <option value="cbe">CBE Birr / Bank</option>
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
            <button type="button" className="search-clear" onClick={() => setSearch('')}>×</button>
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
                    <code className="table-link-mono" style={{ display: 'inline-block' }}>
                      {ref}
                    </code>
                  </td>
                  <td>
                    {p.customerId ? (
                      <Link
                        href={`/customers/${p.customerId}`}
                        style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                        title="View customer profile"
                      >
                        {p.customerName ?? 'Customer'}
                      </Link>
                    ) : (
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.customerName ?? 'Customer'}</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    ETB {Number(p.amount ?? p.amountEtb ?? 0).toLocaleString()}
                  </td>
                  <td>
                    <PaymentMethodBadge method={p.method ?? p.paymentMethod} />
                  </td>
                  <td className="text-muted-sm" suppressHydrationWarning>
                    {formatDate(p.paidAt ?? p.createdAt)}
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
