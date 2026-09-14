import { redirect } from 'next/navigation';
import { SectionPage } from '../../components/section-page';
import { getSupportTickets } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';

export default async function SupportTicketsPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const tickets = await getSupportTickets(token);
    const open = tickets.filter(t => t.status === 'open').length;
    const assigned = tickets.filter(t => t.status === 'assigned').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;

    const statusLabel = (s: string) =>
      s === 'resolved' ? 'Resolved' : s === 'assigned' ? 'Scheduled' : s === 'open' ? 'Pending' : 'In Review';

    return (
      <SectionPage
        currentPath="/support-tickets"
        title="Support Tickets"
        description="Manage service issues, assignment, and response progress across the field team."
        status={open > 5 ? 'Warning' : 'Stable'}
        stats={[
          { label: 'Open Tickets', value: String(open) },
          { label: 'Assigned', value: String(assigned) },
          { label: 'Resolved', value: String(resolved) },
          { label: 'Total', value: String(tickets.length) },
        ]}
        tableTitle="Ticket Queue"
        rows={tickets.slice(0, 10).map(t => ({
          primary: `TCK-${t.id.slice(0, 6).toUpperCase()}`,
          secondary: `${t.issue} • ${t.customerName}${t.technicianName ? ` • Assigned: ${t.technicianName}` : ''}`,
          status: statusLabel(t.status),
        }))}
      />
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
