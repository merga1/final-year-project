import { redirect, notFound } from 'next/navigation';
import { AdminShell } from '../../../components/admin-shell';
import { getTicket, getTechnicians } from '../../../lib/admin-api';
import { getServerToken } from '../../../lib/auth';
import { TicketDetailClient } from './ticket-detail-client';

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

    return (
      <AdminShell currentPath="/support-tickets" title="Ticket Detail">
        <TicketDetailClient ticket={ticket} technicians={technicians} token={token} />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    // 404 from backend → Next.js not found page
    if (e.message?.includes('404') || e.message?.includes('not found')) notFound();
    // Show error inline rather than blank white page
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
