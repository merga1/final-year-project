'use client';

import { useState } from 'react';
import Link from 'next/link';

function normBillStatus(status?: string): 'paid' | 'overdue' | 'pending' {
  const s = (status ?? 'unpaid').toLowerCase().trim();
  if (s === 'paid') return 'paid';
  if (s === 'overdue') return 'overdue';
  return 'pending'; // 'unpaid', 'pending', 'open' map to pending
}

function StatusBadge({ status }: { status: string }) {
  const s = normBillStatus(status);
  if (s === 'paid') return <span className="status-badge status-ok">Paid</span>;
  if (s === 'overdue') return <span className="status-badge status-danger">Overdue</span>;
  return <span className="status-badge status-warn">Pending</span>;
}

function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr).split(' ')[0] || '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

function formatPeriod(start?: string, end?: string): string {
  if (!start && !end) return '—';
  const sStr = formatDate(start);
  const eStr = formatDate(end);
  if (sStr === '—') return eStr;
  if (eStr === '—') return sStr;
  return `${sStr} – ${eStr}`;
}

export function BillingClient({
  bills = [],
  payments = [],
}: {
  bills: any[];
  payments: any[];
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState<any | null>(null);

  const filtered = bills.filter(b => {
    const s = normBillStatus(b.status);
    if (filter !== 'all' && s !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const cust = (b.customerName ?? '').toLowerCase();
    const id = (b.id ?? '').toLowerCase();
    return cust.includes(q) || id.includes(q);
  });

  const totalInvoiced = bills.reduce((acc, b) => acc + Number(b.amountEtb ?? 0), 0);
  const paidBills = bills.filter(b => normBillStatus(b.status) === 'paid');
  const paidTotal = paidBills.reduce((acc, b) => acc + Number(b.amountEtb ?? 0), 0);
  const pendingBills = bills.filter(b => normBillStatus(b.status) === 'pending');
  const pendingTotal = pendingBills.reduce((acc, b) => acc + Number(b.amountEtb ?? 0), 0);
  const overdueBills = bills.filter(b => normBillStatus(b.status) === 'overdue');

  const counts: Record<string, number> = {
    all: bills.length,
    pending: pendingBills.length,
    overdue: overdueBills.length,
    paid: paidBills.length,
  };

  const linkedPayments = selectedBill
    ? payments.filter(p => p.billId === selectedBill.id || (p.customerId === selectedBill.customerId && (p.amount === selectedBill.amountEtb || p.amountEtb === selectedBill.amountEtb)))
    : [];

  return (
    <div className="section-container">
      <div className="section-header-row">
        <div>
          <h2 className="section-main-title">Billing & Invoices</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {bills.length} invoices generated &middot; All amounts in ETB
          </span>
        </div>
      </div>

      {/* Stats strip */}
      <div className="stats-strip">
        <div
          className={`stat-chip stat-chip-blue ${filter === 'all' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setFilter('all')}
          title="View all bills"
        >
          <span className="stat-chip-val">ETB {Math.round(totalInvoiced).toLocaleString()}</span>
          <span className="stat-chip-label">Total Invoiced</span>
        </div>
        <div
          className={`stat-chip stat-chip-green ${filter === 'paid' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setFilter(filter === 'paid' ? 'all' : 'paid')}
          title="Filter paid bills"
        >
          <span className="stat-chip-val">ETB {Math.round(paidTotal).toLocaleString()}</span>
          <span className="stat-chip-label">Collected (Chapa / Bank)</span>
        </div>
        <div
          className={`stat-chip stat-chip-amber ${filter === 'pending' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
          title="Filter pending collection"
        >
          <span className="stat-chip-val">ETB {Math.round(pendingTotal).toLocaleString()}</span>
          <span className="stat-chip-label">Pending Collection</span>
        </div>
        <div
          className={`stat-chip stat-chip-red ${filter === 'overdue' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setFilter(filter === 'overdue' ? 'all' : 'overdue')}
          title="Filter overdue bills"
        >
          <span className="stat-chip-val">{overdueBills.length}</span>
          <span className="stat-chip-label">Overdue Bills</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div className="filter-tabs">
          {['all', 'pending', 'overdue', 'paid'].map(s => (
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

        <div className="search-bar-wrap" style={{ minWidth: 260 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search invoice or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="search-clear" onClick={() => setSearch('')}>×</button>
          )}
        </div>
      </div>

      {/* Bills Data Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Customer</th>
              <th>Period</th>
              <th>Usage</th>
              <th>Tariff</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                  No bills found matching current filters.
                </td>
              </tr>
            )}
            {filtered.map(b => {
              const shortId = (b.id ?? '').replace(/-/g, '').slice(0, 8).toUpperCase();
              return (
                <tr key={b.id}>
                  <td>
                    <button
                      type="button"
                      className="table-link-mono"
                      onClick={() => setSelectedBill(b)}
                      title={`View Invoice #INV-${shortId}`}
                    >
                      #INV-{shortId}
                    </button>
                  </td>
                  <td>
                    {b.customerId ? (
                      <Link
                        href={`/customers/${b.customerId}`}
                        style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                        title="View customer profile"
                      >
                        {b.customerName ?? 'Customer'}
                      </Link>
                    ) : (
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{b.customerName ?? 'Customer'}</span>
                    )}
                  </td>
                  <td className="text-muted-sm" suppressHydrationWarning>
                    {formatPeriod(b.periodStart ?? b.billingPeriodStart, b.periodEnd ?? b.billingPeriodEnd)}
                  </td>
                  <td>{b.usageLiters != null ? `${Number(b.usageLiters).toLocaleString()} L` : '—'}</td>
                  <td className="text-muted-sm">{b.rate ? `ETB ${b.rate}/L` : 'Standard'}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    ETB {Number(b.amountEtb ?? 0).toLocaleString()}
                  </td>
                  <td className="text-muted-sm" suppressHydrationWarning>
                    {formatDate(b.dueDate)}
                  </td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    <button
                      type="button"
                      className="btn-outline-gray"
                      style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: 6, fontWeight: 500 }}
                      onClick={() => setSelectedBill(b)}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal / Detail Slide-in */}
      {selectedBill && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
        }}>
          <div className="detail-card" style={{ maxWidth: 540, width: '100%', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div className="detail-card-header">
              <div>
                <h3 className="detail-card-title">Invoice #INV-{(selectedBill.id ?? '').replace(/-/g, '').slice(0, 8).toUpperCase()}</h3>
                <span className="text-muted-sm" suppressHydrationWarning>
                  Created on {formatDate(selectedBill.createdAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <dl className="detail-fields" style={{ marginTop: 12 }}>
              <div className="detail-field-row">
                <dt>Customer</dt>
                <dd style={{ fontWeight: 700 }}>
                  {selectedBill.customerId ? (
                    <Link
                      href={`/customers/${selectedBill.customerId}`}
                      style={{ color: '#2563eb', textDecoration: 'none' }}
                    >
                      {selectedBill.customerName}
                    </Link>
                  ) : (
                    selectedBill.customerName
                  )}
                </dd>
              </div>
              <div className="detail-field-row">
                <dt>Account ID</dt>
                <dd><code className="mono-text">{selectedBill.customerId}</code></dd>
              </div>
              <div className="detail-field-row">
                <dt>Billing Period</dt>
                <dd suppressHydrationWarning>
                  {formatPeriod(selectedBill.periodStart ?? selectedBill.billingPeriodStart, selectedBill.periodEnd ?? selectedBill.billingPeriodEnd)}
                </dd>
              </div>
              <div className="detail-field-row">
                <dt>Water Usage</dt>
                <dd>{Number(selectedBill.usageLiters ?? 0).toLocaleString()} Liters</dd>
              </div>
              <div className="detail-field-row">
                <dt>Tariff Rate</dt>
                <dd>ETB {selectedBill.rate ?? 5} per Liter</dd>
              </div>
              <div className="detail-field-row">
                <dt>Total Billed</dt>
                <dd style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7' }}>
                  ETB {Number(selectedBill.amountEtb ?? 0).toLocaleString()}
                </dd>
              </div>
              <div className="detail-field-row">
                <dt>Due Date</dt>
                <dd suppressHydrationWarning>{formatDate(selectedBill.dueDate)}</dd>
              </div>
              <div className="detail-field-row">
                <dt>Status</dt>
                <dd><StatusBadge status={selectedBill.status} /></dd>
              </div>
            </dl>

            {/* Linked Payments */}
            <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Linked Payment Record</h4>
              {linkedPayments.length > 0 ? (
                linkedPayments.map((p, idx) => (
                  <div key={p.id ?? idx} style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>ETB {p.amount ?? p.amountEtb} via {(p.method ?? 'chapa').toUpperCase()}</span>
                      <span className="status-badge status-ok">{p.status}</span>
                    </div>
                    <span className="text-muted-sm" style={{ display: 'block', marginTop: 4 }} suppressHydrationWarning>
                      Ref: {p.reference ?? 'N/A'} &middot; {formatDate(p.paidAt ?? p.createdAt)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-sm" style={{ fontStyle: 'italic', margin: 0 }}>
                  {normBillStatus(selectedBill.status) === 'paid'
                    ? 'Payment confirmed via payment gateway callback.'
                    : 'No payment recorded yet. Customer can pay via mobile app (Chapa / Telebirr).'}
                </p>
              )}
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn-outline-gray"
                onClick={() => setSelectedBill(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
