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
  const rawStatus = (ticket.status ?? 'pending').toLowerCase();
  const status = rawStatus === 'open' ? 'pending' : rawStatus;

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
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const t = getCookie('sw_token') || token;
      const res = await fetch(`${API}/api/admin/support-tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Action failed');
      setSuccess('Action completed successfully.');
      router.refresh();
    } catch {
      setError('Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canAssign = status === 'pending';
  const canReassign = status === 'assigned' || status === 'accepted';
  const canClose = status === 'resolved';
  const canReopen = status === 'closed';

  const assignedTech = technicians.find(t => t.id === ticket.technicianId);
  const assignedTechName = assignedTech
    ? (assignedTech.name ?? `${assignedTech.firstName ?? ''} ${assignedTech.lastName ?? ''}`.trim())
    : ticket.technicianName;

  return (
    <div className="section-container">
      <Link href="/support-tickets" className="back-link">Back to Tickets</Link>

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
              <dd>{ticket.customerName ?? ticket.customerId ?? '—'}</dd>
            </div>
            <div className="detail-field-row">
              <dt>Device ID</dt>
              <dd>{ticket.meterId ?? ticket.deviceId ? <code className="mono-text">{ticket.meterId ?? ticket.deviceId}</code> : '—'}</dd>
            </div>
            <div className="detail-field-row">
              <dt>Created</dt>
              <dd className="text-muted-sm" suppressHydrationWarning>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '—'}</dd>
            </div>
            <div className="detail-field-row">
              <dt>Updated</dt>
              <dd className="text-muted-sm" suppressHydrationWarning>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '—'}</dd>
            </div>
          </dl>

          <div style={{ marginTop: 20 }}>
            <p className="detail-label">Description</p>
            <p className="detail-desc">{ticket.description ?? ticket.issue ?? 'No description provided.'}</p>
          </div>

          {ticket.resolutionNotes && (
            <div style={{ marginTop: 16 }}>
              <p className="detail-label">Resolution Notes</p>
              <p className="detail-desc">{ticket.resolutionNotes}</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="detail-card">
            <h3 className="detail-card-subtitle">Assigned Technician</h3>
            {canAssign ? (
              <p style={{ color: '#d97706', fontSize: '0.9rem', fontWeight: 600 }}>
                Unassigned (Waiting for dispatch)
              </p>
            ) : assignedTechName ? (
              <p style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>
                {assignedTechName}
              </p>
            ) : (status === 'resolved' || status === 'closed') ? (
              <p style={{ color: '#64748b', fontSize: '0.88rem', fontStyle: 'italic' }}>
                System (Automated Diagnostic Check)
              </p>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>No technician assigned yet</p>
            )}
          </div>

          {(canAssign || canReassign) && (
            <div className="detail-card">
              <h3 className="detail-card-subtitle">{canAssign ? 'Assign Technician' : 'Reassign Technician'}</h3>
              <div className="form-field-group" style={{ marginBottom: 12 }}>
                <label>Select Technician</label>
                <select className="form-select" value={selectedTech} onChange={e => setSelectedTech(e.target.value)}>
                  <option value="">Choose a technician...</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name ?? `${tech.firstName} ${tech.lastName}`}
                      {tech.openTickets != null ? ` (${tech.openTickets} open)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {canReassign && (
                <div className="form-field-group" style={{ marginBottom: 12 }}>
                  <label>Reason (optional)</label>
                  <input type="text" className="form-input" placeholder="Reason for reassignment" value={reassignReason} onChange={e => setReassignReason(e.target.value)} />
                </div>
              )}
              <button
                className="btn-primary-blue"
                style={{ width: '100%' }}
                disabled={loading || !selectedTech}
                onClick={() => patchTicket({ technicianId: selectedTech, status: 'assigned', ...(reassignReason ? { reason: reassignReason } : {}) })}
              >
                {loading ? 'Saving...' : canAssign ? 'Assign' : 'Reassign'}
              </button>
            </div>
          )}

          {(canClose || canReopen) && (
            <div className="detail-card">
              <h3 className="detail-card-subtitle">{canClose ? 'Close Ticket' : 'Reopen Ticket'}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 12 }}>
                {canClose ? 'Mark as closed after confirming work is complete.' : 'Reopen for further work.'}
              </p>
              <button
                className={canClose ? 'btn-primary-blue' : 'btn-outline-gray'}
                style={{ width: '100%' }}
                disabled={loading}
                onClick={() => patchTicket({ status: canClose ? 'closed' : 'pending' })}
              >
                {loading ? 'Saving...' : canClose ? 'Close Ticket' : 'Reopen Ticket'}
              </button>
            </div>
          )}

          {ticket.statusHistory && ticket.statusHistory.length > 0 && (
            <div className="detail-card">
              <h3 className="detail-card-subtitle">Status History</h3>
              <div className="status-history-list">
                {ticket.statusHistory.map((h: any, i: number) => (
                  <div key={i} className="status-history-item">
                    <span className={STATUS_CLASS[(h.status ?? '').toLowerCase()] ?? 'status-badge status-muted'}>
                      {STATUS_LABELS[(h.status ?? '').toLowerCase()] ?? h.status}
                    </span>
                    <span className="text-muted-sm">{h.changedAt ? new Date(h.changedAt).toLocaleString() : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
