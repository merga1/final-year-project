import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getSupportTickets, getTechnicians, getCustomers } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';
import { TicketsClient } from './tickets-client';

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

    return (
      <AdminShell currentPath="/support-tickets" title="Support Tickets">
        <TicketsClient
          tickets={tickets}
          technicians={technicians}
          customers={customers}
          token={token}
          initialTechId={resolvedParams.techId}
          initialCustomerId={resolvedParams.customerId}
        />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
