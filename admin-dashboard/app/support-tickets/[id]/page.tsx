import { redirect, notFound } from 'next/navigation';
import { AdminShell } from '../../../components/admin-shell';
import { getTicket, getTechnicians, getCustomer } from '../../../lib/admin-api';
import { getServerToken } from '../../../lib/auth';
import { TicketDetailClient } from './ticket-detail-client';

function toTitleCase(str: string) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const [ticket, technicians] = await Promise.all([
      getTicket(token, id),
      getTechnicians(token),
    ]);

    if (!ticket) notFound();

    let customerName = ticket.customerName && ticket.customerName !== 'Customer' ? ticket.customerName : null;
    if (ticket.customerId && !customerName) {
      try {
        const cust = await getCustomer(token, ticket.customerId);
        if (cust?.name) customerName = cust.name;
      } catch {
        // fallback
      }
    }

    const formattedTicket = {
      ...ticket,
      customerName: customerName ? toTitleCase(customerName) : 'Customer',
    };

    return (
      <AdminShell currentPath="/support-tickets" title="Ticket Detail">
        <TicketDetailClient ticket={formattedTicket} technicians={technicians} token={token} />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    if (e.message?.includes('404') || e.message?.includes('not found')) notFound();
    return (
      <AdminShell currentPath="/support-tickets" title="Ticket Detail">
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ color: '#dc2626', marginBottom: 12 }}>Failed to load ticket</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>{e.message ?? 'An unexpected error occurred.'}</p>
          <a href="/support-tickets" style={{ color: '#2563eb', textDecoration: 'underline' }}>
            ← Back to Support Tickets
          </a>
        </div>
      </AdminShell>
    );
  }
}
