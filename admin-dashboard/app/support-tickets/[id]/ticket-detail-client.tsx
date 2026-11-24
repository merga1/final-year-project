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
  customer,
  technicians,
  devices = [],
  token,
}: {
  ticket: any;
  customer?: any;
  technicians: any[];
  devices?: any[];
  token: string;
}) {
  const router = useRouter();
  const rawStatus = (ticket.status ?? 'pending').toLowerCase().replace(/\s+/g, '_');
  const status = rawStatus === 'open' ? 'pending' : (rawStatus === 'accepted' ? 'in_progress' : rawStatus);

  const [selectedTech, setSelectedTech] = useState(status === 'pending' ? '' : (ticket.technicianId ?? ''));
  const [selectedMeter, setSelectedMeter] = useState(ticket.deviceId ?? ticket.meterId ?? '');
  const [reassignReason, setReassignReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isRegistrationTicket =
    ticket.type === 'New Customer Registration' ||
    (ticket.subject?.toLowerCase().includes('registration') && ticket.subject?.toLowerCase().includes('approval')) ||
    ticket.issue?.toLowerCase().includes('registration');

  const isMeterRequestTicket =
    ticket.type === 'Water Meter Request' ||
    ticket.issue?.toLowerCase().includes('water meter') ||
    ticket.subject?.toLowerCase().includes('water meter');

  const isAwaitingApproval = status === 'pending' || status === 'open';

  // Extract contact phone from customer or description
  const phoneMatch = ticket.description?.match(/Contact phone:\s*([^\n\r]+)/i);
  const contactPhone = customer?.phone ?? customer?.phoneNumber ?? phoneMatch?.[1]?.trim() ?? '—';

  // Extract installation address from ticket or customer
  const addressMatch = ticket.description?.match(/Installation address:\s*([^\n\r]+)/i);
  const installAddress = ticket.customerAddress ?? customer?.address ?? addressMatch?.[1]?.trim() ?? '—';

  // Extract additional details from description
  const detailsMatch = ticket.description?.match(/Additional details:\s*([^\n\r]+)/i);
  const extraDetails = detailsMatch?.[1]?.trim();

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

  async function closeRegistrationTicket() {
    if (!confirm('Close this legacy registration ticket? Customer accounts no longer require admin approval to sign in.')) return;
    await patchTicket({
      status: 'resolved',
      notes: 'Registration ticket closed — accounts are active after self-registration',
    });
  }

  async function assignMeterFromRequest() {
    if (!selectedMeter) {
      setError('Please select or enter a water meter device ID to assign.');
      return;
    }
    if (!confirm(`Assign water meter ${selectedMeter} to this customer?`)) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'https://backend-five-liart-75.vercel.app').replace(String.fromCharCode(0xFEFF), '').trim();
      const t = getCookie('sw_token') || token;
      if (ticket.customerId) {
        const res = await fetch(`${API}/api/admin/customers/${ticket.customerId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ meterId: selectedMeter, accountStatus: 'active' }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.message || 'Failed to link meter to customer');
        }
      }
      await patchTicket({
        status: 'resolved',
        deviceId: selectedMeter,
        notes: `Water meter ${selectedMeter} assigned`,
      });
      setSuccess(`Water meter ${selectedMeter} assigned to the customer.`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to assign water meter');
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
        {/* Left column: request details & ticket metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Prominent card for Water Meter Request or Registration */}
          {(isMeterRequestTicket || isRegistrationTicket) && (
            <div className="detail-card" style={{ borderTop: '4px solid #0284c7' }}>
              <div className="detail-card-header">
                <h3 className="detail-card-subtitle" style={{ fontSize: '1.05rem', color: '#0369a1', margin: 0 }}>
                  {isMeterRequestTicket ? '🚰 Water Meter Installation Request' : '👤 Customer Account Registration'}
                </h3>
                <span className={`status-badge ${customer?.accountStatus === 'suspended' ? 'status-warn' : 'status-ok'}`}>
                  Account: {(customer?.accountStatus || 'active').toUpperCase()}
                </span>
              </div>

              <dl className="detail-fields" style={{ marginTop: 14 }}>
                <div className="detail-field-row">
                  <dt>Customer Name</dt>
                  <dd style={{ fontWeight: 600 }}>{ticket.customerName ?? customer?.name ?? '—'}</dd>
                </div>
                <div className="detail-field-row">
                  <dt>Email Address</dt>
                  <dd>
                    {customer?.email ? (
                      <a href={`mailto:${customer.email}`} style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                        {customer.email}
                      </a>
                    ) : '—'}
                  </dd>
                </div>
                <div className="detail-field-row">
                  <dt>Contact Phone</dt>
                  <dd style={{ fontWeight: 600, color: '#0f172a' }}>{contactPhone}</dd>
                </div>
                <div className="detail-field-row">
                  <dt>Installation Address</dt>
                  <dd style={{ fontWeight: 600, color: '#0f172a' }}>{installAddress}</dd>
                </div>
                <div className="detail-field-row">
                  <dt>Zone / Area</dt>
                  <dd>{customer?.zone ?? 'Zone A'}</dd>
                </div>
                <div className="detail-field-row">
                  <dt>Customer Profile</dt>
                  <dd>
                    {ticket.customerId ? (
                      <Link href={`/customers/${ticket.customerId}`} style={{ color: '#1e6b52', fontWeight: 600, textDecoration: 'none' }}>
                        View Customer Record →
                      </Link>
                    ) : '—'}
                  </dd>
                </div>
                <div className="detail-field-row">
                  <dt>Assigned Meter</dt>
                  <dd>
                    {(ticket.deviceId ?? customer?.meterId) ? (
                      <span className="type-pill" style={{ background: '#ecfdf5', color: '#065f46', fontWeight: 700 }}>
                        {ticket.deviceId ?? customer?.meterId}
                      </span>
                    ) : (
                      <span style={{ color: '#d97706', fontWeight: 600 }}>Not assigned yet</span>
                    )}
                  </dd>
                </div>
              </dl>

              {extraDetails && (
                <div style={{ marginTop: 14, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4, letterSpacing: '0.04em' }}>
                    CUSTOMER REQUEST NOTES
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#1e293b' }}>{extraDetails}</div>
                </div>
              )}
            </div>
          )}

          {/* Core Ticket Information Card */}
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
                Full Description
              </h3>
              <p style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: '0.9rem', color: '#1e293b', margin: 0, border: '1px solid #e2e8f0', whiteSpace: 'pre-line' }}>
                {ticket.description ?? ticket.issue ?? 'No description provided.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right column: actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Water Meter Request — assign device (account is already active after registration) */}
          {isMeterRequestTicket && isAwaitingApproval && (
            <div className="detail-card" style={{ borderLeft: '4px solid #0284c7', background: '#f0f9ff' }}>
              <h3 className="detail-card-subtitle" style={{ color: '#0369a1' }}>
                Assign Water Meter
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#334155', margin: '8px 0 14px', lineHeight: 1.5 }}>
                Assign an available smart water meter to <strong>{ticket.customerName}</strong> for installation at <strong>{installAddress}</strong>.
                The customer can already sign in; linking a meter unlocks usage, billing, and live readings.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 6 }}>
                    Select Water Meter Device to Assign:
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', background: '#fff' }}
                    value={selectedMeter}
                    onChange={e => setSelectedMeter(e.target.value)}
                  >
                    <option value="">Choose an available device...</option>
                    {devices.map(d => {
                      const id = d.meterId ?? d.id;
                      const isInUse = Boolean(d.customerId && d.customerId !== ticket.customerId);
                      return (
                        <option key={id} value={id}>
                          {id} {isInUse ? '(In Use)' : '✓ (Available)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn-primary-blue"
                  style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 700, background: '#0284c7', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                  disabled={loading || !selectedMeter}
                  onClick={assignMeterFromRequest}
                >
                  {loading ? 'Assigning...' : 'Assign Meter & Resolve Request'}
                </button>
              </div>
            </div>
          )}

          {/* Legacy registration tickets — close only (no account approval gate) */}
          {isRegistrationTicket && isAwaitingApproval && (
            <div className="detail-card" style={{ borderLeft: '4px solid #64748b', background: '#f8fafc' }}>
              <h3 className="detail-card-subtitle" style={{ color: '#334155' }}>
                Legacy Registration Ticket
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', margin: '8px 0 14px', lineHeight: 1.5 }}>
                Customer accounts are active immediately after registration. Close this legacy ticket if it is no longer needed.
              </p>
              <button
                type="button"
                className="btn-success-sm"
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 700, background: '#475569', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                disabled={loading}
                onClick={closeRegistrationTicket}
              >
                {loading ? 'Closing...' : 'Close Ticket'}
              </button>
            </div>
          )}

          {(isMeterRequestTicket || isRegistrationTicket) && !isAwaitingApproval && (
            <div className="detail-card" style={{ borderLeft: '4px solid #16a34a', background: '#f0fdf4' }}>
              <h3 className="detail-card-subtitle" style={{ color: '#15803d' }}>
                Request Resolved
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#166534', margin: '8px 0 0' }}>
                This ticket is resolved. Meter-linked customers see full dashboard features in the mobile app.
              </p>
            </div>
          )}

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
