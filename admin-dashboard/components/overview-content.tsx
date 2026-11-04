import Link from 'next/link';
import { AdminShell } from './admin-shell';

export type TopTechnician = {
  id: string;
  name: string;
  repairs: number;
};

export type OverviewResponse = {
  systemStatus: string;
  stats?: {
    totalCustomers: number;
    totalTechnicians: number;
    criticalAlerts: number;
    totalTickets: number;
  };
  topTechnicians?: TopTechnician[];
  summaryCards?: Array<{ label: string; value: string }>;
  detailCards?: Array<{ label: string; value: string }>;
  recentDevices?: Array<{ id: string; customer?: string; status: string; note: string }>;
  ticketQueue?: Array<{ id: string; issue?: string; priority?: string; status: string }>;
  updatedAt: string;
};

function truncate(str: string | undefined | null, max = 48): string {
  if (!str) return 'No details';
  const trimmed = str.trim();
  return trimmed.length > max ? trimmed.slice(0, max).trimEnd() + '...' : trimmed;
}

function formatStatus(status: string): string {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function OverviewContent({
  overview,
  alerts = [],
  tickets = [],
  billing = [],
  devices = [],
}: {
  overview: OverviewResponse;
  alerts?: any[];
  tickets?: any[];
  billing?: any[];
  devices?: any[];
}) {
  const stats = overview?.stats ?? {
    totalCustomers: 0,
    totalTechnicians: 0,
    criticalAlerts: 0,
    totalTickets: 0,
  };

  const totalCustomersCount = stats.totalCustomers || 0;
  const onlineDevs = devices.filter(d => (d.connectivity ?? '').toUpperCase() === 'ONLINE').length;
  const totalDevs = devices.length;

  // Accurate active/open tickets (not resolved, closed, or cancelled)
  const openTickets = tickets.filter(t =>
    !['resolved', 'closed', 'cancelled'].includes((t.status ?? '').toLowerCase())
  ).length;

  const unackAlerts = alerts.filter(a => !a.acknowledged).length;
  const criticalUnackAlerts = alerts.filter(
    a => !a.acknowledged && (a.severity ?? '').toLowerCase() === 'critical'
  ).length;

  const unpaidBills = billing.filter(b => (b.status ?? '').toLowerCase() !== 'paid');
  const overdueBills = billing.filter(b => (b.status ?? '').toLowerCase() === 'overdue').length;
  const unpaidTotalEtb = unpaidBills.reduce((acc, b) => acc + Number(b.amountEtb ?? 0), 0);

  const topTechs: TopTechnician[] = overview.topTechnicians ?? [];

  const recentAlertsList = alerts.slice(0, 5);
  const recentTicketsList = tickets.slice(0, 5);

  return (
    <AdminShell currentPath="/" title="Operations Overview">
      <div className="section-container">
        <div className="section-header-row">
          <div>
            <h2 className="section-main-title">Operations Overview</h2>
            <p className="text-muted-sm" style={{ marginTop: 2 }}>
              Status:{' '}
              <span
                style={{
                  fontWeight: 700,
                  color: overview.systemStatus === 'Attention Required' ? '#dc2626' : '#059669',
                }}
              >
                {overview.systemStatus || 'System Stable'}
              </span>{' '}
              &middot; Last updated:{' '}
              {overview.updatedAt ? new Date(overview.updatedAt).toLocaleTimeString() : 'Just now'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/support-tickets" className="btn-primary-blue">
              Manage Tickets
            </Link>
            <Link href="/devices/new" className="btn-outline-gray">
              + Add Meter
            </Link>
          </div>
        </div>

        {/* 5 SRS Summary Metric Cards (AD-45) - Standardized Uniform Stat-Chips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {/* 1. Total Customers */}
          <div className="stat-chip stat-chip-teal" style={{ minHeight: 120, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-chip-label">Total Customers</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1e6b52" opacity="0.8">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <div className="stat-chip-val">{totalCustomersCount}</div>
            <Link href="/customers" style={{ fontSize: '0.78rem', color: '#1e6b52', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              View all customers &rarr;
            </Link>
          </div>

          {/* 2. Active Devices */}
          <div className="stat-chip stat-chip-green" style={{ minHeight: 120, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-chip-label">Active Meters</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#059669" opacity="0.8">
                <path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm-5 20c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5-4H7V4h10v13z"/>
              </svg>
            </div>
            <div className="stat-chip-val">
              {onlineDevs} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748b' }}>/ {totalDevs}</span>
            </div>
            <Link href="/devices" style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Device inventory &rarr;
            </Link>
          </div>

          {/* 3. Open Tickets */}
          <div className="stat-chip stat-chip-amber" style={{ minHeight: 120, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-chip-label">Open Tickets</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#d97706" opacity="0.8">
                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <div className="stat-chip-val">
              {openTickets} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748b' }}>open</span>
            </div>
            <Link href="/support-tickets" style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Queue & assignments &rarr;
            </Link>
          </div>

          {/* 4. Unacknowledged Alerts */}
          <div className="stat-chip stat-chip-red" style={{ minHeight: 120, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-chip-label">Alerts Unack&apos;d</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#dc2626" opacity="0.8">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
            </div>
            <div className="stat-chip-val">
              {unackAlerts}{' '}
              {criticalUnackAlerts > 0 && (
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dc2626' }}>({criticalUnackAlerts} crit)</span>
              )}
            </div>
            <Link href="/alerts" style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Review alerts &rarr;
            </Link>
          </div>

          {/* 5. Unpaid Bills */}
          <div className="stat-chip stat-chip-purple" style={{ minHeight: 120, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-chip-label">Unpaid Bills</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#7c3aed" opacity="0.8">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
              </svg>
            </div>
            <div className="stat-chip-val">
              {unpaidBills.length}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>({overdueBills} overdue)</span>
            </div>
            <span style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>ETB {unpaidTotalEtb.toLocaleString()} &middot; </span>
              <Link href="/billing" style={{ color: '#7c3aed', fontWeight: 600 }}>Billing details &rarr;</Link>
            </span>
          </div>
        </div>

        {/* Deep link panels (Recent Alerts & Recent Tickets) */}
        <div className="detail-two-col">
          {/* Recent Support Tickets */}
          <div className="table-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Recent Support Tickets</h3>
              <Link href="/support-tickets" className="link-mono" style={{ fontSize: '0.8rem' }}>
                View All &rarr;
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentTicketsList.length === 0 && (
                <p className="text-muted-sm" style={{ padding: '16px 0', textAlign: 'center' }}>No tickets in queue.</p>
              )}
              {recentTicketsList.map(t => {
                const status = (t.status ?? 'pending').toLowerCase();
                const shortId = (t.id ?? '').replace(/-/g, '').slice(0, 8).toUpperCase();
                const badgeClass =
                  status === 'resolved' || status === 'closed'
                    ? 'status-ok'
                    : status === 'pending' || status === 'open'
                    ? 'status-warn'
                    : 'status-info';

                return (
                  <Link
                    key={t.id}
                    href={`/support-tickets/${t.id}`}
                    className="overview-interactive-row"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, paddingRight: 8 }}>
                      <span className="link-mono" style={{ fontSize: '0.85rem' }}>
                        #{shortId} &middot; {t.type ?? 'General'}
                      </span>
                      <span
                        className="text-muted-sm"
                        style={{
                          fontSize: '0.8rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {t.customerName ?? 'Customer'} &middot; {truncate(t.description || t.issue, 45)}
                      </span>
                    </div>
                    <span className={`status-badge ${badgeClass}`} style={{ fontSize: '0.72rem', flexShrink: 0 }}>
                      {formatStatus(status)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="table-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Recent Alerts</h3>
              <Link href="/alerts" className="link-mono" style={{ fontSize: '0.8rem' }}>
                View All &rarr;
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentAlertsList.length === 0 && (
                <p className="text-muted-sm" style={{ padding: '16px 0', textAlign: 'center' }}>No active alerts.</p>
              )}
              {recentAlertsList.map(a => {
                const isCrit = (a.severity ?? '').toLowerCase() === 'critical';
                return (
                  <Link
                    key={a.id}
                    href="/alerts"
                    className={`overview-interactive-row ${!a.acknowledged ? 'alert-unack' : 'alert-ack'}`}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, paddingRight: 8 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isCrit ? '#dc2626' : '#0f172a' }}>
                        {a.type ?? a.alertType ?? 'Anomaly'} &middot;{' '}
                        <code className="mono-text" style={{ fontSize: '0.75rem' }}>
                          {a.meterId ?? a.deviceId ?? 'Meter'}
                        </code>
                      </span>
                      <span
                        className="text-muted-sm"
                        style={{
                          fontSize: '0.8rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {a.message}
                      </span>
                    </div>
                    <span
                      className={`status-badge ${
                        a.acknowledged
                          ? 'status-ok'
                          : isCrit
                          ? 'status-error'
                          : 'status-warn'
                      }`}
                      style={{ fontSize: '0.72rem', flexShrink: 0 }}
                    >
                      {a.acknowledged ? 'Ack' : isCrit ? 'Critical' : 'Open'}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Technicians & Key Metrics */}
        <div className="white-panel top-technicians-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="panel-card-title" style={{ margin: 0, padding: 0, border: 'none' }}>
              Field Operations Team
            </h3>
            <Link href="/technicians" className="link-mono" style={{ fontSize: '0.8rem' }}>
              Manage Technicians &rarr;
            </Link>
          </div>
          <div className="top-tech-list">
            {topTechs.length === 0 ? (
              <p className="text-muted-sm" style={{ padding: '16px 0', textAlign: 'center' }}>
                No field technicians registered yet.
              </p>
            ) : (
              topTechs.map(tech => (
                <div key={tech.id || tech.name} className="top-tech-row">
                  <span className="top-tech-name">{tech.name}</span>
                  <span className="top-tech-repairs">{tech.repairs} jobs assigned / completed</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
