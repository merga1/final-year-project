import { redirect } from 'next/navigation';
import { OverviewContent } from '../components/overview-content';
import { getOverview, getAlerts, getSupportTickets, getBilling, getDevices } from '../lib/admin-api';
import { getServerToken } from '../lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const [overview, alerts, tickets, billing, devices] = await Promise.all([
      getOverview(token).catch(err => {
        if (err.message === 'UNAUTHORIZED') throw err;
        return {
          systemStatus: 'System Stable',
          stats: { totalCustomers: 0, totalTechnicians: 0, criticalAlerts: 0, totalTickets: 0 },
          topTechnicians: [],
          updatedAt: new Date().toISOString(),
        };
      }),
      getAlerts(token).catch(() => []),
      getSupportTickets(token).catch(() => []),
      getBilling(token).catch(() => []),
      getDevices(token).catch(() => []),
    ]);

    return (
      <OverviewContent
        overview={overview}
        alerts={alerts}
        tickets={tickets}
        billing={billing}
        devices={devices}
      />
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
