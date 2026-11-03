import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getAlerts, getDevices } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';
import { AlertsClient } from './alerts-client';

export default async function AlertsPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const [alerts, devices] = await Promise.all([
      getAlerts(token),
      getDevices(token).catch(() => []),
    ]);

    const deviceMap = new Map((devices || []).map((d: any) => [d.meterId ?? d.id, d]));

    const enriched = (alerts || []).map((a: any) => {
      const dev = deviceMap.get(a.meterId ?? a.deviceId);
      return {
        ...a,
        zone: dev?.zone || null,
        customerId: dev?.customerId || null,
      };
    });

    return (
      <AdminShell currentPath="/alerts" title="Alerts">
        <AlertsClient alerts={enriched} token={token} />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
