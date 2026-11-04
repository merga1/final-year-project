'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pagination } from '../../components/pagination';

function formatAlertType(type: string) {
  const norm = (type ?? '').toLowerCase().replace(/_/g, ' ');
  if (norm.includes('turbid') || norm.includes('quality')) {
    return {
      label: 'High Turbidity',
      category: 'water_quality',
      color: '#7c3aed',
      bg: '#f5f3ff',
      border: '#ddd6fe',
    };
  }
  if (norm.includes('leak')) {
    return {
      label: 'Leak Detected',
      category: 'leak',
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
    };
  }
  if (norm.includes('offline')) {
    return {
      label: 'Device Offline',
      category: 'offline',
      color: '#475569',
      bg: '#f1f5f9',
      border: '#cbd5e1',
    };
  }
  if (norm.includes('battery')) {
    return {
      label: 'Low Battery',
      category: 'battery',
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
    };
  }
  if (norm.includes('flow') || norm.includes('usage')) {
    return {
      label: 'High Flow',
      category: 'high_flow',
      color: '#ea580c',
      bg: '#fff7ed',
      border: '#fed7aa',
    };
  }
  if (norm.includes('tamper')) {
    return {
      label: 'Tamper Detected',
      category: 'tamper',
      color: '#b91c1c',
      bg: '#fef2f2',
      border: '#fecaca',
    };
  }
  const formatted = norm
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    label: formatted || 'Anomaly',
    category: 'other',
    color: '#1e6b52',
    bg: '#f0fdf9',
    border: '#a7f3d0',
  };
}

function SeverityBadge({ severity }: { severity: string }) {
  const s = (severity ?? 'warning').toLowerCase();
  if (s === 'critical') {
    return (
      <span className="status-badge status-danger" style={{ fontWeight: 700, letterSpacing: '0.01em' }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#dc2626', marginRight: 5 }} />
        Critical
      </span>
    );
  }
  if (s === 'high') {
    return (
      <span className="status-badge" style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', fontWeight: 600 }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ea580c', marginRight: 5 }} />
        High
      </span>
    );
  }
  if (s === 'medium') {
    return (
      <span className="status-badge status-warn" style={{ fontWeight: 600 }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#d97706', marginRight: 5 }} />
        Medium
      </span>
    );
  }
  return (
    <span className="status-badge status-muted" style={{ fontWeight: 600 }}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

function StatusBadge({ acknowledged }: { acknowledged: boolean }) {
  return acknowledged ? (
    <span className="status-badge status-ok" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      Acknowledged
    </span>
  ) : (
    <span className="status-badge status-warn" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#d97706' }} />
      Unacknowledged
    </span>
  );
}

function formatLastSeen(dateStr?: string | null) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
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

export function AlertsClient({
  alerts,
  technicians = [],
  customers = [],
  token,
}: {
  alerts: any[];
  technicians?: any[];
  customers?: any[];
  token: string;
}) {
  const router = useRouter();
  const [localAlerts, setLocalAlerts] = useState<any[]>(alerts);
  const [ackingId, setAckingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [ackFilter, setAckFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dispatch Ticket Modal State
  const [dispatchModalAlert, setDispatchModalAlert] = useState<any | null>(null);
  const [dispatchSubmitting, setDispatchSubmitting] = useState(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState('');
  const [dispatchError, setDispatchError] = useState('');

  // Modal Form Inputs
  const [ticketType, setTicketType] = useState('SENSOR');
  const [ticketPriority, setTicketPriority] = useState('High');
  const [ticketIssue, setTicketIssue] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [selectedTechId, setSelectedTechId] = useState('');
  const [autoAcknowledgeAlert, setAutoAcknowledgeAlert] = useState(true);

  const unack = localAlerts.filter(a => !a.acknowledged).length;
  const ackCount = localAlerts.filter(a => a.acknowledged).length;
  const critical = localAlerts.filter(a => (a.severity ?? '').toLowerCase() === 'critical' && !a.acknowledged).length;

  const filtered = localAlerts.filter(a => {
    const isAck = !!a.acknowledged;
    if (ackFilter === 'unack' && isAck) return false;
    if (ackFilter === 'ack' && !isAck) return false;

    const sev = (a.severity ?? 'warning').toLowerCase();
    if (severityFilter !== 'all' && sev !== severityFilter) return false;

    const t = (a.type ?? a.alertType ?? '').toLowerCase();
    if (typeFilter !== 'all') {
      if (typeFilter === 'water_quality' && !t.includes('turbid') && !t.includes('quality')) return false;
      if (typeFilter === 'high_flow' && !t.includes('flow') && !t.includes('usage')) return false;
      if (typeFilter === 'leak' && !t.includes('leak')) return false;
      if (typeFilter === 'battery' && !t.includes('battery')) return false;
      if (typeFilter === 'offline' && !t.includes('offline')) return false;
    }

    if (!search) return true;
    const q = search.toLowerCase();
    const meterId = (a.meterId ?? a.deviceId ?? '').toLowerCase();
    const msg = (a.message ?? '').toLowerCase();
    const zone = (a.zone ?? '').toLowerCase();
    return meterId.includes(q) || msg.includes(q) || zone.includes(q) || t.includes(q);
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleAckFilter(a: string) {
    setAckFilter(a);
    setPage(1);
  }

  function handleSeverityFilter(s: string) {
    setSeverityFilter(s);
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

  async function handleAcknowledge(id: string) {
    setAckingId(id);
    setError('');
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(String.fromCharCode(0xFEFF), '').trim();
      const t = getCookie('sw_token') || token;
      const res = await fetch(`${API}/api/admin/alerts/${id}/acknowledge`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to acknowledge');
      setLocalAlerts(prev => prev.map(a => (a.id === id ? { ...a, acknowledged: true } : a)));
      router.refresh();
    } catch {
      setError('Could not acknowledge alert. Please try again.');
    } finally {
      setAckingId(null);
    }
  }

  function openDispatchModal(a: any) {
    setDispatchModalAlert(a);
    setDispatchError('');
    setDispatchSuccessMsg('');

    const typ = (a.type ?? '').toLowerCase();
    let defaultType = 'SENSOR';
    if (typ.includes('leak')) defaultType = 'LEAK';
    else if (typ.includes('valve')) defaultType = 'VALVE';
    else if (typ.includes('battery')) defaultType = 'MAINTENANCE';

    const sev = (a.severity ?? '').toLowerCase();
    let defaultPri = 'Medium';
    if (sev === 'critical') defaultPri = 'High';
    else if (sev === 'info') defaultPri = 'Low';

    const meter = a.meterId ?? a.deviceId ?? 'Hardware Node';
    setTicketType(defaultType);
    setTicketPriority(defaultPri);
    setTicketIssue(`[Alert] ${a.message || 'System Anomaly'}`);
    setTicketDescription(
      `Triggered from Alert (${a.type || 'Telemetry Anomaly'})\n` +
      `Target Meter Node: ${meter}\n` +
      `Operational Zone: ${a.zone ?? 'General Zone'}\n` +
      `Severity: ${a.severity ? a.severity.toUpperCase() : 'WARNING'}\n` +
      `Message: ${a.message || 'Sensor threshold exceeded. Field intervention required.'}`
    );

    // Pick first on-duty technician or first tech available
    const onDuty = (technicians || []).find((tech: any) => tech.status === 'on_duty');
    setSelectedTechId(onDuty ? onDuty.id : (technicians[0]?.id || ''));
    setAutoAcknowledgeAlert(!a.acknowledged);
  }

  async function handleDispatchTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!dispatchModalAlert) return;
    setDispatchSubmitting(true);
    setDispatchError('');

    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(String.fromCharCode(0xFEFF), '').trim();
      const t = getCookie('sw_token') || token;

      const tech = (technicians || []).find((techItem: any) => techItem.id === selectedTechId);
      const custId = dispatchModalAlert.customerId || customers[0]?.id || 'admin-escalated';
      const custName = dispatchModalAlert.customerName || (customers.find((c: any) => c.id === custId)?.name) || 'Customer';

      const payload = {
        customerId: custId,
        customerName: custName,
        deviceId: dispatchModalAlert.meterId ?? dispatchModalAlert.deviceId,
        type: ticketType,
        issue: ticketIssue,
        subject: ticketIssue,
        description: ticketDescription,
        priority: ticketPriority,
        technicianId: selectedTechId || null,
        technicianName: tech ? tech.name : null,
        status: selectedTechId ? 'assigned' : 'pending',
      };

      const res = await fetch(`${API}/api/admin/support-tickets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${t}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create support ticket');
      }

      const newTicket = await res.json();

      // If auto-acknowledge is checked, acknowledge the alert
      if (autoAcknowledgeAlert && !dispatchModalAlert.acknowledged) {
        await fetch(`${API}/api/admin/alerts/${dispatchModalAlert.id}/acknowledge`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        }).catch(() => {});
      }

      // Update local state to link ticket and update alert status
      setLocalAlerts(prev => prev.map(item => {
        if (item.id === dispatchModalAlert.id) {
          return {
            ...item,
            acknowledged: autoAcknowledgeAlert ? true : item.acknowledged,
            linkedTicket: {
              id: newTicket.id,
              status: newTicket.status,
              technicianName: newTicket.technicianName,
            },
          };
        }
        return item;
      }));

      setDispatchSuccessMsg(
        `Support Ticket #${newTicket.id.slice(0, 8)} created successfully${tech ? ` and assigned to ${tech.name}` : ''}!`
      );
      setDispatchModalAlert(null);
      router.refresh();
    } catch (err: any) {
      setDispatchError(err.message || 'Could not dispatch ticket. Please try again.');
    } finally {
      setDispatchSubmitting(false);
    }
  }

  return (
    <div className="section-container">
      <div className="section-header-row">
        <div>
          <h2 className="section-main-title">Alerts</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {filtered.length} of {localAlerts.length} alerts shown &middot; {unack} unacknowledged
          </span>
        </div>
      </div>

      {dispatchSuccessMsg && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '10px 16px',
          borderRadius: 8,
          fontSize: '0.86rem',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>✓ {dispatchSuccessMsg}</span>
          <button
            type="button"
            onClick={() => setDispatchSuccessMsg('')}
            style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* 4 Stats Chips */}
      <div className="stats-strip">
        <div
          className={`stat-chip stat-chip-red ${severityFilter === 'critical' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            handleSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical');
            setAckFilter('unack');
          }}
          title="Filter critical unacknowledged alerts"
        >
          <span className="stat-chip-val">{critical}</span>
          <span className="stat-chip-label">Critical Unackd</span>
        </div>
        <div
          className={`stat-chip stat-chip-amber ${ackFilter === 'unack' && severityFilter === 'all' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            handleAckFilter(ackFilter === 'unack' ? 'all' : 'unack');
            setSeverityFilter('all');
          }}
          title="Filter all unacknowledged alerts"
        >
          <span className="stat-chip-val">{unack}</span>
          <span className="stat-chip-label">Unacknowledged</span>
        </div>
        <div
          className={`stat-chip stat-chip-green ${ackFilter === 'ack' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            handleAckFilter(ackFilter === 'ack' ? 'all' : 'ack');
            setSeverityFilter('all');
          }}
          title="Filter acknowledged alerts"
        >
          <span className="stat-chip-val">{ackCount}</span>
          <span className="stat-chip-label">Acknowledged</span>
        </div>
        <div
          className={`stat-chip stat-chip-blue ${ackFilter === 'all' && severityFilter === 'all' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setAckFilter('all');
            setSeverityFilter('all');
            setTypeFilter('all');
            setSearch('');
            setPage(1);
          }}
          title="View all alerts"
        >
          <span className="stat-chip-val">{localAlerts.length}</span>
          <span className="stat-chip-label">Total Alerts</span>
        </div>
      </div>

      {error && <div className="form-error-alert">{error}</div>}

      {/* Standardized Table Toolbar (Filters & Search) */}
      <div className="table-toolbar-row">
        <div className="table-toolbar-left">
          <div className="filter-tabs">
            {[
              { id: 'all', label: 'All Status', count: localAlerts.length },
              { id: 'unack', label: 'Unacknowledged', count: unack },
              { id: 'ack', label: 'Acknowledged', count: ackCount },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                className={`filter-tab ${ackFilter === t.id ? 'active' : ''}`}
                onClick={() => handleAckFilter(t.id)}
              >
                {t.label}
                <span className="filter-tab-count">{t.count}</span>
              </button>
            ))}
          </div>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={e => handleSeverityFilter(e.target.value)}
            className="filter-select"
            style={{ minWidth: 140 }}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>

          {/* Anomaly Type */}
          <select
            value={typeFilter}
            onChange={e => handleTypeFilter(e.target.value)}
            className="filter-select"
            style={{ minWidth: 160 }}
          >
            <option value="all">All Anomaly Types</option>
            <option value="leak">Pipe Leak</option>
            <option value="water_quality">Water Quality (Turbidity)</option>
            <option value="high_flow">High Flow / Usage</option>
            <option value="battery">Low Battery</option>
            <option value="offline">Meter Offline</option>
          </select>

          {(ackFilter !== 'all' || severityFilter !== 'all' || typeFilter !== 'all' || search) && (
            <button
              type="button"
              className="filter-clear-btn"
              onClick={() => {
                setAckFilter('all');
                setSeverityFilter('all');
                setTypeFilter('all');
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
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search alerts..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="search-clear" onClick={() => handleSearch('')}>
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Type</th>
              <th>Device &amp; Zone</th>
              <th>Message</th>
              <th>Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                  No alerts found matching current filters.
                </td>
              </tr>
            )}
            {paginated.map(a => {
              const meta = formatAlertType(a.type ?? a.alertType ?? 'anomaly');
              const meter = a.meterId ?? a.deviceId;
              return (
                <tr key={a.id} className={!a.acknowledged ? 'alert-row-unack' : ''}>
                  <td>
                    <SeverityBadge severity={a.severity} />
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: meta.bg,
                        color: meta.color,
                        border: `1px solid ${meta.border}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {meta.label}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {meter ? (
                        <Link href={`/devices/${meter}`} className="table-link-mono" title={`Inspect device ${meter}`}>
                          {meter}
                        </Link>
                      ) : (
                        <span className="text-muted-sm">—</span>
                      )}
                      {a.zone && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {a.zone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ maxWidth: 300, color: '#1e293b', fontSize: '0.85rem' }}>
                    {a.message}
                  </td>
                  <td className="text-muted-sm" suppressHydrationWarning>
                    {formatLastSeen(a.createdAt)}
                  </td>
                  <td>
                    <StatusBadge acknowledged={!!a.acknowledged} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {!a.acknowledged ? (
                        <button
                          type="button"
                          className="btn-ack"
                          onClick={() => handleAcknowledge(a.id)}
                          disabled={ackingId === a.id}
                        >
                          {ackingId === a.id ? 'Ack...' : 'Acknowledge'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
                          ✓ Acknowledged
                        </span>
                      )}

                      {/* Linked Ticket or Create Ticket Button */}
                      {a.linkedTicket ? (
                        <Link
                          href={`/support-tickets/${a.linkedTicket.id}`}
                          className="btn-table-action"
                          title={`View linked ticket (${a.linkedTicket.status} - ${a.linkedTicket.technicianName || 'Unassigned'})`}
                          style={{ fontSize: '0.76rem', padding: '3px 8px' }}
                        >
                          Ticket #{a.linkedTicket.id.slice(0, 8)} &rarr;
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="btn-table-action-purple"
                          onClick={() => openDispatchModal(a)}
                          title="Create and assign a support ticket for this alert"
                          style={{ fontSize: '0.76rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                        >
                          + Ticket
                        </button>
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
          itemLabel="alerts"
        />
      </div>

      {/* ── Dispatch Support Ticket Modal ────────────────────────────────────── */}
      {dispatchModalAlert && (
        <div className="modal-backdrop" onClick={() => !dispatchSubmitting && setDispatchModalAlert(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#f0fdf9',
                  color: '#1e6b52',
                  fontSize: '1.05rem',
                  fontWeight: 700
                }}>
                  🛠️
                </span>
                <div>
                  <h3 className="modal-title" style={{ margin: 0 }}>Dispatch Technician Ticket</h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Escalate hardware alert into an actionable maintenance job
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !dispatchSubmitting && setDispatchModalAlert(null)}
                aria-label="Close dialog"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDispatchTicket}>
              <div className="modal-body">
                {dispatchError && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: '0.84rem'
                  }}>
                    {dispatchError}
                  </div>
                )}

                {/* Alert Context Summary Box */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="table-link-mono" style={{ fontSize: '0.78rem' }}>
                        {dispatchModalAlert.meterId ?? dispatchModalAlert.deviceId}
                      </span>
                      {dispatchModalAlert.zone && (
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                          ({dispatchModalAlert.zone})
                        </span>
                      )}
                    </div>
                    <SeverityBadge severity={dispatchModalAlert.severity || 'warning'} />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', fontWeight: 500 }}>
                    {dispatchModalAlert.message}
                  </p>
                </div>

                {/* Form Inputs Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                      Ticket Type
                    </label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={ticketType}
                      onChange={e => setTicketType(e.target.value)}
                      required
                    >
                      <option value="SENSOR">Sensor Anomaly (SENSOR)</option>
                      <option value="LEAK">Water Leak (LEAK)</option>
                      <option value="VALVE">Valve Fault (VALVE)</option>
                      <option value="MAINTENANCE">General Maintenance</option>
                      <option value="BILLING">Meter Discrepancy</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                      Dispatch Priority
                    </label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={ticketPriority}
                      onChange={e => setTicketPriority(e.target.value)}
                      required
                    >
                      <option value="High">High (Immediate Response)</option>
                      <option value="Medium">Medium (Standard Triage)</option>
                      <option value="Low">Low (Scheduled Inspection)</option>
                    </select>
                  </div>
                </div>

                {/* Assign Technician Dropdown */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Assign Field Technician
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={selectedTechId}
                    onChange={e => setSelectedTechId(e.target.value)}
                  >
                    <option value="">Leave unassigned (Queue in Pending)</option>
                    {(technicians || []).map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.specialization || 'Field Tech'} ({t.currentJobCount ?? 0} active {t.currentJobCount === 1 ? 'job' : 'jobs'}) {t.status === 'on_duty' ? '🟢 On Duty' : '⚪ Off Duty'}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 3, display: 'block' }}>
                    Technician will receive an automatic dispatch notification.
                  </span>
                </div>

                {/* Issue Title */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Ticket Title / Issue Summary
                  </label>
                  <input
                    type="text"
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={ticketIssue}
                    onChange={e => setTicketIssue(e.target.value)}
                    required
                  />
                </div>

                {/* Instructions / Description */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Field Repair Instructions & Notes
                  </label>
                  <textarea
                    rows={3}
                    className="filter-select"
                    style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.82rem' }}
                    value={ticketDescription}
                    onChange={e => setTicketDescription(e.target.value)}
                    required
                  />
                </div>

                {/* Auto Acknowledge Option */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    id="autoAckCheck"
                    checked={autoAcknowledgeAlert}
                    onChange={e => setAutoAcknowledgeAlert(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#1e6b52', cursor: 'pointer' }}
                  />
                  <label htmlFor="autoAckCheck" style={{ fontSize: '0.82rem', color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
                    Automatically mark alert as <strong>Acknowledged</strong> when ticket is created
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-outline-gray"
                  onClick={() => setDispatchModalAlert(null)}
                  disabled={dispatchSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-blue"
                  disabled={dispatchSubmitting}
                  style={{ minWidth: 150 }}
                >
                  {dispatchSubmitting ? 'Dispatching...' : 'Dispatch Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
