import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getSupportTickets } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';

export default async function SupportTicketsPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const tickets = await getSupportTickets(token);

    return (
      <AdminShell currentPath="/support-tickets">
        <div className="section-container">
          <div className="section-header-row">
            <h2 className="section-main-title">Support Ticket List</h2>
          </div>

          <div className="ticket-cards-list">
            {tickets.map((t) => {
              const ticketId = t.id ? t.id.replace(/-/g, '').slice(0, 24) : '67f7de29dc4d1ecc7052d278';
              const userId = t.customerId ? t.customerId.replace(/-/g, '').slice(0, 24) : '67f7dc7ddc4d1ecc7052d28a';
              const techId = t.technicianId
                ? t.technicianId.replace(/-/g, '').slice(0, 24)
                : '67f82d233a3c8fb49f6bf502';
              const type = t.type || 'SENSOR';
              const status =
                t.status === 'resolved' || t.status === 'Resolved'
                  ? 'Resolved'
                  : 'Pending';
              const description = t.description || t.issue || 'what';

              return (
                <div key={t.id} className="ticket-detail-card">
                  <div className="ticket-field-line">
                    <span className="ticket-label">Ticket ID:</span>{' '}
                    <span className="ticket-value-mono">{ticketId}</span>
                  </div>
                  <div className="ticket-field-line">
                    <span className="ticket-label">User ID:</span>{' '}
                    <span className="ticket-value-mono">{userId}</span>
                  </div>
                  <div className="ticket-field-line">
                    <span className="ticket-label">Technician ID:</span>{' '}
                    <span className="ticket-value-mono">{techId}</span>
                  </div>
                  <div className="ticket-field-line">
                    <span className="ticket-label">Type:</span>{' '}
                    <span className="ticket-value-type">{type}</span>
                  </div>
                  <div className="ticket-field-line">
                    <span className="ticket-label">Status:</span>{' '}
                    <span className={`ticket-status-text ${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </div>
                  <div className="ticket-field-line">
                    <span className="ticket-label">Description:</span>{' '}
                    <span className="ticket-value-desc">{description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
