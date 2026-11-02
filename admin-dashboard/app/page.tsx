import { redirect } from 'next/navigation';
import { OverviewContent } from '../components/overview-content';
import { getOverview, getAlerts, getSupportTickets, getBilling, getDevices } from '../lib/admin-api';
import { getServerToken } from '../lib/auth';

export default async function HomePage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const [overview, alerts, tickets, billing, devices] = await Promise.all([
      getOverview(token),
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
