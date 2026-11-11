import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getAlerts, getDevices, getTechnicians, getCustomers, getSupportTickets } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';
import { AlertsClient } from './alerts-client';

export default async function AlertsPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const [alerts, devices, technicians, customers, tickets] = await Promise.all([
      getAlerts(token),
      getDevices(token).catch(() => []),
      getTechnicians(token).catch(() => []),
      getCustomers(token).catch(() => []),
      getSupportTickets(token).catch(() => []),
    ]);

    const deviceMap = new Map((devices || []).map((d: any) => [d.meterId ?? d.id, d]));
    const customerMap = new Map((customers || []).map((c: any) => [c.id, c]));

    const enriched = (alerts || []).map((a: any) => {
      const dev = deviceMap.get(a.meterId ?? a.deviceId);
      const cust = dev?.customerId ? customerMap.get(dev.customerId) : null;
      // Check if there is an active support ticket for this device
      const matchingTicket = (tickets || []).find((t: any) =>
        (t.deviceId === (a.meterId ?? a.deviceId) || t.customerId === dev?.customerId) &&
        !['resolved', 'closed'].includes((t.status ?? '').toLowerCase())
      );

      return {
        ...a,
        zone: dev?.zone || null,
        customerId: dev?.customerId || null,
        customerName: cust?.name || null,
        linkedTicket: matchingTicket ? {
          id: matchingTicket.id,
          status: matchingTicket.status,
          technicianName: matchingTicket.technicianName,
        } : null,
      };
    });

    return (
      <AdminShell currentPath="/alerts" title="Alerts">
        <AlertsClient
          alerts={enriched}
          technicians={technicians || []}
          customers={customers || []}
          token={token}
        />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED' || e.message?.includes('401')) redirect('/login');
    return (
      <AdminShell currentPath="/alerts" title="Alerts">
        <AlertsClient
          alerts={[]}
          technicians={[]}
          customers={[]}
          token={token}
        />
      </AdminShell>
    );
  }
}
