import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getSupportTickets, getTechnicians, getCustomers } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';
import { TicketsClient } from './tickets-client';

function toTitleCase(str: string) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function SupportTicketsPage({
  searchParams,
}: {
  searchParams?: Promise<{ techId?: string; customerId?: string }>;
}) {
  const token = await getServerToken();
  if (!token) redirect('/login');

  const resolvedParams = searchParams ? await searchParams : {};

  try {
    const [tickets, technicians, customers] = await Promise.all([
      getSupportTickets(token),
      getTechnicians(token),
      getCustomers(token).catch(() => []),
    ]);

    const customerMap = new Map((customers || []).map((c: any) => [c.id, c]));
    const techMap = new Map((technicians || []).map((t: any) => [t.id, t]));

    const enriched = (tickets || []).map((ticket: any) => {
      const cust = ticket.customerId ? customerMap.get(ticket.customerId) : null;
      let realCustName = cust?.name || (cust?.firstName ? `${cust.firstName} ${cust.lastName}` : null);
      if (!realCustName && ticket.customerName && ticket.customerName !== 'Customer') {
        realCustName = ticket.customerName;
      }

      const tech = ticket.technicianId ? techMap.get(ticket.technicianId) : null;
      const realTechName = tech
        ? (tech.name ?? `${tech.firstName ?? ''} ${tech.lastName ?? ''}`.trim())
        : ticket.technicianName;

      return {
        ...ticket,
        customerName: realCustName ? toTitleCase(realCustName) : 'Customer',
        technicianName: realTechName,
      };
    });

    return (
      <AdminShell currentPath="/support-tickets" title="Support Tickets">
        <TicketsClient
          tickets={enriched}
          technicians={technicians}
          customers={customers}
          token={token}
          initialTechId={resolvedParams.techId}
          initialCustomerId={resolvedParams.customerId}
        />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED' || e.message?.includes('401')) redirect('/login');
    return (
      <AdminShell currentPath="/support-tickets" title="Support Tickets">
        <TicketsClient
          tickets={[]}
          technicians={[]}
          customers={[]}
          token={token}
        />
      </AdminShell>
    );
  }
}
