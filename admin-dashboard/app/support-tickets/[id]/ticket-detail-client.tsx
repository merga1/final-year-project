'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Awaiting Admin',
  open: 'Awaiting Admin',
  assigned: 'Assigned',
  accepted: 'In Progress',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'status-badge status-warn',
  open: 'status-badge status-warn',
  assigned: 'status-badge status-info',
  accepted: 'status-badge status-ok',
  in_progress: 'status-badge status-ok',
  resolved: 'status-badge status-ok',
  closed: 'status-badge status-muted',
};

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}

export function TicketDetailClient({
  ticket,
  technicians,
  token,
}: {
  ticket: any;
  technicians: any[];
  token: string;
}) {
  const router = useRouter();
  const rawStatus = (ticket.status ?? 'pending').toLowerCase().replace(/\s+/g, '_');
  const status = rawStatus === 'open' ? 'pending' : (rawStatus === 'accepted' ? 'in_progress' : rawStatus);

  const [selectedTech, setSelectedTech] = useState(status === 'pending' ? '' : (ticket.technicianId ?? ''));
  const [reassignReason, setReassignReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function patchTicket(data: any) {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'https://backend-five-liart-75.vercel.app').replace(String.fromCharCode(0xFEFF), '').trim();
      const t = getCookie('sw_token') || token;
      const res = await fetch(`${API}/api/admin/support-tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Action failed');
      }
      setSuccess('Action completed successfully.');
      setReassignReason('');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canAssign = status === 'pending';
  const canReassign = status === 'assigned' || status === 'in_progress';
  const canClose = status === 'resolved';
  const canReopen = status === 'closed';

  const assignedTech = technicians.find(t => t.id === ticket.technicianId);
  const assignedTechName = assignedTech
    ? (assignedTech.name ?? `${assignedTech.firstName ?? ''} ${assignedTech.lastName ?? ''}`.trim())
    : ticket.technicianName;

  return (
    <div className="section-container">
      <Link href="/support-tickets" className="back-link">← Back to Tickets</Link>

      {error && <div className="form-error-alert">{error}</div>}
      {success && <div className="form-success-alert">{success}</div>}

      <div className="detail-two-col">
        <div className="detail-card">
          <div className="detail-card-header">
            <h2 className="detail-card-title">
              Ticket #{(ticket.id ?? '').replace(/-/g, '').slice(0, 8).toUpperCase()}
            </h2>
            <span className={STATUS_CLASS[status] ?? 'status-badge status-muted'}>
              {STATUS_LABELS[status] ?? status}
            </span>
          </div>

          <dl className="detail-fields">
            <div className="detail-field-row">
              <dt>Type</dt>
              <dd><span className="type-pill">{ticket.type ?? ticket.issueType ?? 'General'}</span></dd>
            </div>
            <div className="detail-field-row">
              <dt>Customer</dt>
              <dd>
                {ticket.customerId ? (
                  <Link
                    href={`/customers/${ticket.customerId}`}
                    style={{ color: '#1e6b52', fontWeight: 600, textDecoration: 'none' }}
                  >
                    {ticket.customerName ?? ticket.customerId}
                  </Link>
                ) : (
                  <span>{ticket.customerName ?? '—'}</span>
                )}
              </dd>
            </div>
            <div className="detail-field-row">
              <dt>Device ID</dt>
              <dd>
                {ticket.meterId ?? ticket.deviceId ? (
                  <Link href={`/devices/${ticket.meterId ?? ticket.deviceId}`} className="table-link-mono">
                    {ticket.meterId ?? ticket.deviceId}
                  </Link>
                ) : '—'}
              </dd>
            </div>
            <div className="detail-field-row">
              <dt>Created</dt>
              <dd className="text-muted-sm" suppressHydrationWarning>
                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '—'}
              </dd>
            </div>
            <div className="detail-field-row">
              <dt>Updated</dt>
              <dd className="text-muted-sm" suppressHydrationWarning>
                {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '—'}
              </dd>
            </div>
            <div className="detail-field-row">
              <dt>Assigned Technician</dt>
              <dd style={{ fontWeight: 600, color: assignedTechName ? '#0f172a' : '#d97706' }}>
                {assignedTechName ?? 'Unassigned'}
              </dd>
            </div>
          </dl>

          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Issue Description
            </h3>
            <p style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: '0.9rem', color: '#1e293b', margin: 0, border: '1px solid #e2e8f0' }}>
              {ticket.description ?? ticket.issue ?? 'No description provided.'}
            </p>
          </div>
        </div>

        {/* Right column: actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Assign / Reassign Card */}
          {(canAssign || canReassign) && (
            <div className="detail-card">
              <h3 className="detail-card-subtitle">
                {canAssign ? 'Assign Technician' : 'Reassign Technician'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Select Technician:
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={selectedTech}
                    onChange={e => setSelectedTech(e.target.value)}
                  >
                    <option value="">Choose a technician...</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name ?? `${tech.firstName ?? ''} ${tech.lastName ?? ''}`.trim()} &middot; {tech.specialization ?? 'General'} ({tech.status === 'on_duty' ? 'On Duty' : 'Off Duty'})
                      </option>
                    ))}
                  </select>
                </div>

                {canReassign && (
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Reassignment Reason (optional):
                    </label>
                    <input
                      type="text"
                      className="search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      placeholder="e.g. Technician unavailable, specialization mismatch"
                      value={reassignReason}
                      onChange={e => setReassignReason(e.target.value)}
                    />
                  </div>
                )}

                <button
                  type="button"
                  className="btn-primary-blue"
                  disabled={loading || !selectedTech}
                  onClick={() => patchTicket({
                    technicianId: selectedTech,
                    status: 'assigned',
                    ...(reassignReason ? { notes: reassignReason, reassignReason } : {}),
                  })}
                >
                  {loading ? 'Updating...' : canAssign ? 'Assign Ticket' : 'Reassign Ticket'}
                </button>
              </div>
            </div>
          )}

          {/* Close Ticket Card */}
          {canClose && (
            <div className="detail-card">
              <h3 className="detail-card-subtitle">Close Ticket</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '8px 0 16px' }}>
                This ticket has been marked resolved by the technician. Confirm closure to archive it.
              </p>
              <button
                type="button"
                className="btn-success-sm"
                style={{ width: '100%', padding: '10px' }}
                disabled={loading}
                onClick={() => patchTicket({ status: 'closed' })}
              >
                {loading ? 'Closing...' : 'Confirm & Close Ticket'}
              </button>
            </div>
          )}

          {/* Reopen Ticket Card */}
          {canReopen && (
            <div className="detail-card">
              <h3 className="detail-card-subtitle">Reopen Ticket</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '8px 0 16px' }}>
                If the customer reports the issue has recurred, you can reopen this ticket.
              </p>
              <button
                type="button"
                className="btn-outline-gray"
                style={{ width: '100%', padding: '10px' }}
                disabled={loading}
                onClick={() => patchTicket({ status: 'pending' })}
              >
                {loading ? 'Reopening...' : 'Reopen Ticket'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
