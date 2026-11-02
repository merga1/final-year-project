'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  open: 'Pending',
  assigned: 'Assigned',
  accepted: 'Accepted',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'status-badge status-warn',
  open: 'status-badge status-warn',
  assigned: 'status-badge status-info',
  accepted: 'status-badge status-info',
  resolved: 'status-badge status-ok',
  closed: 'status-badge status-muted',
};

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}

const ALL_STATUSES = ['all', 'pending', 'assigned', 'accepted', 'resolved', 'closed'];

export function TicketsClient({
  tickets,
  technicians,
  customers = [],
  token,
  initialTechId,
  initialCustomerId,
}: {
  tickets: any[];
  technicians: any[];
  customers?: any[];
  token: string;
  initialTechId?: string;
  initialCustomerId?: string;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');
  const [techFilter, setTechFilter] = useState<string>(initialTechId ?? '');
  const [customerFilter, setCustomerFilter] = useState<string>(initialCustomerId ?? '');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignTechId, setAssignTechId] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const normalizeStatus = (s: string) => {
    const lower = (s ?? 'pending').toLowerCase();
    return lower === 'open' ? 'pending' : lower;
  };

  // Base tickets filtered by technician and/or customer
  const scopedTickets = tickets.filter(t => {
    const rawStatus = (t.status ?? 'pending').toLowerCase();
    const isPending = rawStatus === 'pending' || rawStatus === 'open';

    if (techFilter) {
      // Pending tickets are unassigned and waiting to be dispatched; not part of any technician's active workload
      if (isPending) return false;
      if (t.technicianId !== techFilter) return false;
    }

    if (customerFilter && t.customerId !== customerFilter) return false;

    const pri = (t.priority ?? 'medium').toLowerCase();
    if (priorityFilter !== 'all' && pri !== priorityFilter) return false;

    const typ = (t.type ?? t.issueType ?? '').toLowerCase();
    if (typeFilter !== 'all') {
      if (typeFilter === 'sensor' && !typ.includes('sensor')) return false;
      if (typeFilter === 'valve' && !typ.includes('valve')) return false;
      if (typeFilter === 'leak' && !typ.includes('leak')) return false;
      if (typeFilter === 'billing' && !typ.includes('bill')) return false;
    }

    if (!search) return true;
    const q = search.toLowerCase();
    const id = (t.id ?? '').toLowerCase();
    const desc = (t.description ?? t.issue ?? '').toLowerCase();
    const cust = (t.customerName ?? '').toLowerCase();
    const tech = (t.technicianName ?? '').toLowerCase();
    return id.includes(q) || desc.includes(q) || cust.includes(q) || tech.includes(q);
  });

  const filtered = statusFilter === 'all'
    ? scopedTickets
    : scopedTickets.filter(t => normalizeStatus(t.status) === statusFilter);

  const counts: Record<string, number> = { all: scopedTickets.length };
  for (const s of ['pending', 'assigned', 'accepted', 'resolved', 'closed']) {
    counts[s] = scopedTickets.filter(t => normalizeStatus(t.status) === s).length;
  }

  const selectedTech = technicians.find(t => t.id === techFilter);
  const selectedCust = customers.find(c => c.id === customerFilter);

  async function handleAssign(ticketId: string) {
    const techId = assignTechId[ticketId];
    if (!techId) { setError('Please select a technician first.'); return; }
    setAssigning(ticketId);
    setError('');
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(String.fromCharCode(0xFEFF), '').trim();
      const t = getCookie('sw_token') || token;
      const res = await fetch(`${API}/api/admin/support-tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: techId, status: 'assigned' }),
      });
      if (!res.ok) throw new Error('Assignment failed');
      router.refresh();
    } catch {
      setError('Could not assign technician. Please try again.');
    } finally {
      setAssigning(null);
    }
  }

  return (
    <div className="section-container">
      <div className="section-header-row">
        <div>
          <h2 className="section-main-title">Support Tickets</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {filtered.length} of {scopedTickets.length} tickets shown &middot; {counts['pending'] ?? 0} pending assignment
          </span>
        </div>

        {/* Filters dropdowns for Technician & Customer (AD-29) */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={techFilter}
            onChange={e => setTechFilter(e.target.value)}
            className="filter-select"
            aria-label="Filter tickets by technician"
          >
            <option value="">All Technicians</option>
            {technicians.map(tech => {
              const name = tech.name ?? `${tech.firstName ?? ''} ${tech.lastName ?? ''}`.trim();
              return (
                <option key={tech.id} value={tech.id}>
                  Tech: {name}
                </option>
              );
            })}
          </select>

          {customers.length > 0 && (
            <select
              value={customerFilter}
              onChange={e => setCustomerFilter(e.target.value)}
              className="filter-select"
              aria-label="Filter tickets by customer"
            >
              <option value="">All Customers</option>
              {customers.map(c => {
                const name = c.name ?? (`${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || c.email);
                return (
                  <option key={c.id} value={c.id}>
                    {name}
                  </option>
                );
              })}
            </select>
          )}

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="sensor">Sensor Issues</option>
            <option value="valve">Valve Failures</option>
            <option value="leak">Pipe Leaks</option>
            <option value="billing">Billing Inquiry</option>
          </select>
        </div>
      </div>

      {/* Active Filter Banner if technician or customer is filtered */}
      {(selectedTech || selectedCust || priorityFilter !== 'all' || typeFilter !== 'all' || search) && (
        <div className="active-filter-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span>
            Active Filters:{' '}
            {selectedTech && <strong>Technician: {selectedTech.name ?? `${selectedTech.firstName ?? ''} ${selectedTech.lastName ?? ''}`.trim()} </strong>}
            {selectedCust && <strong>Customer: {selectedCust.name ?? selectedCust.email} </strong>}
            {priorityFilter !== 'all' && <strong>Priority: {priorityFilter.toUpperCase()} </strong>}
            {typeFilter !== 'all' && <strong>Type: {typeFilter.toUpperCase()} </strong>}
            {search && <strong>Search: &quot;{search}&quot; </strong>}
          </span>
          <button
            onClick={() => {
              setTechFilter('');
              setCustomerFilter('');
              setPriorityFilter('all');
              setTypeFilter('all');
              setSearch('');
            }}
            className="btn-clear-filter"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {error && <div className="form-error-alert">{error}</div>}

      {/* Lifecycle Status Filter Tabs */}
      <div className="tab-pill-group" style={{ marginBottom: 16 }}>
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            className={`tab-pill ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            <span style={{ textTransform: 'capitalize' }}>{s}</span>
            <span className="tab-count-bubble">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="search-bar-wrap" style={{ marginBottom: 16 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search by ticket ID, customer, technician, or issue description..."
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
              <th>Ticket ID</th>
              <th>Type</th>
              <th>Description</th>
              <th>Status</th>
              <th>Customer</th>
              <th>Technician</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                  No tickets found matching the selected filters.
                </td>
              </tr>
            )}
            {filtered.map(t => {
              const normStatus = normalizeStatus(t.status);
              const isPending = normStatus === 'pending';
              const assignedTech = technicians.find(tech => tech.id === t.technicianId);
              const techDisplayName = assignedTech
                ? (assignedTech.name ?? `${assignedTech.firstName ?? ''} ${assignedTech.lastName ?? ''}`.trim())
                : t.technicianName;

              const displayId = (t.id ?? '').replace(/-/g, '').slice(0, 8).toUpperCase();

              return (
                <tr key={t.id}>
                  <td>
                    <Link href={`/support-tickets/${t.id}`} className="table-link-mono">
                      #{displayId}
                    </Link>
                  </td>
                  <td>
                    <span className="type-pill">
                      {(t.type ?? t.issueType ?? 'General').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.description ?? t.issue ?? '—'}
                  </td>
                  <td>
                    <span className={STATUS_CLASS[normStatus] ?? 'status-badge status-muted'}>
                      {STATUS_LABELS[normStatus] ?? normStatus}
                    </span>
                  </td>
                  <td className="text-muted-sm">{t.customerName ?? 'Customer'}</td>
                  <td>
                    {isPending ? (
                      <span style={{ color: '#d97706', fontWeight: 600, fontSize: '0.82rem' }}>
                        Unassigned
                      </span>
                    ) : techDisplayName ? (
                      <span style={{ color: '#0f172a', fontWeight: 500 }}>{techDisplayName}</span>
                    ) : (
                      <span className="text-muted-sm">—</span>
                    )}
                  </td>
                  <td className="text-muted-sm" suppressHydrationWarning>
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Link href={`/support-tickets/${t.id}`} className="btn-table-action">
                        View
                      </Link>

                      {isPending && (
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <select
                            className="inline-assign-select"
                            value={assignTechId[t.id] ?? ''}
                            onChange={e => setAssignTechId({ ...assignTechId, [t.id]: e.target.value })}
                            aria-label="Select technician to assign"
                          >
                            <option value="">Select tech...</option>
                            {technicians.map(tech => (
                              <option key={tech.id} value={tech.id}>
                                {tech.name ?? `${tech.firstName ?? ''} ${tech.lastName ?? ''}`.trim()}
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn-assign-action"
                            onClick={() => handleAssign(t.id)}
                            disabled={assigning === t.id}
                          >
                            {assigning === t.id ? '...' : 'Assign'}
                          </button>
                        </div>
                      )}
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
