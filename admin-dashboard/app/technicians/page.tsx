import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getTechnicians, getSupportTickets } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';
import { TechniciansClient } from './technicians-client';

export default async function TechniciansPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const [techs, tickets] = await Promise.all([
      getTechnicians(token),
      getSupportTickets(token).catch(() => []),
    ]);

    // Enrich with open ticket count
    const enriched = techs.map((tech: any) => ({
      ...tech,
      openTickets: tickets.filter(
        (t: any) => t.technicianId === tech.id &&
          ['assigned', 'accepted'].includes((t.status ?? '').toLowerCase())
      ).length,
    }));

    return (
      <AdminShell currentPath="/technicians" title="Technicians">
        <TechniciansClient technicians={enriched} token={token} />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
