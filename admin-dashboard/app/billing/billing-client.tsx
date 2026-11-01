'use client';

import { useState } from 'react';
import Link from 'next/link';

function StatusBadge({ status }: { status: string }) {
  const s = (status ?? '').toLowerCase();
  if (s === 'paid') return <span className="status-badge status-ok">Paid</span>;
  if (s === 'overdue') return <span className="status-badge status-danger">Overdue</span>;
  return <span className="status-badge status-warn">Pending</span>;
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
    const s = (b.status ?? 'pending').toLowerCase();
    if (filter !== 'all' && s !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const cust = (b.customerName ?? '').toLowerCase();
    const id = (b.id ?? '').toLowerCase();
    return cust.includes(q) || id.includes(q);
  });

  const totalInvoiced = bills.reduce((acc, b) => acc + Number(b.amountEtb ?? 0), 0);
  const paidBills = bills.filter(b => (b.status ?? '').toLowerCase() === 'paid');
  const paidTotal = paidBills.reduce((acc, b) => acc + Number(b.amountEtb ?? 0), 0);
  const pendingBills = bills.filter(b => (b.status ?? '').toLowerCase() === 'pending');
  const pendingTotal = pendingBills.reduce((acc, b) => acc + Number(b.amountEtb ?? 0), 0);
  const overdueBills = bills.filter(b => (b.status ?? '').toLowerCase() === 'overdue');

  const counts: Record<string, number> = {
    all: bills.length,
    pending: pendingBills.length,
    overdue: overdueBills.length,
    paid: paidBills.length,
  };

  const linkedPayments = selectedBill
    ? payments.filter(p => p.billId === selectedBill.id || (p.customerId === selectedBill.customerId && p.amount === selectedBill.amountEtb))
    : [];

  return (
    <div className="section-container">
      <div className="section-header-row">
        <h2 className="section-main-title">Billing & Invoices</h2>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
          {bills.length} invoices generated &middot; All amounts in ETB
        </span>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
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
          <input
            type="text"
            className="search-input"
            placeholder="Search invoice or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="search-clear" onClick={() => setSearch('')}>x</button>
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
                  No bills found
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
                      className="link-mono"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => setSelectedBill(b)}
                    >
                      #INV-{shortId}
                    </button>
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{b.customerName ?? 'Customer'}</td>
                  <td className="text-muted-sm">{b.periodStart ?? '—'} to {b.periodEnd ?? '—'}</td>
                  <td>{b.usageLiters != null ? `${Number(b.usageLiters).toLocaleString()} L` : '—'}</td>
                  <td className="text-muted-sm">{b.rate ? `ETB ${b.rate}/L` : 'Standard'}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    ETB {Number(b.amountEtb ?? 0).toLocaleString()}
                  </td>
                  <td className="text-muted-sm">{b.dueDate ?? '—'}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    <button
                      type="button"
                      className="btn-outline-gray"
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
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

      {/* Modal / Detail Slide-in (AD-39: Bill Detail) */}
      {selectedBill && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
        }}>
          <div className="detail-card" style={{ maxWidth: 520, width: '100%', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div className="detail-card-header">
              <div>
                <h3 className="detail-card-title">Invoice #INV-{(selectedBill.id ?? '').slice(0, 8).toUpperCase()}</h3>
                <span className="text-muted-sm">Created on {selectedBill.createdAt ? new Date(selectedBill.createdAt).toLocaleDateString() : '—'}</span>
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
                <dd style={{ fontWeight: 700 }}>{selectedBill.customerName}</dd>
              </div>
              <div className="detail-field-row">
                <dt>Account ID</dt>
                <dd><code className="mono-text">{selectedBill.customerId}</code></dd>
              </div>
              <div className="detail-field-row">
                <dt>Billing Period</dt>
                <dd>{selectedBill.periodStart} &mdash; {selectedBill.periodEnd}</dd>
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
                <dd>{selectedBill.dueDate ?? '—'}</dd>
              </div>
              <div className="detail-field-row">
                <dt>Status</dt>
                <dd><StatusBadge status={selectedBill.status} /></dd>
              </div>
            </dl>

            {/* Linked Payments (AD-39) */}
            <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Linked Payment Record</h4>
              {linkedPayments.length > 0 ? (
                linkedPayments.map((p, idx) => (
                  <div key={p.id ?? idx} style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>ETB {p.amount} via {p.method?.toUpperCase()}</span>
                      <span className="status-badge status-ok">{p.status}</span>
                    </div>
                    <span className="text-muted-sm" style={{ display: 'block', marginTop: 4 }}>
                      Ref: {p.reference ?? 'N/A'} &middot; {p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-sm" style={{ fontStyle: 'italic' }}>
                  {selectedBill.status === 'paid'
                    ? 'Payment confirmed via payment gateway callback.'
                    : 'No payment recorded yet. Customer can pay via mobile app (Chapa).'}
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
