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

    // Enrich with open ticket count (any ticket that is not resolved, closed, or cancelled)
    const enriched = (techs || []).map((tech: any) => {
      const openCount = (tickets || []).filter(
        (t: any) =>
          t.technicianId === tech.id &&
          !['resolved', 'closed', 'cancelled'].includes((t.status ?? '').toLowerCase())
      ).length;

      return {
        ...tech,
        openTickets: openCount,
        openJobsCount: openCount,
      };
    });

    return (
      <AdminShell currentPath="/technicians" title="Technicians">
        <TechniciansClient technicians={enriched} token={token} />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED' || e.message?.includes('401')) redirect('/login');
    return (
      <AdminShell currentPath="/technicians" title="Technicians">
        <TechniciansClient technicians={[]} token={token} />
      </AdminShell>
    );
  }
}
