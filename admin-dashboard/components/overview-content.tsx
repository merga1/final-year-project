import { AdminShell } from './admin-shell';

type SummaryCard = {
  label: string;
  value: string;
};

type RecentDevice = {
  id: string;
  customer: string;
  status: 'Online' | 'Warning' | 'Offline';
  note: string;
};

type Ticket = {
  id: string;
  issue: string;
  priority: 'High' | 'Medium' | 'Low';
};

export type OverviewResponse = {
  systemStatus: string;
  summaryCards: SummaryCard[];
  recentDevices: RecentDevice[];
  ticketQueue: Ticket[];
  updatedAt: string;
};

function formatUtcTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

export function OverviewContent({ overview }: { overview: OverviewResponse }) {
  return (
    <AdminShell
      currentPath="/"
      title="Operations Overview"
      description="Monitor water usage, quality, support, and billing from one dashboard."
      status={overview.systemStatus}
    >
      <section className="grid">
        {overview.summaryCards.map((card) => (
          <article className="card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="panels">
        <article className="panel">
          <h3>Recent Device Status</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentDevices.map((device) => (
                <tr key={device.id}>
                  <td>{device.id}</td>
                  <td>{device.customer}</td>
                  <td>
                    <span
                      className={`badge ${
                        device.status === 'Online'
                          ? 'ok'
                          : device.status === 'Warning'
                            ? 'warn'
                            : 'danger'
                      }`}
                    >
                      {device.status}
                    </span>
                  </td>
                  <td>{device.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="panel">
          <h3>Priority Tickets</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Issue</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {overview.ticketQueue.map((ticket) => (
                <tr key={ticket.id}>
                  <td>{ticket.id}</td>
                  <td>{ticket.issue}</td>
                  <td>
                    <span className={`badge ${ticket.priority === 'High' ? 'danger' : 'warn'}`}>
                      {ticket.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>

      <p style={{ color: 'var(--muted)', marginTop: 16 }}>
        Last backend update: {formatUtcTimestamp(overview.updatedAt)}
      </p>
    </AdminShell>
  );
}
