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
  summaryCards: Array<{ label: string; value: string }>;
  updatedAt: string;
};

export function OverviewContent({ overview }: { overview: OverviewResponse }) {
  const stats = overview.stats ?? {
    totalCustomers: 17,
    totalTechnicians: 13,
    criticalAlerts: 0,
    totalTickets: 12,
  };

  const topTechs: TopTechnician[] =
    overview.topTechnicians && overview.topTechnicians.length > 0
      ? overview.topTechnicians
      : [
          { id: '1', name: 'John Smith', repairs: 12 },
          { id: '2', name: 'Sarah Johnson', repairs: 9 },
          { id: '3', name: 'Michael Chen', repairs: 7 },
        ];

  return (
    <AdminShell currentPath="/">
      <div className="admin-dashboard-view">
        <h2 className="dashboard-section-heading">Admin Dashboard</h2>

        {/* 4 Gradient Stat Cards */}
        <div className="gradient-cards-row">
          {/* Card 1: Total Customers (Green) */}
          <div className="metric-card metric-card-green">
            <div className="metric-header">
              <span className="metric-label">Total Customers</span>
              <div className="metric-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
            </div>
            <div className="metric-value">{stats.totalCustomers}</div>
            <div className="metric-progress-track">
              <div className="metric-progress-fill" style={{ width: '35%' }} />
              <div className="metric-progress-thumb" style={{ left: '35%' }} />
            </div>
          </div>

          {/* Card 2: Total Technicians (Purple) */}
          <div className="metric-card metric-card-purple">
            <div className="metric-header">
              <span className="metric-label">Total Technicians</span>
              <div className="metric-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>
            <div className="metric-value">{stats.totalTechnicians}</div>
            <div className="metric-progress-track">
              <div className="metric-progress-fill" style={{ width: '40%' }} />
              <div className="metric-progress-thumb" style={{ left: '40%' }} />
            </div>
          </div>

          {/* Card 3: Critical Alerts (Red) */}
          <div className="metric-card metric-card-red">
            <div className="metric-header">
              <span className="metric-label">Critical Alerts</span>
              <div className="metric-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
              </div>
            </div>
            <div className="metric-value">{stats.criticalAlerts}</div>
            <div className="metric-progress-track">
              <div className="metric-progress-fill" style={{ width: '5%' }} />
              <div className="metric-progress-thumb" style={{ left: '5%' }} />
            </div>
          </div>

          {/* Card 4: Total Tickets (Lavender Blue) */}
          <div className="metric-card metric-card-lavender">
            <div className="metric-header">
              <div className="metric-header-stack">
                <span className="metric-label">Total Tickets</span>
                <span className="metric-sublabel">Overall count</span>
              </div>
              <div className="metric-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
            </div>
            <div className="metric-value">{stats.totalTickets}</div>
            <div className="metric-progress-track">
              <div className="metric-progress-fill" style={{ width: '25%' }} />
              <div className="metric-progress-thumb" style={{ left: '25%' }} />
            </div>
          </div>
        </div>

        {/* Top Technicians Section */}
        <div className="white-panel top-technicians-card">
          <h3 className="panel-card-title">Top Technicians</h3>
          <div className="top-tech-list">
            {topTechs.map((tech) => (
              <div key={tech.id || tech.name} className="top-tech-row">
                <span className="top-tech-name">{tech.name}</span>
                <span className="top-tech-repairs">{tech.repairs} repairs</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
