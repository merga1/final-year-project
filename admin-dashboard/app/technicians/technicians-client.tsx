'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function DutyBadge({ status }: { status: string }) {
  const on = (status ?? '').toLowerCase() === 'on_duty' || (status ?? '').toLowerCase() === 'onduty';
  return (
    <span className={`status-badge ${on ? 'status-ok' : 'status-muted'}`}>
      {on ? 'On Duty' : 'Off Duty'}
    </span>
  );
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}

export function TechniciansClient({
  technicians,
  token,
}: {
  technicians: any[];
  token: string;
}) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [dutyFilter, setDutyFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [search, setSearch] = useState('');

  const onDutyCount = technicians.filter(t => (t.status ?? '').toLowerCase() === 'on_duty' || (t.status ?? '').toLowerCase() === 'onduty').length;
  const offDutyCount = technicians.length - onDutyCount;
  const totalOpen = technicians.reduce((acc, t) => acc + (t.openJobsCount ?? 0), 0);

  const filtered = technicians.filter(t => {
    const isOn = (t.status ?? '').toLowerCase() === 'on_duty' || (t.status ?? '').toLowerCase() === 'onduty';
    if (dutyFilter === 'on_duty' && !isOn) return false;
    if (dutyFilter === 'off_duty' && isOn) return false;

    const openJobs = t.openJobsCount ?? 0;
    if (jobFilter === 'has_jobs' && openJobs === 0) return false;
    if (jobFilter === 'available' && openJobs > 0) return false;

    if (!search) return true;
    const q = search.toLowerCase();
    const name = (t.name ?? `${t.firstName ?? ''} ${t.lastName ?? ''}`).toLowerCase();
    const email = (t.email ?? '').toLowerCase();
    const spec = (t.specialization ?? '').toLowerCase();
    return name.includes(q) || email.includes(q) || spec.includes(q);
  });

  async function handleToggleStatus(tech: any) {
    const isCurrentlyOn = (tech.status ?? '').toLowerCase() === 'on_duty' || (tech.status ?? '').toLowerCase() === 'onduty';
    const newStatus = isCurrentlyOn ? 'off_duty' : 'on_duty';
    setTogglingId(tech.id);
    setError('');
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/u{FEFF}/u, '').trim();
      const t = getCookie('sw_token') || token;
      const res = await fetch(`${API}/api/admin/technicians/${tech.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed');
      router.refresh();
    } catch {
      setError('Could not update status. Please try again.');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="section-container">
      <div className="section-header-row">
        <div>
          <h2 className="section-main-title">Technicians</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {filtered.length} of {technicians.length} technicians shown
          </span>
        </div>
        <Link href="/technicians/new" className="btn-primary-blue">+ Add Technician</Link>
      </div>

      <div className="stats-strip">
        <div
          className={`stat-chip stat-chip-blue ${dutyFilter === 'all' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setDutyFilter('all')}
          title="Click to view all technicians"
        >
          <span className="stat-chip-val">{technicians.length}</span>
          <span className="stat-chip-label">Total</span>
        </div>
        <div
          className={`stat-chip stat-chip-green ${dutyFilter === 'on_duty' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setDutyFilter(dutyFilter === 'on_duty' ? 'all' : 'on_duty')}
          title="Filter On Duty technicians"
        >
          <span className="stat-chip-val">{onDutyCount}</span>
          <span className="stat-chip-label">On Duty</span>
        </div>
        <div
          className={`stat-chip stat-chip-muted ${dutyFilter === 'off_duty' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setDutyFilter(dutyFilter === 'off_duty' ? 'all' : 'off_duty')}
          title="Filter Off Duty technicians"
        >
          <span className="stat-chip-val">{offDutyCount}</span>
          <span className="stat-chip-label">Off Duty</span>
        </div>
        <div
          className={`stat-chip stat-chip-amber ${jobFilter === 'has_jobs' ? 'active-chip' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setJobFilter(jobFilter === 'has_jobs' ? 'all' : 'has_jobs')}
          title="Filter technicians with active jobs"
        >
          <span className="stat-chip-val">{totalOpen}</span>
          <span className="stat-chip-label">Open Jobs</span>
        </div>
      </div>

      {error && <div className="form-error-alert">{error}</div>}

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div className="tab-pill-group">
          {[
            { id: 'all', label: 'All' },
            { id: 'on_duty', label: `On Duty (${onDutyCount})` },
            { id: 'off_duty', label: `Off Duty (${offDutyCount})` },
          ].map(t => (
            <button
              key={t.id}
              className={`tab-pill ${dutyFilter === t.id ? 'active' : ''}`}
              onClick={() => setDutyFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={jobFilter}
          onChange={e => setJobFilter(e.target.value)}
          className="filter-select"
          style={{ minWidth: 160 }}
        >
          <option value="all">All Workloads</option>
          <option value="has_jobs">Active Jobs &gt; 0</option>
          <option value="available">Available (0 Jobs)</option>
        </select>

        {(dutyFilter !== 'all' || jobFilter !== 'all' || search) && (
          <button
            className="filter-clear-btn"
            onClick={() => { setDutyFilter('all'); setJobFilter('all'); setSearch(''); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Search */}
      <div className="search-bar-wrap" style={{ marginBottom: 16 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, email, or specialization..."
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
              <th>Name</th>
              <th>Email</th>
              <th>Specialization</th>
              <th>Status</th>
              <th>Open Jobs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                  No technicians found matching current filters.
                </td>
              </tr>
            )}
            {filtered.map(tech => {
              const isOn = (tech.status ?? '').toLowerCase() === 'on_duty' || (tech.status ?? '').toLowerCase() === 'onduty';
              const name = tech.name ?? (`${tech.firstName ?? ''} ${tech.lastName ?? ''}`.trim() || 'Technician');
              const openJobs = tech.openJobsCount ?? 0;
              return (
                <tr key={tech.id}>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{name}</td>
                  <td className="text-muted-sm">{tech.email ?? '—'}</td>
                  <td className="text-muted-sm">{tech.specialization ?? 'General Field Service'}</td>
                  <td><DutyBadge status={tech.status} /></td>
                  <td>
                    <span className={`count-badge ${openJobs > 0 ? 'count-badge-amber' : 'count-badge-muted'}`}>
                      {openJobs}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        className={isOn ? 'btn-toggle-off' : 'btn-toggle-on'}
                        onClick={() => handleToggleStatus(tech)}
                        disabled={togglingId === tech.id}
                      >
                        {togglingId === tech.id ? 'Updating...' : isOn ? 'Set Off Duty' : 'Set On Duty'}
                      </button>
                      <Link
                        href={`/support-tickets?techId=${tech.id}`}
                        className="btn-table-action-purple"
                        title={`View ${name}'s tickets`}
                      >
                        Tickets
                      </Link>
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
