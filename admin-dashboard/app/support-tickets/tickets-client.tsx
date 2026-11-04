'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pagination } from '../../components/pagination';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  open: 'Pending',
  assigned: 'Assigned',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'status-badge status-warn',
  open: 'status-badge status-warn',
  assigned: 'status-badge status-info',
  accepted: 'status-badge status-info',
  in_progress: 'status-badge status-ok',
  resolved: 'status-badge status-ok',
  closed: 'status-badge status-muted',
};

function PriorityBadge({ priority }: { priority: string }) {
  const p = (priority ?? 'medium').toLowerCase();
  if (p === 'critical') {
    return (
      <span className="status-badge status-danger" style={{ fontWeight: 700 }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#dc2626', marginRight: 5 }} />
        Critical
      </span>
    );
  }
  if (p === 'high') {
    return (
      <span className="status-badge" style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', fontWeight: 600 }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ea580c', marginRight: 5 }} />
        High
      </span>
    );
  }
  if (p === 'medium') {
    return (
      <span className="status-badge status-warn" style={{ fontWeight: 600 }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#d97706', marginRight: 5 }} />
        Medium
      </span>
    );
  }
  return (
    <span className="status-badge status-muted" style={{ fontWeight: 600 }}>
      {p.charAt(0).toUpperCase() + p.slice(1)}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const norm = (type ?? 'General').toLowerCase().replace(/_/g, ' ');
  const formatted = norm.charAt(0).toUpperCase() + norm.slice(1);
  return (
    <span className="type-pill" style={{ fontWeight: 600, fontSize: '0.75rem' }}>
      {formatted}
    </span>
  );
}

function formatTicketDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

const ALL_STATUSES = ['all', 'pending', 'assigned', 'in_progress', 'accepted', 'resolved', 'closed'];

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignTechId, setAssignTechId] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const normalizeStatus = (s: string) => {
    const lower = (s ?? 'pending').toLowerCase().replace(/\s+/g, '_');
    return lower === 'open' ? 'pending' : lower;
  };

  // Base tickets filtered by technician and/or customer
  const scopedTickets = tickets.filter(t => {
    const rawStatus = normalizeStatus(t.status);
    const isPending = rawStatus === 'pending';

    if (techFilter) {
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
  for (const s of ['pending', 'assigned', 'in_progress', 'accepted', 'resolved', 'closed']) {
    counts[s] = scopedTickets.filter(t => normalizeStatus(t.status) === s).length;
  }

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleStatusFilter(s: string) {
    setStatusFilter(s);
    setPage(1);
  }

  function handleTechFilter(t: string) {
    setTechFilter(t);
    setPage(1);
  }

  function handleCustomerFilter(c: string) {
    setCustomerFilter(c);
    setPage(1);
  }

  function handlePriorityFilter(p: string) {
    setPriorityFilter(p);
    setPage(1);
  }

  function handleTypeFilter(t: string) {
    setTypeFilter(t);
    setPage(1);
  }

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
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
      </div>

      {/* 4 AquaSense Stat Chips */}
      <div className="stats-strip">
        <div
          className={`stat-chip stat-chip-blue ${statusFilter === 'all' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => handleStatusFilter('all')}
          title="View all tickets"
        >
          <span className="stat-chip-val">{scopedTickets.length}</span>
          <span className="stat-chip-label">Total Tickets</span>
        </div>
        <div
          className={`stat-chip stat-chip-green ${statusFilter === 'in_progress' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => handleStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
          title="Filter In Progress tickets"
        >
          <span className="stat-chip-val">{counts['in_progress'] ?? 0}</span>
          <span className="stat-chip-label">In Progress</span>
        </div>
        <div
          className={`stat-chip stat-chip-amber ${statusFilter === 'assigned' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => handleStatusFilter(statusFilter === 'assigned' ? 'all' : 'assigned')}
          title="Filter Assigned tickets"
        >
          <span className="stat-chip-val">{counts['assigned'] ?? 0}</span>
          <span className="stat-chip-label">Assigned</span>
        </div>
        <div
          className={`stat-chip stat-chip-red ${statusFilter === 'pending' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => handleStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          title="Filter Pending tickets"
        >
          <span className="stat-chip-val">{counts['pending'] ?? 0}</span>
          <span className="stat-chip-label">Pending</span>
        </div>
      </div>

      {/* Scope banner when filtering by tech or customer */}
      {(selectedTech || selectedCust) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
          padding: '8px 16px', marginBottom: 16, fontSize: '0.88rem', color: '#1e40af',
        }}>
          <span>
            Filtering by: {selectedTech && <strong>Tech: {selectedTech.name ?? selectedTech.email}</strong>}
            {selectedTech && selectedCust && ' & '}
            {selectedCust && <strong>Customer: {selectedCust.name ?? selectedCust.email}</strong>}
          </span>
          <button
            onClick={() => { setTechFilter(''); setCustomerFilter(''); setPage(1); }}
            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
          >
            Clear Filter ×
          </button>
        </div>
      )}

      {error && <div className="form-error-alert">{error}</div>}

      {/* Standardized Table Toolbar (Filters & Search) */}
      <div className="table-toolbar-row">
        <div className="table-toolbar-left">
          {/* Status Filter Tabs */}
          <div className="filter-tabs">
            {ALL_STATUSES.map(s => {
              const count = counts[s] ?? 0;
              const label = s === 'all' ? 'All' : (STATUS_LABELS[s] ?? s);
              return (
                <button
                  key={s}
                  type="button"
                  className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
                  onClick={() => handleStatusFilter(s)}
                >
                  {label}
                  <span className="filter-tab-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Technician Dropdown */}
          <select
            value={techFilter}
            onChange={e => handleTechFilter(e.target.value)}
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

          {/* Customer Dropdown */}
          {customers.length > 0 && (
            <select
              value={customerFilter}
              onChange={e => handleCustomerFilter(e.target.value)}
              className="filter-select"
              aria-label="Filter tickets by customer"
            >
              <option value="">All Customers</option>
              {customers.map(c => {
                const fullName = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
                const name = c.name || fullName || c.email;
                return (
                  <option key={c.id} value={c.id}>
                    Customer: {name}
                  </option>
                );
              })}
            </select>
          )}

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={e => handlePriorityFilter(e.target.value)}
            className="filter-select"
            aria-label="Filter tickets by priority"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Type Dropdown */}
          <select
            value={typeFilter}
            onChange={e => handleTypeFilter(e.target.value)}
            className="filter-select"
            aria-label="Filter tickets by type"
          >
            <option value="all">All Types</option>
            <option value="sensor">Sensor / Meter</option>
            <option value="leak">Leak</option>
            <option value="valve">Valve</option>
            <option value="billing">Billing</option>
          </select>

          {(statusFilter !== 'all' || techFilter || customerFilter || priorityFilter !== 'all' || typeFilter !== 'all' || search) && (
            <button
              type="button"
              className="filter-clear-btn"
              onClick={() => {
                setStatusFilter('all');
                setTechFilter('');
                setCustomerFilter('');
                setPriorityFilter('all');
                setTypeFilter('all');
                setSearch('');
                setPage(1);
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Search */}
        <div className="table-toolbar-right">
          <div className="search-bar-wrap" style={{ width: '100%' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search tickets..."
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
              <th>Ticket ID</th>
              <th>Priority</th>
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
                <td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                  No tickets found matching the selected filters.
                </td>
              </tr>
            )}
            {paginated.map(t => {
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
                    <Link href={`/support-tickets/${t.id}`} className="table-link-mono" title={`View ticket #${displayId}`}>
                      #{displayId}
                    </Link>
                  </td>
                  <td>
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td>
                    <TypeBadge type={t.type ?? t.issueType ?? 'General'} />
                  </td>
                  <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span title={t.description ?? t.issue}>
                      {t.description ?? t.issue ?? '—'}
                    </span>
                  </td>
                  <td>
                    <span className={STATUS_CLASS[normStatus] ?? 'status-badge status-muted'}>
                      {STATUS_LABELS[normStatus] ?? normStatus}
                    </span>
                  </td>
                  <td>
                    {t.customerId ? (
                      <Link
                        href={`/customers/${t.customerId}`}
                        style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                        title="View customer profile"
                      >
                        {t.customerName ?? 'Customer'}
                      </Link>
                    ) : (
                      <span className="text-muted-sm">{t.customerName ?? 'Customer'}</span>
                    )}
                  </td>
                  <td>
                    {isPending ? (
                      <span style={{ color: '#d97706', fontWeight: 600, fontSize: '0.82rem' }}>
                        Unassigned
                      </span>
                    ) : techDisplayName ? (
                      <span style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.86rem' }}>
                        {techDisplayName}
                      </span>
                    ) : (
                      <span className="text-muted-sm">—</span>
                    )}
                  </td>
                  <td className="text-muted-sm" suppressHydrationWarning>
                    {formatTicketDate(t.createdAt)}
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
                            type="button"
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

        <Pagination
          totalItems={filtered.length}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="support tickets"
        />
      </div>
    </div>
  );
}
